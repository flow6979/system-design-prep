import { useRef, useState } from 'react'
import { allPages, localize, pageBySlug, route } from '../content'
import { generateJson, streamGemini } from '../gemini'
import { useLang, useTr, type Lang } from '../i18n'
import { readLocal, writeLocal } from '../store'
import { Markdown } from './Markdown'
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
type Answers = Record<string, { answer: string; feedback?: string }>

// Resume stays in this browser only (personal data); Gemini gets it with the user's own key
const KEY = 'hld.resume'
const ANSWERS = 'hld.resume.answers'
const MAX_CHARS = 20000

const CATS: Record<Cat, { hi: string; en: string }> = {
  project: { hi: 'Projects', en: 'Projects' },
  tech: { hi: 'Tech / skills', en: 'Tech / skills' },
  design: { hi: 'System design', en: 'System design' },
  behavioral: { hi: 'Behavioral', en: 'Behavioral' },
}

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

function feedbackPrompt(text: string, q: ResumeQ, lang: Lang): string {
  return `You are a friendly but honest interview coach. The candidate is practising a question generated from their resume.
Reply in ${replyIn(lang)}, short and structured:
**Score: x/10**, then **Accha kya tha / What worked** (2-3 bullets), **Kya missing hai / What is missing** (2-4 bullets, concrete), then **Better answer** (a tight 5-8 line answer in first person, using details from their resume; never invent numbers, use placeholders like <X%> where they must fill in).

Question: ${q.q}
Interviewer checks: ${q.checks}
Key points: ${q.points.join('; ')}

=== Resume ===
${text.slice(0, MAX_CHARS)}`
}

const valid = (r: unknown): r is ResumeQ => {
  const x = r as ResumeQ
  return !!x && typeof x.q === 'string' && x.q.length > 5 && ['project', 'tech', 'design', 'behavioral'].includes(x.cat) && Array.isArray(x.points)
}

