import { useRef, useState } from 'react'
import { allPages, localize, pageBySlug, route } from '../content'
import { generateJson } from '../gemini'
import { useLang, useTr, type Lang } from '../i18n'
import { useResumeAnswers, type AnswerRecord, type Feedback } from '../resumeStore'
import { readLocal, useStore, writeLocal } from '../store'
import { Markdown } from './Markdown'
import { Icon, type IconName } from './Icon'
import { shortTitle } from './Sidebar'

type Cat = 'project' | 'tech' | 'design' | 'behavioral'
interface ResumeQ {
  id: string
  cat: Cat
  level: 'easy' | 'medium' | 'hard'
  q: string
  checks: string
  points: string[]
  related?: string
}
interface Saved {
  fileName: string
  text: string
  questions: ResumeQ[]
}
type T2 = { hi: string; en: string }
interface CommonQ {
  id: string
  group: string
  q: T2
  checks: T2
  points: { hi: string[]; en: string[] }
  tip?: T2
}
/** What a question card needs, whichever list it came from */
interface CardQ {
  id: string
  group: string
  groupLabel: string
  level?: string
  q: string
  checks?: string
  points?: string[]
  tip?: string
  related?: string
}

// Resume text stays in this browser only (personal data); the AI gets it with the user's own key
const KEY = 'hld.resume'
const MAX_CHARS = 20000

const commonFiles = import.meta.glob('../../../content/resume/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const COMMON: CommonQ[] = Object.values(commonFiles).flatMap((v) => (Array.isArray(v) ? (v as CommonQ[]) : []))

const CATS: Record<Cat, T2> = {
  project: { hi: 'Projects', en: 'Projects' },
  tech: { hi: 'Tech / skills', en: 'Tech / skills' },
  design: { hi: 'System design', en: 'System design' },
  behavioral: { hi: 'Behavioral', en: 'Behavioral' },
}
const GROUPS: Record<string, T2> = {
  impact: { hi: 'Impact', en: 'Impact' },
  project: { hi: 'Projects', en: 'Projects' },
  decisions: { hi: 'Decisions', en: 'Decisions' },
  failure: { hi: 'Bugs & failures', en: 'Bugs & failures' },
  ownership: { hi: 'Ownership', en: 'Ownership' },
  team: { hi: 'Team', en: 'Team' },
  growth: { hi: 'Learning', en: 'Learning' },
  career: { hi: 'Career', en: 'Career' },
}
const groupLabel = (g: string, lang: Lang) => (CATS[g as Cat] ?? GROUPS[g])?.[lang] ?? g

const replyIn = (lang: Lang) => (lang === 'en' ? 'simple, clear English' : 'simple Hinglish (Roman script Hindi mixed with English tech terms)')

function questionPrompt(text: string, existing: ResumeQ[], count: number, lang: Lang): string {
  const pages = allPages.map((p) => `${p.slug}: ${p.title}`).join('\n')
  return `You are a senior interviewer at an Indian product company. Read the candidate's resume and write ${count} NEW interview questions that an interviewer would ask about THIS resume.
Mix: ~40% "project" (deep dives into their projects: why this design, scale numbers, what broke, what they would change, their exact contribution), ~25% "tech" (skills and tools they list, probed at the depth their claims imply), ~20% "design" (system design questions grown out of their projects, e.g. "how would you scale X to 10x"), ~15% "behavioral" (conflicts, ownership, failures, tied to their actual roles).
Make every question specific: name the project, company, metric or tool from the resume. Spot vague or inflated claims ("improved performance by 40%") and ask how it was measured.
Write in ${replyIn(lang)}; keep tech terms in English.
${existing.length ? `Do not repeat or rephrase these existing questions:\n${existing.map((q) => `- ${q.q}`).join('\n')}\n` : ''}
For "related", pick the single most relevant study page slug from this list, or "" if none fits:
${pages}

Return a JSON array of objects: {"cat": "project"|"tech"|"design"|"behavioral", "level": "easy"|"medium"|"hard", "q": "the question", "checks": "one line: what the interviewer is checking", "points": ["3-5 short key points a strong answer covers"], "related": "slug or empty"}

=== Resume ===
${text.slice(0, MAX_CHARS)}`
}

function feedbackPrompt(q: CardQ, answer: string, resume: string | undefined, lang: Lang): string {
  return `You are a friendly but strict interview coach at an Indian product company. Grade the candidate's answer to an interview question about their experience.
Write every text field in ${replyIn(lang)}. Be concrete; quote their words when pointing at a problem.
Scoring (0-10): 9-10 = specific, own contribution clear ("I"), numbers/impact, trade-offs, structured (STAR); 6-8 = good but missing depth or numbers; 3-5 = vague or generic; 0-2 = off-topic or empty.

Return ONLY JSON: {"score": <integer 0-10>, "verdict": "one line summary", "good": ["1-3 things that worked"], "improve": ["2-4 specific things to fix or add, most important first"], "better": "a tight 5-8 line model answer in first person built from THEIR answer${resume ? ' and resume' : ''}; never invent numbers, use placeholders like <X%> they must fill in"}

Question: ${q.q}
${q.checks ? `Interviewer checks: ${q.checks}` : ''}
${q.points?.length ? `A strong answer covers: ${q.points.join('; ')}` : ''}

Candidate's answer:
${answer}
${resume ? `\n=== Candidate's resume (for context) ===\n${resume.slice(0, MAX_CHARS)}` : ''}`
}

const valid = (r: unknown): r is ResumeQ => {
  const x = r as ResumeQ
  return !!x && typeof x.q === 'string' && x.q.length > 5 && ['project', 'tech', 'design', 'behavioral'].includes(x.cat) && Array.isArray(x.points)
}

const asFeedback = (r: unknown): Feedback | null => {
  const x = r as Feedback
  if (!x || typeof x.score !== 'number') return null
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [])
  return { score: Math.max(0, Math.min(10, Math.round(x.score))), verdict: String(x.verdict ?? ''), good: list(x.good), improve: list(x.improve), better: String(x.better ?? '') }
}

