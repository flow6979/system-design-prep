import { useEffect, useState } from 'react'
import { readLocal, writeLocal } from './store'

export interface GeminiSettings {
  apiKey: string
  model: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const SETTINGS_KEY = 'hld.gemini'
const API = 'https://generativelanguage.googleapis.com/v1beta'
// Alias that Google keeps pointed at the current Flash model, so retirements don't break the app
export const DEFAULT_MODEL = 'gemini-flash-latest'

// The key stays in this browser only. It is never written to Firestore or the repo.
export const getGeminiSettings = (): GeminiSettings =>
  readLocal(SETTINGS_KEY, { apiKey: '', model: DEFAULT_MODEL })

// One place for the Gemini key: the top-bar settings. Everything else (chat, quiz, agent labs) reads it
// and listens for this event, so a change applies everywhere at once.
export const GEMINI_EVENT = 'viewinter:gemini'
export const OPEN_SETTINGS_EVENT = 'viewinter:open-settings'

export type ConnectionStatus = { state: 'ok' | 'error'; model: string; message?: string; at: number }
const STATUS_KEY = 'hld.gemini.status'

export const getConnectionStatus = (): ConnectionStatus | null => readLocal(STATUS_KEY, null)

function setConnectionStatus(status: ConnectionStatus | null) {
  writeLocal(STATUS_KEY, status)
  window.dispatchEvent(new CustomEvent(GEMINI_EVENT))
}

export function saveGeminiSettings(s: GeminiSettings) {
  const prev = getGeminiSettings()
  writeLocal(SETTINGS_KEY, s)
  // A new key or model has not been tested yet
  if (prev.apiKey !== s.apiKey || prev.model !== s.model) setConnectionStatus(null)
  else window.dispatchEvent(new CustomEvent(GEMINI_EVENT))
}

/** Lets any screen (e.g. an agent lab) open the central settings dialog */
export const openSettings = () => window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))

/** Sends one tiny request with the saved key and records whether it worked */
export async function testConnection(): Promise<ConnectionStatus> {
  try {
    await streamGemini('Reply with the single word OK.', [{ role: 'user', text: 'ping' }], () => {})
    const status: ConnectionStatus = { state: 'ok', model: getGeminiSettings().model, at: Date.now() }
    setConnectionStatus(status)
    return status
  } catch (e) {
    const status: ConnectionStatus = { state: 'error', model: getGeminiSettings().model, message: (e as Error).message, at: Date.now() }
    setConnectionStatus(status)
    return status
  }
}

// Errors surface in the UI, so they follow the language switch
const L = (hi: string, en: string) => (readLocal<string>('hld.lang', 'hi') === 'en' ? en : hi)

/** Text models this key can call, newest-looking first */
export async function listModels(apiKey: string): Promise<string[]> {
  const res = await fetch(`${API}/models?pageSize=1000`, { headers: { 'x-goog-api-key': apiKey } })
  if (!res.ok) throw new Error(L(`Model list nahi mili (${res.status}). Key check karo.`, `Could not load models (${res.status}). Check your key.`))
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] }
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => n.startsWith('gemini') && !/(image|tts|audio|live|embedding|robotics|computer-use)/.test(n))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

/** Prefers the Flash alias, then the newest stable Flash, then any Flash */
export function pickModel(models: string[]): string | undefined {
  if (models.includes(DEFAULT_MODEL)) return DEFAULT_MODEL
  const flash = models.filter((m) => m.includes('flash') && !m.includes('lite'))
  return flash.find((m) => !/(preview|exp)/.test(m)) ?? flash[0] ?? models[0]
}