export function Resume({ hasKey, onOpenSettings }: { hasKey: boolean; onOpenSettings: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const [saved, setSaved] = useState<Saved | null>(() => readLocal(KEY, null))
  const [answers, setAnswers] = useState<Answers>(() => readLocal(ANSWERS, {}))
  const [paste, setPaste] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [cat, setCat] = useState<Cat | 'all'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const save = (s: Saved | null) => {
    setSaved(s)
    writeLocal(KEY, s)
  }
  const saveAnswers = (a: Answers) => {
    setAnswers(a)
    writeLocal(ANSWERS, a)
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
    saveAnswers({})
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

  async function getFeedback(q: ResumeQ) {
    if (!saved) return
    const answer = answers[q.id]?.answer?.trim()
    if (!answer) return
    if (!hasKey) return onOpenSettings()
    setBusy(q.id)
    let latest = answers
    try {
      await streamGemini(feedbackPrompt(saved.text, q, lang), [{ role: 'user', text: answer }], (t) => {
        latest = { ...latest, [q.id]: { answer, feedback: t } }
        setAnswers(latest)
      })
      saveAnswers(latest)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }

  const shown = saved?.questions.filter((q) => cat === 'all' || q.cat === cat) ?? []

  return (
    <div className="resume">
      <h1>{tr('Resume se sawal', 'Resume questions')}</h1>
      <p className="muted">
        {tr(
          'Resume upload karo, AI usi pe interviewer jaise sawal banayega: projects, skills, design aur behavioral. Jawab likho, feedback lo.',
          'Upload your resume and AI asks what an interviewer would: projects, skills, design and behavioral. Write answers, get feedback.',
        )}
      </p>

      {!hasKey && (
        <p className="plan-warn">
          {tr('Iske liye AI set up karna hoga.', 'This needs AI to be set up.')}{' '}
          <button type="button" className="link-btn" onClick={onOpenSettings}>
            {tr('Set up karo', 'Set up')}
          </button>
        </p>
      )}

      <section className="resume-upload">
        {saved ? (
          <div className="row wrap">
            <span>
              📄 <b>{saved.fileName}</b> <span className="muted small">· {saved.questions.length} {tr('sawal', 'questions')}</span>
            </span>
            <button className="btn" onClick={() => fileRef.current?.click()} disabled={!!busy}>
              {tr('Naya resume', 'New resume')}
            </button>
            <button
              className="btn"
              onClick={() => {
                if (confirm(tr('Resume aur saare sawal hata dein?', 'Remove the resume and all questions?'))) {
                  save(null)
                  saveAnswers({})
                }
              }}
              disabled={!!busy}
            >
              {tr('Hatao', 'Remove')}
            </button>
          </div>
        ) : (
          <div className="resume-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), onFile(e.dataTransfer.files[0]))}>
            <button className="btn primary" onClick={() => fileRef.current?.click()} disabled={!!busy || !hasKey}>
              {tr('Resume upload karo (PDF)', 'Upload resume (PDF)')}
            </button>
            <span className="muted small">{tr('ya file yahan drop karo ·', 'or drop the file here ·')} </span>
            <button type="button" className="link-btn small" onClick={() => setPaste((p) => !p)}>
              {tr('text paste karo', 'paste text')}
            </button>
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
        <p className="muted small">{tr('Resume sirf is browser me save hota hai. Sawal banane ke liye ye tumhari key se AI ko bheja jaata hai.', 'Your resume is saved only in this browser. It is sent to the AI with your key to create questions.')}</p>
      </section>

      {busy === 'read' && <p className="muted">{tr('Resume padh rahe hain…', 'Reading the resume…')}</p>}
      {busy === 'gen' && <p className="muted">{tr('AI tumhara resume padh ke sawal bana raha hai…', 'AI is reading your resume and writing questions…')}</p>}
      {error && <p className="error">{error}</p>}

      {saved && saved.questions.length > 0 && (
        <>
          <div className="quiz-sections" role="tablist" aria-label={tr('Category', 'Category')}>
            {(['all', 'project', 'tech', 'design', 'behavioral'] as const).map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
                {c === 'all' ? tr('Sab', 'All') : CATS[c][lang]}
                <span className="count">{c === 'all' ? saved.questions.length : saved.questions.filter((q) => q.cat === c).length}</span>
              </button>
            ))}
          </div>

          <ol className="resume-list">
            {shown.map((q) => {
              const a = answers[q.id]
              const page = q.related ? pageBySlug.get(q.related) : undefined
              return (
                <li key={q.id} className="resume-q">
                  <div className="muted small">
                    {CATS[q.cat][lang]} · {q.level}
                  </div>
                  <p className="resume-q-text">{q.q}</p>
                  <details>
                    <summary className="small">{tr('Interviewer kya dekh raha hai + key points', 'What they check + key points')}</summary>
                    <p className="small">
                      <b>{tr('Check:', 'Checks:')}</b> {q.checks}
                    </p>
                    <ul className="small">
                      {q.points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                    {page && (
                      <a href={route(page)} className="small">
                        {tr('Padho:', 'Read:')} {shortTitle(localize(page, lang).title)} →
                      </a>
                    )}
                  </details>
                  <details open={!!a?.answer}>
                    <summary className="small">{tr('Jawab practice karo', 'Practise your answer')}</summary>
                    <textarea
                      rows={4}
                      value={a?.answer ?? ''}
                      onChange={(e) => saveAnswers({ ...answers, [q.id]: { answer: e.target.value, feedback: a?.feedback } })}
                      placeholder={tr('Apna jawab likho, jaise interview me bologe…', 'Write your answer as you would say it…')}
                    />
                    <div className="row end">
                      <button className="btn primary" disabled={!!busy || !a?.answer?.trim()} onClick={() => getFeedback(q)}>
                        {busy === q.id ? tr('Check ho raha hai…', 'Checking…') : tr('Feedback lo', 'Get feedback')}
                      </button>
                    </div>
                    {a?.feedback && (
                      <div className="quiz-ask">
                        <Markdown text={a.feedback} />
                      </div>
                    )}
                  </details>
                </li>
              )
            })}
          </ol>

          <div className="row">
            <button className="btn" disabled={!!busy} onClick={() => generate(saved, 8)}>
              {busy === 'gen' ? tr('Ban rahe hain…', 'Writing…') : tr('Aur sawal banao', 'More questions')}
            </button>
          </div>
        </>
      )}
      {saved && saved.questions.length === 0 && !busy && (
        <button className="btn primary" onClick={() => generate(saved, 12)}>
          {tr('Sawal banao', 'Create questions')}
        </button>
      )}
    </div>
  )
}