const scoreTone = (s: number) => (s >= 8 ? 'good' : s >= 5 ? 'mid' : 'low')

type Tab = 'mine' | 'common' | 'answers'

export function Resume({ hasKey, onOpenSettings }: { hasKey: boolean; onOpenSettings: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const { user } = useStore()
  const { answers, setAnswer, setFeedback, removeAnswer } = useResumeAnswers()
  const [saved, setSaved] = useState<Saved | null>(() => readLocal(KEY, null))
  const [tab, setTab] = useState<Tab>(() => readLocal('hld.resume.tab', 'mine'))
  const [paste, setPaste] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [cat, setCat] = useState<string>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const chooseTab = (t: Tab) => {
    setTab(t)
    setCat('all')
    writeLocal('hld.resume.tab', t)
  }
  const save = (s: Saved | null) => {
    setSaved(s)
    writeLocal(KEY, s)
  }

  async function generate(base: Saved, count: number) {
    if (!hasKey) return onOpenSettings()
    setBusy('gen')
    setError('')
    try {
      const raw = await generateJson<unknown>(questionPrompt(base.text, base.questions, count, lang))
      const fresh = (Array.isArray(raw) ? raw : []).filter(valid).map((q, i) => ({
        ...q,
        level: ['easy', 'medium', 'hard'].includes(q.level) ? q.level : 'medium',
        related: q.related && pageBySlug.has(q.related) ? q.related : undefined,
        id: `${Date.now().toString(36)}-${i}`,
      }))
      if (!fresh.length) throw new Error(tr('Sawal nahi bane. Dobara try karo.', 'No questions came back. Please try again.'))
      save({ ...base, questions: [...base.questions, ...fresh] })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  async function startFrom(fileName: string, text: string) {
    const clean = text.trim()
    if (clean.length < 200) {
      setError(tr('Resume me text bahut kam mila. Scanned PDF ho to text paste karo.', 'Too little text found. If it is a scanned PDF, paste the text instead.'))
      return
    }
    // Old answers stay in "My answers"; only the generated questions are replaced
    const base = { fileName, text: clean, questions: [] }
    save(base)
    await generate(base, 12)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    setBusy('read')
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const text = isPdf ? await (await import('../pdfText')).pdfToText(file) : await file.text()
      setBusy('')
      await startFrom(file.name, text)
    } catch {
      setError(tr('File padh nahi paaye. PDF ya .txt do, ya text paste karo.', 'Could not read the file. Use a PDF or .txt, or paste the text.'))
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function getFeedback(q: CardQ) {
    const answer = answers[q.id]?.answer?.trim()
    if (!answer) return
    if (!hasKey) return onOpenSettings()
    setBusy(q.id)
    setError('')
    try {
      const fb = asFeedback(await generateJson<unknown>(feedbackPrompt(q, answer, saved?.text, lang)))
      if (!fb) throw new Error(tr('Feedback samajh nahi aaya. Dobara try karo.', 'Could not read the feedback. Please try again.'))
      setFeedback(q.id, fb)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  // Cards for each tab
  const mine: CardQ[] = (saved?.questions ?? []).map((q) => ({ id: q.id, group: q.cat, groupLabel: CATS[q.cat][lang], level: q.level, q: q.q, checks: q.checks, points: q.points, related: q.related }))
  const common: CardQ[] = COMMON.map((c) => ({ id: c.id, group: c.group, groupLabel: groupLabel(c.group, lang), q: c.q[lang], checks: c.checks[lang], points: c.points[lang], tip: c.tip?.[lang] }))
  const known = new Map([...mine, ...common].map((c) => [c.id, c]))
  const answered: CardQ[] = Object.entries(answers)
    .filter(([, a]) => a.answer?.trim())
    .sort(([, a], [, b]) => b.at - a.at)
    .map(([id, a]) => known.get(id) ?? { id, group: a.group, groupLabel: groupLabel(a.group, lang), q: a.q })
  const scored = answered.map((c) => answers[c.id]?.feedback?.score).filter((s): s is number => typeof s === 'number')
  const avg = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null

  const list = tab === 'mine' ? mine : tab === 'common' ? common : answered
  const groups = [...new Set(list.map((c) => c.group))]
  const shown = list.filter((c) => cat === 'all' || c.group === cat)

  return (
    <div className="resume">
      <h1>{tr('Resume se sawal', 'Resume questions')}</h1>
      <p className="muted">
        {tr(
          'Resume pe interviewer jaise sawal, common "past experience" sawal, aur har jawab pe AI ka score + feedback. Tumhare saare jawab save rehte hain.',
          'Interviewer-style questions on your resume, common past-experience questions, and an AI score + feedback on every answer. All your answers are saved.',
        )}
      </p>

      <div className="seg-tabs" role="tablist" aria-label={tr('Resume sections', 'Resume sections')}>
        {(
          [
            ['mine', 'file', tr('Mere resume se', 'From my resume'), mine.length],
            ['common', 'chat', tr('Common sawal', 'Common questions'), common.length],
            ['answers', 'folder', tr('Mere jawab', 'My answers'), answered.length],
          ] as [Tab, IconName, string, number][]
        ).map(([t, icon, label, n]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => chooseTab(t)}>
            <Icon name={icon} size={16} /> {label}
            <span className="count">{n}</span>
          </button>
        ))}
      </div>

      {!hasKey && (
        <p className="plan-warn">
          {tr('Sawal banane aur feedback ke liye AI set up karo.', 'Set up AI to create questions and get feedback.')}{' '}
          <button type="button" className="link-btn" onClick={onOpenSettings}>
            {tr('Set up karo', 'Set up')}
          </button>
        </p>
      )}

      {tab === 'mine' && (
        <section className="resume-upload">
          {saved ? (
            <div className="resume-file">
              <span className="resume-file-name">
                <Icon name="file" size={16} /> <b>{saved.fileName}</b>
              </span>
              <span className="row wrap">
                <button className="btn" onClick={() => fileRef.current?.click()} disabled={!!busy}>
                  {tr('Naya resume', 'New resume')}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (confirm(tr('Resume aur uske sawal hata dein? (Tumhare jawab "Mere jawab" me rahenge.)', 'Remove the resume and its questions? (Your answers stay in "My answers".)'))) save(null)
                  }}
                  disabled={!!busy}
                >
                  {tr('Hatao', 'Remove')}
                </button>
              </span>
            </div>
          ) : (
            <div className="resume-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), onFile(e.dataTransfer.files[0]))}>
              <span className="resume-drop-icon">
                <Icon name="upload" size={26} />
              </span>
              <button className="btn primary" onClick={() => fileRef.current?.click()} disabled={!!busy || !hasKey}>
                {tr('Resume upload karo (PDF)', 'Upload resume (PDF)')}
              </button>
              <span className="muted small">
                {tr('ya file yahan drop karo ·', 'or drop the file here ·')}{' '}
                <button type="button" className="link-btn" onClick={() => setPaste((p) => !p)}>
                  {tr('text paste karo', 'paste text')}
                </button>
              </span>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          {paste && !saved && (
            <div className="resume-paste">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} placeholder={tr('Resume ka text yahan paste karo', 'Paste your resume text here')} />
              <button className="btn primary" disabled={!!busy || !hasKey || !draft.trim()} onClick={() => startFrom(tr('Paste kiya resume', 'Pasted resume'), draft)}>
                {tr('Sawal banao', 'Create questions')}
              </button>
            </div>
          )}
          <p className="muted small">{tr('Resume sirf is browser me save hota hai; sawal banane ke liye tumhari key se AI ko jaata hai.', 'Your resume is saved only in this browser; it goes to the AI with your key to create questions.')}</p>
        </section>
      )}

      {tab === 'answers' && (
        <div className="answers-summary">
          <span>
            <b className="mono">{answered.length}</b> {tr('jawab likhe', 'answers written')}
          </span>
          <span>
            <b className="mono">{scored.length}</b> {tr('pe feedback', 'with feedback')}
          </span>
          {avg !== null && (
            <span>
              {tr('Average score', 'Average score')} <b className={`score-pill ${scoreTone(avg)}`}>{avg}/10</b>
            </span>
          )}
          <span className="muted small">{user ? tr('Account me save hai, har device pe milega.', 'Saved to your account, on every device.') : tr('Is browser me save hai. Login karo to har device pe milega.', 'Saved in this browser. Log in to get them on every device.')}</span>
        </div>
      )}

      {busy === 'read' && <p className="muted">{tr('Resume padh rahe hain…', 'Reading the resume…')}</p>}
      {busy === 'gen' && <p className="muted">{tr('AI tumhara resume padh ke sawal bana raha hai…', 'AI is reading your resume and writing questions…')}</p>}
      {error && <p className="error">{error}</p>}

      {groups.length > 1 && (
        <div className="row wrap">
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>
            {tr('Sab', 'All')} · {list.length}
          </button>
          {groups.map((g) => (
            <button key={g} className={`chip ${cat === g ? 'on' : ''}`} onClick={() => setCat(g)}>
              {groupLabel(g, lang)} · {list.filter((c) => c.group === g).length}
            </button>
          ))}
        </div>
      )}

      {tab === 'answers' && answered.length === 0 && (
        <p className="muted">{tr('Abhi koi jawab nahi likha. "Common sawal" ya "Mere resume se" me kisi sawal pe "Answer likho" dabao.', 'No answers yet. Press "Write answer" on any question in "Common questions" or "From my resume".')}</p>
      )}
      {tab === 'common' && common.length === 0 && <p className="muted">{tr('Common sawal jaldi aa rahe hain.', 'Common questions are coming soon.')}</p>}

      <ol className="resume-list">
        {shown.map((q) => (
          <QuestionCard
            key={q.id}
            q={q}
            rec={answers[q.id]}
            busy={busy === q.id}
            disabled={!!busy}
            startOpen={tab === 'answers'}
            onAnswer={(text) => setAnswer(q.id, q.q, q.group, text)}
            onFeedback={() => getFeedback(q)}
            onDelete={tab === 'answers' ? () => confirm(tr('Ye jawab delete karein?', 'Delete this answer?')) && removeAnswer(q.id) : undefined}
          />
        ))}
      </ol>

      {tab === 'mine' && saved && saved.questions.length > 0 && (
        <div className="row">
          <button className="btn" disabled={!!busy} onClick={() => generate(saved, 8)}>
            {busy === 'gen' ? tr('Ban rahe hain…', 'Writing…') : tr('+ Aur sawal banao', '+ More questions')}
          </button>
        </div>
      )}
      {tab === 'mine' && saved && saved.questions.length === 0 && !busy && (
        <button className="btn primary" onClick={() => generate(saved, 12)}>
          {tr('Sawal banao', 'Create questions')}
        </button>
      )}
    </div>
  )
}

function QuestionCard({
  q,
  rec,
  busy,
  disabled,
  startOpen,
  onAnswer,
  onFeedback,
  onDelete,
}: {
  q: CardQ
  rec?: AnswerRecord
  busy: boolean
  disabled: boolean
  startOpen: boolean
  onAnswer: (text: string) => void
  onFeedback: () => void
  onDelete?: () => void
}) {
  const { lang } = useLang()
  const tr = useTr()
  const [panel, setPanel] = useState<'' | 'points' | 'answer'>(startOpen ? 'answer' : '')
  const [showBetter, setShowBetter] = useState(false)
  const page = q.related ? pageBySlug.get(q.related) : undefined
  const fb = rec?.feedback
  const hasAnswer = !!rec?.answer?.trim()
  const hasPoints = !!(q.checks || q.points?.length)
  const toggle = (p: 'points' | 'answer') => setPanel((cur) => (cur === p ? '' : p))

  return (
    <li className={`resume-q ${panel ? 'open' : ''}`}>
      <div className="resume-q-top">
        <span className="resume-q-tags">
          <span className={`q-tag g-${q.group}`}>{q.groupLabel}</span>
          {q.level && <span className="muted small">{q.level}</span>}
        </span>
        {fb ? (
          <span className={`score-pill ${scoreTone(fb.score)}`} title={tr('Pichla feedback score', 'Latest feedback score')}>
            {fb.score}/10
          </span>
        ) : hasAnswer ? (
          <span className="q-status">{tr('Jawab likha', 'Answered')}</span>
        ) : null}
      </div>
      <p className="resume-q-text">{q.q}</p>

      <div className="q-actions">
        {hasPoints && (
          <button type="button" className={`q-btn ${panel === 'points' ? 'on' : ''}`} aria-expanded={panel === 'points'} onClick={() => toggle('points')}>
            <Icon name="bulb" size={15} /> {tr('Key points', 'Key points')}
          </button>
        )}
        <button type="button" className={`q-btn primary ${panel === 'answer' ? 'on' : ''}`} aria-expanded={panel === 'answer'} onClick={() => toggle('answer')}>
          <Icon name="pen" size={15} /> {hasAnswer ? tr('Mera jawab', 'My answer') : tr('Answer likho', 'Write answer')}
        </button>
        {page && (
          <a className="q-btn" href={route(page)}>
            <Icon name="book" size={15} /> {shortTitle(localize(page, lang).title)}
          </a>
        )}
        {onDelete && (
          <button type="button" className="q-btn ghost" onClick={onDelete}>
            {tr('Delete', 'Delete')}
          </button>
        )}
      </div>

      {panel === 'points' && (
        <div className="q-panel">
          {q.checks && (
            <p className="small">
              <b>{tr('Interviewer dekh raha hai:', 'They are checking:')}</b> {q.checks}
            </p>
          )}
          {q.points && q.points.length > 0 && (
            <ul className="small">
              {q.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
          {q.tip && (
            <p className="small tip">
              <b>Tip:</b> {q.tip}
            </p>
          )}
        </div>
      )}

      {panel === 'answer' && (
        <div className="q-panel">
          <textarea rows={5} value={rec?.answer ?? ''} onChange={(e) => onAnswer(e.target.value)} placeholder={tr('Apna jawab likho, jaise interview me bologe… (apne aap save hota hai)', 'Write your answer as you would say it… (saves automatically)')} />
          <div className="q-answer-bar">
            <span className="muted small">{hasAnswer ? tr('✓ Save ho gaya', '✓ Saved') : ''}</span>
            <button className="btn primary" disabled={disabled || !hasAnswer} onClick={onFeedback}>
              {busy ? tr('Score ho raha hai…', 'Scoring…') : fb ? tr('Dobara score karo', 'Score again') : tr('Score + feedback lo', 'Get score + feedback')}
            </button>
          </div>
          {fb && (
            <div className="feedback">
              <div className="feedback-head">
                <span className={`score-big ${scoreTone(fb.score)}`}>
                  {fb.score}
                  <small>/10</small>
                </span>
                <div>
                  <p className="feedback-verdict">{fb.verdict}</p>
                  {rec?.scores && rec.scores.length > 0 && (
                    <p className="muted small">
                      {tr('Score history:', 'Score history:')} {[...rec.scores, fb.score].join(' → ')}
                    </p>
                  )}
                </div>
              </div>
              {fb.improve.length > 0 && (
                <div className="feedback-block improve">
                  <b className="fb-title"><Icon name="up" size={15} /> {tr('Kya improve karein', 'What to improve')}</b>
                  <ul>
                    {fb.improve.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {fb.good.length > 0 && (
                <div className="feedback-block good">
                  <b className="fb-title"><Icon name="check" size={15} /> {tr('Kya accha tha', 'What worked')}</b>
                  <ul>
                    {fb.good.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {fb.better && (
                <div className="feedback-block">
                  <button type="button" className="link-btn" onClick={() => setShowBetter((s) => !s)}>
                    {showBetter ? tr('Better answer chhupao', 'Hide the better answer') : tr('Better answer dekho', 'See a better answer')}
                  </button>
                  {showBetter && <Markdown text={fb.better} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
