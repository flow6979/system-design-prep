// Personal study plan: turns "days left + what I'm preparing + hours per day" into a day-by-day list.
// Deterministic (no LLM): same inputs and progress always give the same plan, and finished pages
// drop out, so the plan re-balances itself every day from today.
import { agentPages, db, java, lld, pageBySlug, questions, topics, type Page } from './content'

export type Track = 'hld' | 'lld' | 'java' | 'db' | 'agents'
export type Level = 'junior' | 'mid' | 'senior'

export interface PlanInput {
  tracks: Track[]
  hours: number
  level: Level
  /** used when no interview date is set */
  days?: number
}

export interface PlanItem {
  page: Page
  minutes: number
  track: Track
  priority: 1 | 2 | 3
}

export interface PlanDay {
  index: number
  date: Date
  items: PlanItem[]
  minutes: number
  revision?: boolean
}

export interface Plan {
  days: PlanDay[]
  later: PlanItem[]
  doneCount: number
  mustDoMissing: number
}

export const TRACKS: { id: Track; label: { hi: string; en: string } }[] = [
  { id: 'hld', label: { hi: 'System design (HLD)', en: 'System design (HLD)' } },
  { id: 'lld', label: { hi: 'LLD · Design patterns', en: 'LLD · Design patterns' } },
  { id: 'java', label: { hi: 'Java', en: 'Java' } },
  { id: 'db', label: { hi: 'Databases', en: 'Databases' } },
  { id: 'agents', label: { hi: 'Agentic AI', en: 'Agentic AI' } },
]

// Must-do first (priority 1), then important (2), then good-to-have (3)
const HLD_P1 = [
  '00-interview-framework', '21-numbers-cheatsheet', '01-scaling-basics', '02-sql-vs-nosql', '05-caching',
  '04-sharding-consistent-hashing', '07-message-queues-kafka', '06-cap-consistency', '09-locks-and-contention',
  '10-idempotency-retries', 't1-01-url-shortener', 't1-02-rate-limiter', 't1-03-news-feed', 't1-04-whatsapp-chat',
  't1-05-bookmyshow', '22-red-flags',
]
const HLD_P2 = [
  '03-indexing-replication', '08-real-time-communication', '11-rate-limiting', '12-blob-storage-cdn', '13-geospatial',
  '14-search-indexing', '18-fan-out', '17-unique-id-generation', 't1-06-uber', 't1-07-youtube', 't1-08-dropbox',
  't1-09-notification-system', 't1-10-typeahead', 't1-11-payment-system', 't1-12-web-crawler',
  '16-distributed-transactions', '15-counting-top-k', '19-api-design', '20-reliability-observability',
]
const LLD_P1 = ['01-oops', '02-solid', '05-behavioral', '03-creational']
const LLD_P2 = ['04-structural']
const JAVA_P1 = ['01-basics', '02-strings', '04-oops', '05-collections-overview', '06-lists', '07-maps-sets', '10-exceptions', '15-interview-qa']
const JAVA_P2 = ['03-arrays', '08-queues', '12-streams-lambdas', '14-concurrency', '09-generics', '11-jvm-memory']
const DB_P1 = ['01-choosing-a-database', '02-relational-sql', '03-transactions-acid', '04-indexes', '05-key-value', '14-scaling-databases', '16-interview-qa']
const DB_P2 = ['06-document', '07-wide-column', '08-search', '15-object-storage', '11-vector']
const AGENT_P1 = ['agents-map', 'agents-react', 'agents-rag']
const AGENT_P2 = ['agents-prod', 'agents-multi', 'agents-comm', 'agents-web']

// Reading time × factor = study time (questions need practice, labs need running)
const FACTOR: Record<Page['kind'], number> = { topic: 3, question: 2.5, lld: 2, java: 1.5, db: 1.5, agent: 2 }

