import { useEffect, useRef, useState, type FormEvent } from 'react'
import { localize, type Page } from '../content'
import { useLang, useTr, type Lang } from '../i18n'
import { interviewerPrompt, streamGemini, tutorPrompt, type ChatMessage } from '../gemini'
import { readLocal, writeLocal } from '../store'
import { Markdown } from './Markdown'

type Mode = 'ask' | 'mock'

const MOCK_SECONDS = 45 * 60

const QUICK: Record<Lang, Record<Page['kind'], string[]>> = {
  hi: {
    topic: ['Isko aur simple example se samjhao', 'Mujhe 3 interview sawal poochho, ek-ek karke', 'Main explain karta hoon, tum grade karna'],
    lld: ['Is pattern ka ek aur real-life example do', 'Ek chhota LLD problem do jisme ye pattern lage', 'Mera code review karo (main paste karta hoon)'],
    question: ['Is design ka sabse weak point kya hai?', 'Interviewer is design pe kaunse 5 follow-up poochega?', 'Step 10 ke decisions ka ek aur alternative batao'],
  },
  en: {
    topic: ['Explain this with a simpler example', 'Ask me 3 interview questions, one at a time', 'Let me explain it, then grade me'],
    lld: ['Give me another real-life example of this pattern', 'Give me a small LLD problem that needs this pattern', 'Review my code (I will paste it)'],
    question: ['What is the weakest point of this design?', 'Which 5 follow-ups will the interviewer ask on this design?', 'Give another alternative for the Step 10 decisions'],
  },
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function ChatPanel({
  page: source,
  mode,
  hasKey,
  onOpenSettings,
}: {
  page: Page
  mode: Mode
  hasKey: boolean
  onOpenSettings: () => void
}) {
  const { lang } = useLang()
  const tr = useTr()
  const page = localize(source, lang)
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

  const system = mode === 'mock' ? interviewerPrompt(page.title, page.body, lang) : tutorPrompt(page.title, page.body, lang)

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
      const next: ChatMessage[] = [...history, { role: 'model', text: reply || tr('(khaali jawab aaya)', '(empty reply)') }]
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
    send(tr('Namaste, main ready hoon. Interview shuru karte hain.', "Hi, I'm ready. Let's start the interview."), [])
  }

  if (!hasKey) {
    return (
      <div className="panel-body empty">
        <p>
          {mode === 'mock'
            ? tr(
                'Mock interview me Gemini interviewer banke 45 min ka round lega aur end me score dega.',
                'In a mock interview, Gemini plays the interviewer for a 45-min round and scores you at the end.',
              )
            : tr('Is page ke baare me Gemini se kuch bhi poochho. Jawab yahin screen pe aayega.', 'Ask Gemini anything about this page. The answer shows up right here.')}
        </p>
        <button className="btn primary" onClick={onOpenSettings}>
          {tr('Gemini key daalo', 'Add Gemini key')}
        </button>
      </div>
    )
  }

  const remaining = startedAt ? Math.max(0, MOCK_SECONDS - Math.floor((now - startedAt) / 1000)) : MOCK_SECONDS

  if (mode === 'mock' && !messages.length) {
    return (
      <div className="panel-body empty">
        <p>
          {lang === 'en' ? (
            <>
              A 45-min mock interview for <b>{page.title}</b>. The interviewer will not give requirements; you have to ask. Type <code>END</code>{' '}
              to finish and get a scorecard.
            </>
          ) : (
            <>
              <b>{page.title}</b> ka 45 min mock interview. Interviewer requirements khud nahi batayega, aapko poochne honge. Khatam karne ke liye{' '}
              <code>END</code> likho, scorecard milega.
            </>
          )}
        </p>
        <button className="btn primary" onClick={startMock} disabled={busy}>
          {tr('Mock interview shuru karo', 'Start mock interview')}
        </button>
      </div>
    )
  }

  return (
    <div className="panel-body chat">
      {mode === 'mock' && (
        <div className={`timer ${remaining < 300 ? 'late' : ''}`}>
          <span className="mono">{fmt(remaining)}</span>
          <span className="muted small">{remaining === 0 ? tr('Time khatam. END likho.', 'Time is up. Type END.') : tr('baaki', 'left')}</span>
          <button className="btn small" onClick={() => send(tr('END. Ab mujhe scorecard do.', 'END. Please give me my scorecard.'))} disabled={busy}>
            End &amp; score
          </button>
        </div>
      )}
      <div className="messages">
        {!messages.length && (
          <div className="quick">
            {QUICK[lang][page.kind].map((q) => (
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
        {busy && <div className="msg model">{streaming ? <Markdown text={streaming} showAllCode /> : <span className="muted">{tr('soch raha hai…', 'thinking…')}</span>}</div>}
        {error && (
          <div className="error small">
            {error}{' '}
            <button className="link small" onClick={onOpenSettings}>
              {tr('Settings kholo', 'Open settings')}
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <textarea
          id={`chat-${mode}-${page.slug}`}
          aria-label={mode === 'mock' ? tr('Interviewer ko jawab', 'Reply to the interviewer') : tr('Gemini se sawal', 'Question for Gemini')}
          rows={2}
          value={input}
          placeholder={mode === 'mock' ? tr('Interviewer ko jawab do…', 'Reply to the interviewer…') : tr('Is page ke baare me poochho…', 'Ask about this page…')}
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
              {mode === 'mock' ? tr('Naya interview', 'New interview') : tr('Chat saaf karo', 'Clear chat')}
            </button>
          )}
          {busy ? (
            <button type="button" className="btn small" onClick={() => abortRef.current?.abort()}>
              {tr('Roko', 'Stop')}
            </button>
          ) : (
            <button type="submit" className="btn primary small" disabled={!input.trim()}>
              {tr('Bhejo', 'Send')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
