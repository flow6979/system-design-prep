import { useEffect, useMemo, useRef, useState } from 'react'
import { localize, pageBySlug, route } from '../content'
import { useLang, useTr } from '../i18n'
import { readLocal, useStore, writeLocal } from '../store'
import { generateQuestions, loadBank, SECTIONS, thinnestTopic, topicsOf, type QuizQuestion, type Section } from '../quizBank'
import { Markdown } from './Markdown'
import { QuizAsk } from './QuizAsk'
import { shortTitle } from './Sidebar'

type Filter = 'all' | Section | 'starred'
const LABEL: Record<Filter, { hi: string; en: string }> = {
  all: { hi: 'Sab', en: 'All' },
  hld: { hi: 'HLD', en: 'HLD' },
  lld: { hi: 'LLD', en: 'LLD' },
  java: { hi: 'Java', en: 'Java' },
  db: { hi: 'Databases', en: 'Databases' },
  cs: { hi: 'CS', en: 'CS' },
  rag: { hi: 'RAG', en: 'RAG' },
  agents: { hi: 'Agentic AI', en: 'Agentic AI' },
  starred: { hi: '⭐ Starred', en: '⭐ Starred' },
}
// Start generating the next batch while this many unanswered questions are still left
const PREFETCH_AT = 3