function tiers(track: Track, level: Level): string[][] {
  if (track === 'hld') {
    const tier2 = questions.filter((q) => q.tier !== 1).map((q) => q.slug)
    const rest = topics.map((t) => t.slug).filter((s) => !HLD_P1.includes(s) && !HLD_P2.includes(s))
    // Seniors get the deeper tier-2 designs earlier; juniors focus on fundamentals and the first designs
    if (level === 'senior') return [HLD_P1, [...HLD_P2, ...tier2.slice(0, 6)], [...tier2.slice(6), ...rest]]
    if (level === 'junior') {
      const p1 = HLD_P1.filter((s) => !['t1-04-whatsapp-chat', 't1-05-bookmyshow'].includes(s))
      return [p1, ['t1-04-whatsapp-chat', 't1-05-bookmyshow', ...HLD_P2.filter((s) => !s.startsWith('t1-'))], [...HLD_P2.filter((s) => s.startsWith('t1-')), ...tier2, ...rest]]
    }
    return [HLD_P1, HLD_P2, [...tier2, ...rest]]
  }
  if (track === 'lld') return [LLD_P1, LLD_P2, lld.map((p) => p.slug).filter((s) => !LLD_P1.includes(s) && !LLD_P2.includes(s))]
  if (track === 'db') return [DB_P1, DB_P2, db.map((p) => p.slug).filter((s) => !DB_P1.includes(s) && !DB_P2.includes(s))]
  if (track === 'java') return [JAVA_P1, JAVA_P2, java.map((p) => p.slug).filter((s) => !JAVA_P1.includes(s) && !JAVA_P2.includes(s))]
  return [AGENT_P1, AGENT_P2, agentPages.map((p) => p.slug).filter((s) => !AGENT_P1.includes(s) && !AGENT_P2.includes(s))]
}

/** Round-robin across tracks inside each priority so no single subject eats the whole week */
function queue(input: PlanInput, isDone: (p: Page) => boolean): { items: PlanItem[]; done: number } {
  const items: PlanItem[] = []
  let done = 0
  for (const priority of [1, 2, 3] as const) {
    const lists = input.tracks.map((track) =>
      tiers(track, input.level)[priority - 1]
        .map((slug) => pageBySlug.get(slug))
        .filter((p): p is Page => !!p)
        .filter((p) => (isDone(p) ? (done++, false) : true))
        .map((page) => ({ page, track, priority, minutes: Math.max(10, Math.round((page.time || 10) * FACTOR[page.kind] / 5) * 5) })),
    )
    for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (l[i]) items.push(l[i])
  }
  return { items, done }
}

export function daysUntil(date?: string): number | null {
  if (!date) return null
  const d = Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000)
  return d >= 0 ? d : null
}

export function buildPlan(input: PlanInput, totalDays: number, isDone: (p: Page) => boolean): Plan {
  const { items, done } = queue(input, isDone)
  const days = Math.max(1, totalDays)
  // Keep the last day for revision and a mock round when there is room for it
  const studyDays = days >= 3 ? days - 1 : days
  const capacity = Math.max(30, input.hours * 60)
  const out: PlanDay[] = []
  const later: PlanItem[] = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const at = (i: number) => new Date(start.getTime() + i * 86400000)

  let day: PlanDay = { index: 0, date: at(0), items: [], minutes: 0 }
  let full = false
  for (const item of items) {
    if (!full && day.minutes > 0 && day.minutes + item.minutes > capacity * 1.15) {
      // Day is full (a small overflow is fine): close it and open the next, unless we are out of days
      out.push(day)
      if (out.length >= studyDays) full = true
      else day = { index: out.length, date: at(out.length), items: [], minutes: 0 }
    }
    if (full) {
      later.push(item)
      continue
    }
    day.items.push(item)
    day.minutes += item.minutes
  }
  if (!full && day.items.length) out.push(day)
  if (days >= 3) out.push({ index: out.length, date: at(days - 1), items: [], minutes: 0, revision: true })

  return { days: out, later, doneCount: done, mustDoMissing: later.filter((i) => i.priority === 1).length }
}
