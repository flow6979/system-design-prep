import { useEffect, useRef, useState, type FormEvent } from 'react'
import { localize, pageBySlug } from '../content'
import { streamGemini, type ChatMessage } from '../gemini'
import { useLang, useTr, type Lang } from '../i18n'
import type { QuizQuestion } from '../quizBank'
import { Markdown } from './Markdown'

function quizPrompt(q: QuizQuestion, lang: Lang, answered: boolean): string {
  const page = pageBySlug.get(q.topic)
  const local = page ? localize(page, lang) : undefined
  const opts = q.options[lang].map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')
  const key = answered
    ? `Correct answer: ${String.fromCharCode(65 + q.answer)}. Explanation: ${q.why[lang]}`
    : `Correct answer: ${String.fromCharCode(65 + q.answer)} — the student has NOT answered yet. Do not reveal it or hint which option is right, even if asked; help them understand the concepts and terms instead.`
  return `You are a friendly interview coach. A student preparing for software engineering interviews is stuck on a quiz question.
${lang === 'en' ? 'Reply in simple, clear English' : 'Reply in simple Hinglish (Roman script Hindi mixed with English tech terms)'}. Keep it short (under ~150 words unless they ask for more), use bullets and a tiny real example where it helps.
Explain any jargon in the question (e.g. what "redirect", "301/302" mean) from first principles. Ground the answer in the study page below; if you go beyond it, say so.

=== Quiz question ===
${q.q[lang]}
${opts}
${key}

=== Study page: ${local?.title ?? q.topic} ===
${local?.body ?? ''}`
}

/** Ask Gemini about the current quiz question, with the topic page as context */
export function QuizAsk({ question, answered, hasKey, onOpenSettings }: { question: QuizQuestion; answered: boolean; hasKey: boolean; onOpenSettings: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Fresh conversation for every question
  useEffect(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreaming('')
    setError('')
    setBusy(false)
    setOpen(false)
  }, [question.id])

  const quick = answered
    ? [tr('Har option sahi/galat kyun hai, samjhao', 'Explain why each option is right or wrong'), tr('Isko real example se samjhao', 'Explain with a real example')]
    : [tr('Ye sawal kis baare me hai? Simple me samjhao', 'What is this question about? Explain simply'), tr('Isme jo terms hain unka matlab batao', 'Explain the terms used here')]

  async function send(text: string) {
    const t = text.trim()
    if (!t || busy) return
    const history: ChatMessage[] = [...messages, { role: 'user', text: t }]
    setMessages(history)
    setInput('')
    setBusy(true)
    setError('')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const reply = await streamGemini(quizPrompt(question, lang, answered), history, setStreaming, ctrl.signal)
      if (!ctrl.signal.aborted) setMessages([...history, { role: 'model', text: reply }])
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (!ctrl.signal.aborted) {
        setStreaming('')
        setBusy(false)
      }
    }
  }

  if (!open)
    return (
      <button type="button" className="quiz-ask-btn" onClick={() => setOpen(true)}>
        <span aria-hidden="true">✦</span> {tr('Samajh nahi aaya? AI se poochho', 'Confused? Ask AI')}
      </button>
    )

  return (
    <section className="quiz-ask" aria-label={tr('AI se poochho', 'Ask AI')}>
      <div className="quiz-ask-head">
        <b>
          <span aria-hidden="true">✦</span> {tr('AI se poochho', 'Ask AI')}
        </b>
        <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={tr('Band karo', 'Close')}>
          ✕
        </button>
      </div>
      {!hasKey ? (
        <p className="small">
          {tr('Iske liye AI set up karna hoga.', 'This needs AI to be set up.')}{' '}
          <button type="button" className="link-btn" onClick={onOpenSettings}>
            {tr('Set up karo', 'Set up')}
          </button>
        </p>
      ) : (
        <>
          {messages.map((m, i) => (
            <div key={i} className={`quiz-ask-msg ${m.role}`}>
              {m.role === 'user' ? m.text : <Markdown text={m.text} showAllCode />}
            </div>
          ))}
          {streaming && (
            <div className="quiz-ask-msg model">
              <Markdown text={streaming} showAllCode />
            </div>
          )}
          {busy && !streaming && <p className="muted small">{tr('Soch raha hai…', 'Thinking…')}</p>}
          {error && <p className="error small">{error}</p>}
          {messages.length === 0 && (
            <div className="row wrap">
              {quick.map((q) => (
                <button key={q} type="button" className="chip" onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            className="quiz-ask-form"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              send(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr('Jo samajh nahi aaya, poochho… (jaise "redirect matlab?")', 'Ask anything… (e.g. "what is a redirect?")')}
              aria-label={tr('Sawal', 'Question')}
            />
            <button className="btn primary" disabled={busy || !input.trim()}>
              {tr('Poochho', 'Ask')}
            </button>
          </form>
          {!answered && <p className="muted small">{tr('Jawab dene se pehle AI sahi option nahi batayega, sirf concept samjhayega.', 'Before you answer, AI explains the concept but will not reveal the option.')}</p>}
        </>
      )}
    </section>
  )
}
