import { useMemo, useRef, useState } from 'react'
import rawQuiz from '../../../content/quiz.json'
import { allPages, localize, pageBySlug, route } from '../content'
import { generateJson, streamGemini } from '../gemini'
import { useLang, useTr, type Lang } from '../i18n'
import { readLocal, writeLocal } from '../store'
import { Markdown } from './Markdown'
import { shortTitle } from './Sidebar'

type Text = { hi: string; en: string }
interface QuizItem {
  id: string
  category: 'hld' | 'lld'
  level: 'easy' | 'medium' | 'hard'
  prompt: Text
  patterns: { hi: string[]; en: string[] }
  why: Text
  links: string[]
  ai?: boolean
}
type Filter = 'all' | 'hld' | 'lld'
type Result = 'right' | 'wrong'

const BUILT_IN = rawQuiz as QuizItem[]
const GEN_KEY = 'hld.quiz.generated'
const RESULT_KEY = 'hld.quiz.results'

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const isText = (v: unknown): v is Text => !!v && typeof (v as Text).hi === 'string' && typeof (v as Text).en === 'string'

/** Keep only well-formed AI items, with links limited to pages that exist */
function sanitize(raw: unknown, category: 'hld' | 'lld'): QuizItem[] {
  const list = Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items ?? []
  return list.flatMap((r: any, i: number) => {
    if (!isText(r?.prompt) || !isText(r?.why) || !Array.isArray(r?.patterns?.hi) || !Array.isArray(r?.patterns?.en)) return []
    return [
      {
        id: `ai-${Date.now().toString(36)}-${i}`,
        category: r.category === 'lld' || r.category === 'hld' ? r.category : category,
        level: ['easy', 'medium', 'hard'].includes(r.level) ? r.level : 'medium',
        prompt: r.prompt,
        patterns: { hi: r.patterns.hi.map(String).slice(0, 5), en: r.patterns.en.map(String).slice(0, 5) },
        why: r.why,
        links: (Array.isArray(r.links) ? r.links.map(String) : []).filter((s: string) => pageBySlug.has(s)).slice(0, 3),
        ai: true,
      } satisfies QuizItem,
    ]
  })
}

function generationPrompt(category: 'hld' | 'lld', existing: QuizItem[]): string {
  const slugs = allPages.filter((p) => (category === 'lld' ? p.kind === 'lld' : p.kind !== 'lld')).map((p) => `${p.slug} (${p.title})`)
  return `Create 3 NEW pattern-spotting quiz questions for ${category === 'lld' ? 'low-level design (OOP, SOLID, design patterns)' : 'system design (HLD)'} interview practice.
Each is a short real-world scenario (Indian apps welcome: Swiggy, Zerodha, PhonePe, IPL, Hotstar…) where the candidate must name which patterns apply.
Do not repeat these existing scenarios: ${existing
    .slice(-40)
    .map((q) => q.prompt.en)
    .join(' | ')}

Return a JSON array of 3 objects with exactly this shape:
{"category":"${category}","level":"easy|medium|hard","prompt":{"hi":"Hinglish (Roman script), 1-2 lines","en":"English, 1-2 lines"},"patterns":{"hi":["2-4 items"],"en":["2-4 items"]},"why":{"hi":"1-2 lines","en":"1-2 lines"},"links":["1-3 slugs from the list"]}
Tech terms stay in English in both languages. Valid slugs: ${slugs.join(', ')}`
}

function checkPrompt(item: QuizItem, answer: string, lang: Lang): string {
  return `${lang === 'en' ? 'Reply in simple English.' : 'Reply in simple Hinglish (Roman script).'} Keep it under 120 words.
A candidate is practising pattern spotting for system design / LLD interviews.
Scenario: ${item.prompt.en}
Expected patterns: ${item.patterns.en.join(', ')} (${item.why.en})
Candidate's answer: ${answer}
Say what they got right, what they missed, and one line they should say in an interview. Accept other valid patterns if they are justified.`
}

