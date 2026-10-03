// Quiz question bank.
//   seed     = content/quiz/*.json, shipped with the site
//   central  = Firestore `quiz` collection: questions Gemini wrote for anyone, saved once and reused
//              by everybody, so the same topic is never generated twice
//   local    = same as central, for people who are not logged in (stays in this browser)
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from './firebase'
import { allPages, pageBySlug, type Page } from './content'
import { generateJson } from './gemini'
import { readLocal, writeLocal } from './store'

export type Section = 'hld' | 'lld' | 'java' | 'agents'
type T2 = { hi: string; en: string }

export interface QuizQuestion {
  id: string
  section: Section
  topic: string
  level: 'easy' | 'medium' | 'hard'
  q: T2
  options: { hi: string[]; en: string[] }
  answer: number
  why: T2
  ai?: boolean
}

export const SECTIONS: Section[] = ['hld', 'lld', 'java', 'agents']

const seedFiles = import.meta.glob('../../content/quiz/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
export const SEED: QuizQuestion[] = Object.values(seedFiles).flatMap((v) => (Array.isArray(v) ? (v as QuizQuestion[]) : []))

export function sectionOf(page: Page): Section {
  return page.kind === 'lld' ? 'lld' : page.kind === 'java' ? 'java' : page.kind === 'agent' ? 'agents' : 'hld'
}

export const topicsOf = (section: Section) => allPages.filter((p) => sectionOf(p) === section && !(p.kind === 'agent' && p.slug === 'agents-general'))

const LOCAL_BANK = 'hld.quiz.bank'

function valid(x: unknown): x is QuizQuestion {
  const q = x as QuizQuestion
  const four = (a: unknown) => Array.isArray(a) && a.length === 4 && a.every((o) => typeof o === 'string' && o.trim())
  return (
    !!q &&
    SECTIONS.includes(q.section) &&
    typeof q.topic === 'string' &&
    typeof q.q?.hi === 'string' &&
    typeof q.q?.en === 'string' &&
    four(q.options?.hi) &&
    four(q.options?.en) &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer <= 3 &&
    typeof q.why?.hi === 'string' &&
    typeof q.why?.en === 'string'
  )
}

/** Seed + everything generated so far (central first, then this browser's own) */
export async function loadBank(): Promise<QuizQuestion[]> {
  const local = readLocal<QuizQuestion[]>(LOCAL_BANK, []).filter(valid)
  let central: QuizQuestion[] = []
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, 'quiz'), where('v', '==', 1)))
      central = snap.docs.map((d) => ({ ...(d.data() as QuizQuestion), id: d.id, ai: true })).filter(valid)
    } catch {
      /* offline or rules: seed + local still work */
    }
  }
  const seen = new Set<string>()
  return [...SEED, ...central, ...local].filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)))
}

function prompt(page: Page, section: Section, existing: QuizQuestion[], count: number): string {
  return `Write ${count} NEW multiple-choice interview questions for the topic below (${section.toUpperCase()} interviews at Indian product companies, SDE-1/SDE-2 level).

Return ONLY a JSON array. Each item:
{"level":"easy|medium|hard","q":{"hi":"Hinglish (Roman script Hindi + English tech terms)","en":"English"},"options":{"hi":["4 options"],"en":["same 4 options in English, same order"]},"answer":0,"why":{"hi":"1-2 lines","en":"1-2 lines"}}

Rules: exactly 4 plausible options, one correct; spread the correct index across 0-3; no "all/none of the above"; mix concept checks, scenarios, trade-offs, failure cases${section === 'java' ? ', code-output and complexity questions (short code inline with backticks)' : ''}; answers must agree with the study notes; tech terms stay in English in both languages.
Do not repeat or rephrase these existing questions:
${existing.map((q) => `- ${q.q.en}`).join('\n') || '- (none yet)'}

=== Study notes: ${page.title} ===
${page.body.slice(0, 12000)}`
}

/** Asks Gemini for fresh questions on one topic and stores them centrally (or locally when logged out) */
export async function generateQuestions(page: Page, existing: QuizQuestion[], uid: string | null, count = 8): Promise<QuizQuestion[]> {
  const section = sectionOf(page)
  const raw = await generateJson<unknown>(prompt(page, section, existing.filter((q) => q.topic === page.slug), count))
  const list = (Array.isArray(raw) ? raw : []).map((r) => ({ ...(r as object), section, topic: page.slug }) as QuizQuestion).filter(valid)
  if (!list.length) throw new Error('empty')

  const saved: QuizQuestion[] = []
  for (const q of list) {
    const body = { v: 1, section, topic: page.slug, level: ['easy', 'medium', 'hard'].includes(q.level) ? q.level : 'medium', q: q.q, options: q.options, answer: q.answer, why: q.why }
    if (db && uid) {
      try {
        const ref = await addDoc(collection(db, 'quiz'), { ...body, by: uid, at: serverTimestamp() })
        saved.push({ ...body, id: ref.id, ai: true } as QuizQuestion)
        continue
      } catch {
        /* fall through to local */
      }
    }
    saved.push({ ...body, id: `local-${Date.now().toString(36)}-${saved.length}`, ai: true } as QuizQuestion)
  }
  const localOnly = saved.filter((q) => q.id.startsWith('local-'))
  if (localOnly.length) writeLocal(LOCAL_BANK, [...readLocal<QuizQuestion[]>(LOCAL_BANK, []), ...localOnly])
  return saved
}

/** Topic with the fewest questions in the pool, so generation fills the gaps first */
export function thinnestTopic(section: Section | 'all', pool: QuizQuestion[], only?: string): Page | undefined {
  if (only) return pageBySlug.get(only)
  const sections = section === 'all' ? SECTIONS : [section]
  const candidates = sections.flatMap(topicsOf)
  const count = (slug: string) => pool.filter((q) => q.topic === slug).length
  return candidates.sort((a, b) => count(a.slug) - count(b.slug))[0]
}
