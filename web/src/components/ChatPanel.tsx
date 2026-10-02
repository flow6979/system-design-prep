import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Page } from '../content'
import { interviewerPrompt, streamGemini, tutorPrompt, type ChatMessage } from '../gemini'
import { readLocal, writeLocal } from '../store'
import { Markdown } from './Markdown'

type Mode = 'ask' | 'mock'

const MOCK_SECONDS = 45 * 60

const QUICK: Record<Page['kind'], string[]> = {
  topic: [
    'Isko aur simple example se samjhao',
    'Mujhe 3 interview sawal poochho, ek-ek karke',
    'Main explain karta hoon, tum grade karna',
  ],
  lld: [
    'Is pattern ka ek aur real-life example do',
    'Ek chhota LLD problem do jisme ye pattern lage',
    'Mera code review karo (main paste karta hoon)',
  ],
  question: [
    'Is design ka sabse weak point kya hai?',
    'Interviewer is design pe kaunse 5 follow-up poochega?',
    'Step 10 ke decisions ka ek aur alternative batao',
  ],
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function ChatPanel({
  page,
  mode,
  hasKey,
  onOpenSettings,
}: {
  page: Page
  mode: Mode
  hasKey: boolean
  onOpenSettings: () => void
}) {
  const storeKey = `hld.chat.${mode}.${page.slug}`
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocal(storeKey, []))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(() => readLocal(`${storeKey}.start`, null))
  const [now, setNow] = useState(Date.now())
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(readLocal(storeKey, []))
    setStartedAt(readLocal(`${storeKey}.start`, null))
    setError('')
    setStreaming('')
    abortRef.current?.abort()
  }, [storeKey])

  useEffect(() => {
    if (mode !== 'mock' || !startedAt) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [mode, startedAt])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, streaming])

  const system = mode === 'mock' ? interviewerPrompt(page.title, page.body) : tutorPrompt(page.title, page.body)

  async function send(text: string, base = messages) {
    const content = text.trim()
    if (!content || busy) return
    const history: ChatMessage[] = [...base, { role: 'user', text: content }]
    setMessages(history)
    setInput('')
    setError('')
    setBusy(true)
    setStreaming('')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const reply = await streamGemini(system, history, setStreaming, ctrl.signal)
      const next: ChatMessage[] = [...history, { role: 'model', text: reply || '(khaali jawab aaya)' }]
      setMessages(next)
      writeLocal(storeKey, next)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
      writeLocal(storeKey, history)
    } finally {
      setBusy(false)
      setStreaming('')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function clear() {
    abortRef.current?.abort()
    setMessages([])
    setStartedAt(null)
    writeLocal(storeKey, [])
    writeLocal(`${storeKey}.start`, null)
  }

  function startMock() {
    const t = Date.now()
    setStartedAt(t)
    setNow(t)
    writeLocal(`${storeKey}.start`, t)
    send('Namaste, main ready hoon. Interview shuru karte hain.', [])
  }

  if (!hasKey) {
    return (
      <div className="panel-body empty">
        <p>
          {mode === 'mock'
            ? 'Mock interview me Gemini interviewer banke 45 min ka round lega aur end me score dega.'
            : 'Is page ke baare me Gemini se kuch bhi poochho. Jawab yahin screen pe aayega.'}
        </p>
        <button className="btn primary" onClick={onOpenSettings}>
          Gemini key daalo
        </button>
      </div>
    )
  }

  const remaining = startedAt ? Math.max(0, MOCK_SECONDS - Math.floor((now - startedAt) / 1000)) : MOCK_SECONDS

  if (mode === 'mock' && !messages.length) {
    return (
      <div className="panel-body empty">
        <p>
          <b>{page.title}</b> ka 45 min mock interview. Interviewer requirements khud nahi batayega, aapko poochne honge. Khatam karne ke
          liye <code>END</code> likho, scorecard milega.
        </p>
        <button className="btn primary" onClick={startMock} disabled={busy}>
          Mock interview shuru karo
        </button>
      </div>
    )
  }

  return (
    <div className="panel-body chat">
      {mode === 'mock' && (
        <div className={`timer ${remaining < 300 ? 'late' : ''}`}>
          <span className="mono">{fmt(remaining)}</span>
          <span className="muted small">{remaining === 0 ? 'Time khatam. END likho.' : 'baaki'}</span>
          <button className="btn small" onClick={() => send('END. Ab mujhe scorecard do.')} disabled={busy}>
            End &amp; score
          </button>
        </div>
      )}
      <div className="messages">
        {!messages.length && (
          <div className="quick">
            {QUICK[page.kind].map((q) => (
              <button key={q} className="chip" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
        {messages
          .filter((m, i) => !(mode === 'mock' && i === 0))
          .map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === 'model' ? <Markdown text={m.text} showAllCode /> : m.text}
            </div>
          ))}
        {busy && <div className="msg model">{streaming ? <Markdown text={streaming} showAllCode /> : <span className="muted">soch raha hai…</span>}</div>}
        {error && (
          <div className="error small">
            {error}{' '}
            <button className="link small" onClick={onOpenSettings}>
              Settings kholo
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <textarea
          id={`chat-${mode}-${page.slug}`}
          aria-label={mode === 'mock' ? 'Interviewer ko jawab' : 'Gemini se sawal'}
          rows={2}
          value={input}
          placeholder={mode === 'mock' ? 'Interviewer ko jawab do…' : 'Is page ke baare me poochho…'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
        />
        <div className="row end">
          {messages.length > 0 && (
            <button type="button" className="link small" onClick={clear}>
              {mode === 'mock' ? 'Naya interview' : 'Chat saaf karo'}
            </button>
          )}
          {busy ? (
            <button type="button" className="btn small" onClick={() => abortRef.current?.abort()}>
              Roko
            </button>
          ) : (
            <button type="submit" className="btn primary small" disabled={!input.trim()}>
              Bhejo
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