export function Quiz({ hasKey, onOpenSettings }: { hasKey: boolean; onOpenSettings: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const [generated, setGenerated] = useState<QuizItem[]>(() => readLocal(GEN_KEY, []))
  const [results, setResults] = useState<Record<string, Result>>(() => readLocal(RESULT_KEY, {}))
  const [filter, setFilter] = useState<Filter>(() => readLocal('hld.quiz.filter', 'all'))
  const [order, setOrder] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [shown, setShown] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState<'' | 'check' | 'generate'>('')
  const [error, setError] = useState('')
  const abort = useRef<AbortController | null>(null)

  const all = useMemo(() => [...BUILT_IN, ...generated], [generated])
  const pool = useMemo(() => all.filter((q) => filter === 'all' || q.category === filter), [all, filter])
  const items = useMemo(() => {
    if (!order) return pool
    const byId = new Map(pool.map((q) => [q.id, q]))
    const ordered = order.map((id) => byId.get(id)).filter((q): q is QuizItem => !!q)
    // Items added after shuffling (e.g. AI ones) go to the end
    return [...ordered, ...pool.filter((q) => !order.includes(q.id))]
  }, [pool, order])
  const item = items[Math.min(index, Math.max(0, items.length - 1))]
  const right = pool.filter((q) => results[q.id] === 'right').length
  const wrong = pool.filter((q) => results[q.id] === 'wrong').length

  function reset() {
    abort.current?.abort()
    setAnswer('')
    setShown(false)
    setFeedback('')
    setError('')
    setBusy('')
  }

  function go(i: number) {
    reset()
    setIndex((i + items.length) % items.length)
  }

  function changeFilter(f: Filter) {
    setFilter(f)
    writeLocal('hld.quiz.filter', f)
    setOrder(null)
    reset()
    setIndex(0)
  }

  function mark(r: Result) {
    const next = { ...results, [item.id]: r }
    setResults(next)
    writeLocal(RESULT_KEY, next)
    go(index + 1)
  }

  async function check() {
    if (!hasKey) return onOpenSettings()
    setBusy('check')
    setError('')
    setFeedback('')
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      await streamGemini('You are a concise interview coach.', [{ role: 'user', text: checkPrompt(item, answer, lang) }], setFeedback, ctrl.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  async function generate() {
    if (!hasKey) return onOpenSettings()
    const category = filter === 'lld' ? 'lld' : filter === 'hld' ? 'hld' : Math.random() < 0.7 ? 'hld' : 'lld'
    setBusy('generate')
    setError('')
    try {
      const fresh = sanitize(await generateJson<unknown>(generationPrompt(category, all)), category)
      if (!fresh.length) throw new Error(tr('AI ne sahi format me sawal nahi diye. Dobara try karo.', 'The AI did not return valid questions. Try again.'))
      const next = [...generated, ...fresh]
      setGenerated(next)
      writeLocal(GEN_KEY, next)
      reset()
      // New items land at the end of the current list; jump to the first one
      setIndex(items.length)
    } catch (e) {
      setError((e as Error).message)
      setBusy('')
    }
  }

  function removeGenerated() {
    setGenerated([])
    writeLocal(GEN_KEY, [])
    reset()
    setIndex(0)
  }

  const levelLabel = { easy: tr('aasaan', 'easy'), medium: 'medium', hard: tr('mushkil', 'hard') }

  return (
    <div className="quiz">
      <span className="eyebrow">
        Pattern quiz · {items.length ? index + 1 : 0}/{items.length}
      </span>
      <h1>{tr('Kaunse patterns lagenge?', 'Which patterns apply?')}</h1>
      <p className="muted">
        {tr(
          'Problem padho, 30 second me bolo ya likho kaunse patterns lagenge, phir answer dekho. Naya problem pehchanne ki skill isi se aati hai.',
          'Read the problem, say or write which patterns apply within 30 seconds, then check the answer. This is how you learn to recognise new problems.',
        )}
      </p>

      <div className="quiz-bar">
        <div className="seg small" role="radiogroup" aria-label={tr('Category', 'Category')}>
          {(['all', 'hld', 'lld'] as Filter[]).map((f) => (
            <button key={f} role="radio" aria-checked={filter === f} className={filter === f ? 'on' : ''} onClick={() => changeFilter(f)}>
              {{ all: tr('Sab', 'All'), hld: 'HLD', lld: 'LLD' }[f]}
            </button>
          ))}
        </div>
        <span className="quiz-score small">
          <span className="ok-text">✓ {right}</span> · <span className="error">✗ {wrong}</span> · {tr('baaki', 'left')} {pool.length - right - wrong}
        </span>
        <button
          className="btn small"
          onClick={() => {
            setOrder(shuffle(pool.map((q) => q.id)))
            reset()
            setIndex(0)
          }}
        >
          {tr('Shuffle karo', 'Shuffle')}
        </button>
      </div>

      {item && (
        <div className="quiz-card">
          <div className="row wrap">
            <span className="tag">{item.category.toUpperCase()}</span>
            <span className="tag">{levelLabel[item.level]}</span>
            {item.ai && <span className="tag ai">AI</span>}
            {results[item.id] && (
              <span className={`small ${results[item.id] === 'right' ? 'ok-text' : 'error'}`}>
                {results[item.id] === 'right' ? tr('Pichli baar aaya tha', 'Got it last time') : tr('Pichli baar nahi aaya tha', 'Missed it last time')}
              </span>
            )}
          </div>
          <p className="quiz-prompt">{item.prompt[lang]}</p>

          <textarea
            id="quiz-answer"
            className="quiz-input"
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={tr('Apna answer likho (optional): jaise "Redis lock + TTL, idempotency"…', 'Write your answer (optional): e.g. "Redis lock + TTL, idempotency"…')}
            aria-label={tr('Aapka answer', 'Your answer')}
          />

          {!shown ? (
            <div className="row wrap">
              <button className="btn primary" onClick={() => setShown(true)}>
                {tr('Answer dikhao', 'Show answer')}
              </button>
            </div>
          ) : (
            <div className="quiz-answer">
              <ul>
                {item.patterns[lang].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="muted">{item.why[lang]}</p>
              {item.links.length > 0 && (
                <div className="row wrap">
                  {item.links.map((slug) => {
                    const p = pageBySlug.get(slug)
                    return p ? (
                      <a key={slug} className="chip" href={route(p)}>
                        {shortTitle(localize(p, lang).title)}
                      </a>
                    ) : null
                  })}
                </div>
              )}
              {answer.trim() && (
                <div className="quiz-ai">
                  {!feedback && busy !== 'check' && (
                    <button className="btn small" onClick={check}>
                      {hasKey ? tr('AI se mera answer check karao', 'Check my answer with AI') : tr('AI check ke liye Gemini key daalo', 'Add a Gemini key to check with AI')}
                    </button>
                  )}
                  {busy === 'check' && !feedback && <span className="muted small">{tr('AI check kar raha hai…', 'AI is checking…')}</span>}
                  {feedback && <Markdown text={feedback} showAllCode />}
                </div>
              )}
              <div className="row wrap quiz-mark">
                <span className="muted small">{tr('Aapko aaya?', 'Did you get it?')}</span>
                <button className="btn small ok" onClick={() => mark('right')}>
                  ✓ {tr('Haan, aaya', 'Yes')}
                </button>
                <button className="btn small bad" onClick={() => mark('wrong')}>
                  ✗ {tr('Nahi aaya', 'No')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="error small">{error}</p>}

      <div className="row wrap">
        <button className="btn" onClick={() => go(index - 1)} disabled={!items.length}>
          ← {tr('Pichla', 'Previous')}
        </button>
        <button className="btn" onClick={() => go(index + 1)} disabled={!items.length}>
          {tr('Agla', 'Next')} →
        </button>
      </div>

      <section className="quiz-gen">
        <h2>{tr('Aur sawal chahiye?', 'Want more questions?')}</h2>
        <p className="muted small">
          {tr(
            `Gemini ${filter === 'lld' ? 'LLD' : filter === 'hld' ? 'HLD' : 'HLD/LLD'} ke 3 naye sawal banayega, English aur Hinglish dono me. Ye is browser me save rehte hain.`,
            `Gemini will write 3 new ${filter === 'lld' ? 'LLD' : filter === 'hld' ? 'HLD' : 'HLD/LLD'} questions in both English and Hinglish. They stay saved in this browser.`,
          )}
        </p>
        <div className="row wrap">
          <button className="btn primary" onClick={generate} disabled={busy === 'generate'}>
            {busy === 'generate' ? tr('Bana raha hai…', 'Generating…') : hasKey ? tr('AI se 3 naye sawal banao', 'Generate 3 questions with AI') : tr('Gemini key daalo', 'Add Gemini key')}
          </button>
          {generated.length > 0 && (
            <button className="link small" onClick={removeGenerated}>
              {tr(`AI wale ${generated.length} sawal hatao`, `Remove ${generated.length} AI questions`)}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