function request(model: string, apiKey: string, system: string, history: ChatMessage[], signal?: AbortSignal) {
  return fetch(`${API}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      generationConfig: { temperature: 0.6 },
    }),
  })
}

/** Streams a reply from Gemini, calling onChunk with the full text so far */
export async function streamGemini(
  system: string,
  history: ChatMessage[],
  onChunk: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { apiKey, model: saved } = getGeminiSettings()
  if (!apiKey) throw new Error(L('Gemini API key nahi mili. Settings me apni key daalo.', 'No Gemini API key found. Add your key in Settings.'))
  let model = saved || DEFAULT_MODEL

  let res = await request(model, apiKey, system, history, signal)

  // Saved model retired or unavailable for this key: switch to one the key can use, remember it, retry once
  if (res.status === 404) {
    const fallback = pickModel(await listModels(apiKey).catch(() => []))
    if (fallback && fallback !== model) {
      model = fallback
      writeLocal(SETTINGS_KEY, { apiKey, model })
      window.dispatchEvent(new CustomEvent(GEMINI_EVENT))
      res = await request(model, apiKey, system, history, signal)
    }
  }

  if (!res.ok || !res.body) {
    let detail = `${res.status}`
    try {
      detail = (await res.json())?.error?.message ?? detail
    } catch {
      /* keep status code */
    }
    if (res.status === 400 || res.status === 403) throw new Error(L(`Gemini ne key reject kar di: ${detail}`, `Gemini rejected the key: ${detail}`))
    if (res.status === 404) throw new Error(
        L(`Model "${model}" nahi mila. Settings me "Models dikhao" se koi aur model chuno.`, `Model "${model}" not found. Pick another one with "Show models" in Settings.`),
      )
    if (res.status === 429) throw new Error(L('AI ki rate limit lag gayi. Thodi der baad try karo.', 'AI rate limit hit. Try again in a bit.'))
    throw new Error(`AI error: ${detail}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      try {
        const json = JSON.parse(line.slice(5))
        const parts = json?.candidates?.[0]?.content?.parts ?? []
        for (const p of parts) if (typeof p.text === 'string') text += p.text
        onChunk(text)
      } catch {
        /* partial line, wait for more */
      }
    }
  }
  return text
}

const replyIn = (lang: 'hi' | 'en') =>
  lang === 'en'
    ? 'Reply in simple, clear English'
    : 'Reply in simple Hinglish (Roman script Hindi mixed with English tech terms)'

export function tutorPrompt(title: string, body: string, lang: 'hi' | 'en' = 'hi'): string {
  return `You are a friendly system design and LLD interview coach helping an Indian software engineer prepare for interviews in 1 week.
${replyIn(lang)}, short and crisp, with bullet points where useful. For code, use Java unless the user asks for C++.
Use the study page below as the main context. If the question goes beyond it, answer from general system design knowledge and say so.
When a diagram helps, use a mermaid code block (flowchart LR or sequenceDiagram, all node labels in double quotes).

=== Study page: ${title} ===
${body}`
}

export function interviewerPrompt(title: string, body: string, lang: 'hi' | 'en' = 'hi'): string {
  return `You are a senior engineer at a top tech company running a 45-minute system design (HLD) interview.
The question is: "${title}". ${replyIn(lang)}, like a real interviewer at an Indian tech company.

Rules:
- Start by stating the question in 1-2 lines only. Do NOT give requirements upfront; let the candidate ask clarifying questions and answer them like a real interviewer.
- Ask ONE thing at a time. Keep each message short (2-5 lines).
- Push in this order: requirements → estimation (only if useful) → entities/APIs → high-level design → 2-3 deep dives → failures → wrap-up.
- Probe weak spots with follow-ups (e.g. "What if Redis goes down?", "Why this DB and not that one?").
- Never reveal the full answer. Give small hints only if the candidate is stuck twice.
- When the candidate says "END" or asks for a score, give a scorecard: Requirements, High-level design, Deep dives, Trade-offs, Communication, each out of 10 with one line why, then 3 concrete things to improve, and a hire/no-hire signal for SDE-2 level.

Hidden reference answer (use it to judge, never paste it):
${body}`
}

/** One-shot call that must return JSON (used to generate quiz questions) */
export async function generateJson<T>(prompt: string, signal?: AbortSignal): Promise<T> {
  let raw = ''
  await streamGemini('Return only valid JSON. No markdown, no code fences, no commentary.', [{ role: 'user', text: prompt }], (t) => (raw = t), signal)
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error(L('AI ka jawab samajh nahi aaya. Dobara try karo.', 'Could not read the AI reply. Please try again.'))
  }
}

/** Current key/model and last test result; re-renders when settings change anywhere */
export function useGemini(): { settings: GeminiSettings; status: ConnectionStatus | null } {
  const read = () => ({ settings: getGeminiSettings(), status: getConnectionStatus() })
  const [state, setState] = useState(read)
  useEffect(() => {
    const on = () => setState(read())
    window.addEventListener(GEMINI_EVENT, on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener(GEMINI_EVENT, on)
      window.removeEventListener('storage', on)
    }
  }, [])
  return state
}