export function Quiz({ hasKey, onOpenSettings }: { hasKey: boolean; onOpenSettings: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const { user, quiz, answerQuiz, starQuiz } = useStore()
  const [bank, setBank] = useState<QuizQuestion[] | null>(null)
  const [filter, setFilter] = useState<Filter>(() => readLocal('hld.quiz.section', 'all'))
  const [topic, setTopic] = useState<string>(() => readLocal('hld.quiz.topic', ''))
  const [retry, setRetry] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const genFor = useRef('')

  useEffect(() => {
    loadBank().then(setBank)
  }, [])

  const inFilter = useMemo(() => {
    if (!bank) return []
    if (filter === 'starred') return bank.filter((q) => quiz.s.includes(q.id))
    return bank.filter((q) => (filter === 'all' || q.section === filter) && (!topic || q.topic === topic))
  }, [bank, filter, topic, quiz.s])

  // Unanswered first; starred and retry modes revisit answered ones
  const queue = useMemo(() => {
    if (filter === 'starred') return inFilter
    if (retry) return inFilter.filter((q) => quiz.a[q.id] === 0)
    return inFilter.filter((q) => quiz.a[q.id] === undefined)
  }, [inFilter, filter, retry, quiz.a])

  const current = (currentId && bank?.find((q) => q.id === currentId)) || queue[0] || null
  const answered = inFilter.filter((q) => quiz.a[q.id] !== undefined)
  const right = answered.filter((q) => quiz.a[q.id] === 1).length
  const wrong = answered.length - right

  // Keep the quiz endless: when few questions are left, write the next batch in the background
  const section: Section | 'all' = filter === 'starred' ? 'all' : filter
  const needMore = !!bank && filter !== 'starred' && !retry && queue.length <= PREFETCH_AT
  useEffect(() => {
    if (!needMore || !hasKey || generating || !bank) return
    const page = thinnestTopic(section, bank, topic || undefined)
    if (!page) return
    const key = `${section}:${topic}:${bank.length}`
    if (genFor.current === key) return
    genFor.current = key
    setGenerating(true)
    setGenError('')
    generateQuestions(page, bank, user?.uid ?? null)
      .then((fresh) => setBank((b) => [...(b ?? []), ...fresh]))
      .catch(() => setGenError(tr('Naye sawal nahi ban paaye. Thodi der baad dobara aana.', 'Could not create new questions. Try again in a bit.')))
      .finally(() => setGenerating(false))
  }, [needMore, hasKey, generating, bank, section, topic, user, tr])

  function choose(f: Filter) {
    setFilter(f)
    setTopic('')
    setRetry(false)
    setCurrentId(null)
    setPicked(null)
    writeLocal('hld.quiz.section', f)
    writeLocal('hld.quiz.topic', '')
  }

  function chooseTopic(t: string) {
    setTopic(t)
    setCurrentId(null)
    setPicked(null)
    writeLocal('hld.quiz.topic', t)
  }

  function answer(i: number) {
    if (!current || picked !== null) return
    setPicked(i)
    setCurrentId(current.id)
    answerQuiz(current.id, i === current.answer)
  }

  function next() {
    const rest = queue.filter((q) => q.id !== current?.id)
    if (filter === 'starred' && current) {
      // Starred mode cycles through the bucket
      const i = inFilter.findIndex((q) => q.id === current.id)
      setCurrentId(inFilter[(i + 1) % inFilter.length]?.id ?? null)
    } else setCurrentId(rest[0]?.id ?? null)
    setPicked(null)
  }

  const starred = current ? quiz.s.includes(current.id) : false
  const topics = filter !== 'all' && filter !== 'starred' ? topicsOf(filter) : []
  const page = current ? pageBySlug.get(current.topic) : undefined
  const pct = answered.length ? Math.round((right / answered.length) * 100) : 0

  return (
    <div className="quiz">
      <h1>Quiz</h1>

      <div className="quiz-sections" role="tablist" aria-label={tr('Section', 'Section')}>
        {(['all', ...SECTIONS, 'starred'] as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => choose(f)}>
            {LABEL[f][lang]}
            {f === 'starred' && quiz.s.length > 0 && <span className="count">{quiz.s.length}</span>}
          </button>
        ))}
      </div>

      <div className="quiz-bar">
        {topics.length > 0 && (
          <select id="quiz-topic" className="quiz-topic" value={topic} onChange={(e) => chooseTopic(e.target.value)} aria-label={tr('Topic', 'Topic')}>
            <option value="">{tr('Saare topics', 'All topics')}</option>
            {topics.map((p) => (
              <option key={p.slug} value={p.slug}>
                {shortTitle(localize(p, lang).title)}
              </option>
            ))}
          </select>
        )}
        <span className="quiz-score mono small">
          <span className="ok-text">✓ {right}</span> <span className="error">✗ {wrong}</span> {answered.length > 0 && <span className="muted">· {pct}%</span>}
        </span>
        {filter !== 'starred' && wrong > 0 && (
          <button className={`chip ${retry ? 'on' : ''}`} onClick={() => (setRetry((r) => !r), setCurrentId(null), setPicked(null))}>
            {tr('Galat wale dobara', 'Retry wrong')} · {wrong}
          </button>
        )}
      </div>

      {!bank ? (
        <p className="muted">{tr('Sawal load ho rahe hain…', 'Loading questions…')}</p>
      ) : current ? (
        <article className="quiz-card">
          <div className="quiz-meta">
            <span className="muted small">
              {page ? shortTitle(localize(page, lang).title) : current.topic} · {current.level}
              {current.ai ? ' · AI' : ''}
            </span>
            <button
              className={`quiz-star ${starred ? 'on' : ''}`}
              onClick={() => starQuiz(current.id, !starred)}
              aria-pressed={starred}
              title={starred ? tr('Star hatao', 'Unstar') : tr('Revision ke liye star karo', 'Star for revision')}
            >
              {starred ? '★' : '☆'}
            </button>
          </div>
          <div className="quiz-q">
            <Markdown text={current.q[lang]} showAllCode />
          </div>
          <ol className="quiz-options" type="A">
            {current.options[lang].map((o, i) => {
              const state = picked === null ? '' : i === current.answer ? 'right' : i === picked ? 'wrong' : 'dim'
              return (
                <li key={i}>
                  <button className={`quiz-option ${state}`} onClick={() => answer(i)} disabled={picked !== null}>
                    <span className="opt-key mono">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">
                      <Markdown text={o} showAllCode />
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          {picked !== null && (
            <div className={`quiz-why ${picked === current.answer ? 'right' : 'wrong'}`}>
              <b>{picked === current.answer ? tr('Sahi!', 'Correct!') : tr('Galat.', 'Not quite.')}</b> <Markdown text={current.why[lang]} showAllCode />
              {page && (
                <a href={route(page)} className="small">
                  {tr('Topic padho →', 'Read the topic →')}
                </a>
              )}
            </div>
          )}
          <QuizAsk question={current} answered={picked !== null} hasKey={hasKey} onOpenSettings={onOpenSettings} />
          {picked !== null && (
            <div className="row end">
              <button className="btn primary" onClick={next}>
                {tr('Agla', 'Next')} →
              </button>
            </div>
          )}
        </article>
      ) : (
        <div className="quiz-empty">
          {filter === 'starred' ? (
            <p className="muted">{tr('Abhi koi sawal star nahi kiya. Kisi bhi sawal pe ☆ dabao, wo yahan aa jayega.', 'No starred questions yet. Tap ☆ on any question to save it here.')}</p>
          ) : generating ? (
            <p className="muted">{tr('Naye sawal ban rahe hain…', 'Writing new questions…')}</p>
          ) : !hasKey ? (
            <>
              <p className="muted">{tr('Is section ke saare sawal ho gaye. AI set up karo to naye sawal apne aap bante rahenge.', 'You have answered everything here. Set up AI and new questions will keep coming.')}</p>
              <button className="btn primary" onClick={onOpenSettings}>
                {tr('AI set up karo', 'Set up AI')}
              </button>
            </>
          ) : (
            <p className="muted">{genError || tr('Naye sawal ban rahe hain…', 'Writing new questions…')}</p>
          )}
        </div>
      )}
      {generating && current && <p className="muted small">{tr('Agle sawal background me ban rahe hain…', 'Preparing the next questions in the background…')}</p>}
      {!user && <p className="muted small">{tr('Login karoge to score aur ⭐ har device pe saath rahenge.', 'Log in to keep your score and ⭐ on every device.')}</p>}
    </div>
  )
}
