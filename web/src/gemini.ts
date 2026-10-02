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
export const DEFAULT_MODEL = 'gemini-2.5-flash'

// The key stays in this browser only. It is never written to Firestore or the repo.
export const getGeminiSettings = (): GeminiSettings =>
  readLocal(SETTINGS_KEY, { apiKey: '', model: DEFAULT_MODEL })

export const saveGeminiSettings = (s: GeminiSettings) => writeLocal(SETTINGS_KEY, s)

/** Streams a reply from Gemini, calling onChunk with the full text so far */
export async function streamGemini(
  system: string,
  history: ChatMessage[],
  onChunk: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { apiKey, model } = getGeminiSettings()
  if (!apiKey) throw new Error('Gemini API key nahi mili. Settings me apni key daalo.')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model || DEFAULT_MODEL,
  )}:streamGenerateContent?alt=sse`

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      generationConfig: { temperature: 0.6 },
    }),
  })

  if (!res.ok || !res.body) {
    let detail = `${res.status}`
    try {
      detail = (await res.json())?.error?.message ?? detail
    } catch {
      /* keep status code */
    }
    if (res.status === 400 || res.status === 403) throw new Error(`Gemini ne key reject kar di: ${detail}`)
    if (res.status === 404) throw new Error(`Model "${model}" nahi mila. Settings me model name check karo.`)
    if (res.status === 429) throw new Error('Gemini rate limit lag gayi. Thodi der baad try karo.')
    throw new Error(`Gemini error: ${detail}`)
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

export function tutorPrompt(title: string, body: string): string {
  return `You are a friendly system design (HLD) interview coach helping an Indian software engineer prepare for interviews in 1 week.
Reply in simple Hinglish (Roman script Hindi mixed with English tech terms), short and crisp, with bullet points where useful.
Use the study page below as the main context. If the question goes beyond it, answer from general system design knowledge and say so.
When a diagram helps, use a mermaid code block (flowchart LR or sequenceDiagram, all node labels in double quotes).

=== Study page: ${title} ===
${body}`
}

export function interviewerPrompt(title: string, body: string): string {
  return `You are a senior engineer at a top tech company running a 45-minute system design (HLD) interview.
The question is: "${title}". Speak in simple Hinglish (Roman script Hindi + English tech terms), like a real Indian interviewer.

Rules:
- Start by stating the question in 1-2 lines only. Do NOT give requirements upfront; let the candidate ask clarifying questions and answer them like a real interviewer.
- Ask ONE thing at a time. Keep each message short (2-5 lines).
- Push in this order: requirements → estimation (only if useful) → entities/APIs → high-level design → 2-3 deep dives → failures → wrap-up.
- Probe weak spots with follow-ups ("Agar Redis down ho jaye to?", "Ye DB kyun, wo kyun nahi?").
- Never reveal the full answer. Give small hints only if the candidate is stuck twice.
- When the candidate says "END" or asks for a score, give a scorecard: Requirements, High-level design, Deep dives, Trade-offs, Communication, each out of 10 with one line why, then 3 concrete things to improve, and a hire/no-hire signal for SDE-2 level.

Hidden reference answer (use it to judge, never paste it):
${body}`
}
