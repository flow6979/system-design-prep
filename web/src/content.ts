import { parse as parseYaml } from 'yaml'
import { href } from './router'

export type Kind = 'topic' | 'question' | 'lld' | 'lldp' | 'java' | 'db' | 'cs' | 'beh' | 'rag' | 'agent'

export interface ChecklistItem {
  id: string
  text: string
}

export interface Page {
  kind: Kind
  slug: string
  title: string
  order: number
  time: number
  tier?: number
  patterns: string[]
  related: string[]
  askedAt: string[]
  /** Markdown body without frontmatter and without the Checklist section */
  body: string
  checklist: ChecklistItem[]
  /** Agentic AI pages live at their own app route instead of /kind/slug */
  path?: string
}

const topicFiles = import.meta.glob('../../content/01-topics/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const lldFiles = import.meta.glob('../../content/03-lld/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const javaFiles = import.meta.glob('../../content/04-java/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const dbFiles = import.meta.glob('../../content/05-db/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const lldProblemFiles = import.meta.glob('../../content/06-lld-problems/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const csFiles = import.meta.glob('../../content/07-cs/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const behavioralFiles = import.meta.glob('../../content/08-behavioral/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const ragFiles = import.meta.glob('../../content/09-rag/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

// English mirrors live in content-en/ with the same paths; missing files fall back to Hinglish
const enFiles = import.meta.glob('../../content-en/0*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const questionFiles = import.meta.glob('../../content/02-questions/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Small stable hash so a checklist item keeps its id when items are reordered
function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

function splitFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { meta: {}, body: raw }
  let meta: Record<string, unknown> = {}
  try {
    meta = (parseYaml(m[1]) as Record<string, unknown>) ?? {}
  } catch {
    meta = {}
  }
  return { meta, body: raw.slice(m[0].length) }
}

function extractChecklist(slug: string, body: string): { body: string; checklist: ChecklistItem[] } {
  const idx = body.search(/^## Checklist\s*$/m)
  if (idx === -1) return { body, checklist: [] }
  const section = body.slice(idx)
  const checklist = [...section.matchAll(/^\s*- \[[ xX]\] (.+)$/gm)].map((m) => ({
    id: `${slug}:${hash(m[1].trim())}`,
    text: m[1].trim(),
  }))
  return { body: body.slice(0, idx).trimEnd(), checklist }
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])

function build(files: Record<string, string>, kind: Kind): Page[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '')
      const { meta, body } = splitFrontmatter(raw)
      const { body: clean, checklist } = extractChecklist(slug, body)
      return {
        kind,
        slug,
        title: String(meta.title ?? slug),
        order: Number(meta.order ?? 0),
        time: Number(meta.time ?? 0),
        tier: meta.tier != null ? Number(meta.tier) : undefined,
        patterns: asList(meta.patterns),
        related: kind === 'topic' ? asList(meta.usedIn) : asList(meta.topics),
        askedAt: asList(meta.askedAt),
        body: clean,
        checklist,
      }
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
}

export const topics = build(topicFiles, 'topic')
export const questions = build(questionFiles, 'question')
export const lld = build(lldFiles, 'lld')
export const java = build(javaFiles, 'java')
export const db = build(dbFiles, 'db')
export const lldProblems = build(lldProblemFiles, 'lldp')
export const cs = build(csFiles, 'cs')
export const behavioral = build(behavioralFiles, 'beh')
export const rag = build(ragFiles, 'rag')

// ---- Agentic AI (the labs that used to be the separate Agent Lab site) ----
type T2 = { hi: string; en: string }
interface AgentDef {
  slug: string
  path: string
  title: T2
  time: number
  about: T2
  items: T2[]
}

const AGENT_DEFS: AgentDef[] = [
  {
    slug: 'agents-map',
    path: '/agents',
    title: { hi: 'Agentic AI: topics', en: 'Agentic AI: topics' },
    time: 5,
    about: {
      hi: 'Handbook ke saare sections: agentkit core, agentic architectures, web agents, RAG, agent communication, multi-agent systems aur production agent.',
      en: 'All handbook sections: agentkit core, agentic architectures, web agents, RAG, agent communication, multi-agent systems and the production agent.',
    },
    items: [
      { hi: 'Workflow aur agent ka farak bata sakta hoon', en: 'I can explain the difference between a workflow and an agent' },
      { hi: 'Sections ka order aur kaunsa pattern kab, bata sakta hoon', en: 'I can explain the section order and which pattern to use when' },
    ],
  },
  {
    slug: 'agents-react',
    path: '/agents/lab/react',
    title: { hi: 'ReAct lab', en: 'ReAct lab' },
    time: 15,
    about: {
      hi: 'ReAct agent: Thought → Action (tool call) → Observation loop. Text-based aur native tool calling dono, live trace ke saath.',
      en: 'ReAct agent: the Thought → Action (tool call) → Observation loop, with both text-based and native tool calling and a live trace.',
    },
    items: [
      { hi: 'ReAct loop (thought, action, observation) samjha sakta hoon', en: 'I can explain the ReAct loop (thought, action, observation)' },
      { hi: 'Text-based vs native tool calling ka farak bata sakta hoon', en: 'I can explain text-based vs native tool calling' },
      { hi: 'Ek run ka trace padh ke bata sakta hoon kya hua', en: 'I can read a run trace and explain what happened' },
    ],
  },
  {
    slug: 'agents-rag',
    path: '/agents/labs/rag',
    title: { hi: 'RAG lab', en: 'RAG lab' },
    time: 15,
    about: {
      hi: 'PDF chat: chunking, embeddings, retrieval aur citations ke saath grounded jawab.',
      en: 'PDF chat: chunking, embeddings, retrieval and grounded answers with citations.',
    },
    items: [
      { hi: 'Chunking aur embeddings kyun chahiye, bata sakta hoon', en: 'I can explain why chunking and embeddings are needed' },
      { hi: 'Citations se jawab grounded kaise hota hai, samjha sakta hoon', en: 'I can explain how citations keep answers grounded' },
      { hi: 'RAG vs bina RAG ka farak bata sakta hoon', en: 'I can explain RAG vs no RAG' },
    ],
  },
  {
    slug: 'agents-web',
    path: '/agents/labs/web',
    title: { hi: 'Web research lab', en: 'Web research lab' },
    time: 12,
    about: {
      hi: 'Deep research agent: plan banao, search karo, pages padho, aur cited report likho.',
      en: 'Deep research agent: plan, search, read pages and write a cited report.',
    },
    items: [
      { hi: 'Plan → search → read → report flow bata sakta hoon', en: 'I can explain the plan → search → read → report flow' },
      { hi: 'Web agent kahan fail hota hai aur kaise sambhale, bata sakta hoon', en: 'I can explain where web agents fail and how to handle it' },
    ],
  },
  {
    slug: 'agents-multi',
    path: '/agents/labs/multi',
    title: { hi: 'Multi-agent lab', en: 'Multi-agent lab' },
    time: 15,
    about: {
      hi: 'Supervisor, crew, group chat aur swarm: kai agents milke kaam kaise karte hain.',
      en: 'Supervisor, crew, group chat and swarm: how several agents work together.',
    },
    items: [
      { hi: 'Supervisor, crew, group chat aur swarm ka farak bata sakta hoon', en: 'I can explain supervisor vs crew vs group chat vs swarm' },
      { hi: 'Multi-agent kab lena chahiye aur kab nahi, bata sakta hoon', en: 'I can explain when multi-agent is worth it and when it is not' },
    ],
  },
  {
    slug: 'agents-comm',
    path: '/agents/labs/comm',
    title: { hi: 'MCP & A2A lab', en: 'MCP & A2A lab' },
    time: 10,
    about: {
      hi: 'Agent communication: MCP (agent ↔ tools) aur A2A (agent ↔ agent) ke asli messages.',
      en: 'Agent communication: real MCP (agent ↔ tools) and A2A (agent ↔ agent) messages.',
    },
    items: [
      { hi: 'MCP kya hai aur kaise kaam karta hai, bata sakta hoon', en: 'I can explain what MCP is and how it works' },
      { hi: 'MCP vs A2A ka farak bata sakta hoon', en: 'I can explain MCP vs A2A' },
    ],
  },
  {
    slug: 'agents-prod',
    path: '/agents/labs/prod',
    title: { hi: 'Production agent lab', en: 'Production agent lab' },
    time: 12,
    about: {
      hi: 'Support desk agent: guardrails, human approval aur observability.',
      en: 'Support desk agent: guardrails, human approval and observability.',
    },
    items: [
      { hi: 'Guardrails kahan lagte hain, bata sakta hoon', en: 'I can explain where guardrails go' },
      { hi: 'Human-in-the-loop approval kab chahiye, bata sakta hoon', en: 'I can explain when human-in-the-loop approval is needed' },
      { hi: 'Agent ki observability (traces, cost, latency) samjha sakta hoon', en: 'I can explain agent observability (traces, cost, latency)' },
    ],
  },
]

export const agentPages: Page[] = AGENT_DEFS.map((d, i) => ({
  kind: 'agent',
  slug: d.slug,
  title: d.title.hi,
  order: i,
  time: d.time,
  patterns: [],
  related: [],
  askedAt: [],
  body: d.about.hi,
  checklist: d.items.map((it) => ({ id: `${d.slug}:${hash(it.hi)}`, text: it.hi })),
  path: d.path,
}))

/** Notes / Ask Gemini context for agent routes without their own checklist (docs, history, runner…) */
export const agentGeneral: Page = {
  kind: 'agent',
  slug: 'agents-general',
  title: 'Agentic AI',
  order: 99,
  time: 0,
  patterns: [],
  related: [],
  askedAt: [],
  body: 'Agentic AI handbook: agent architectures, tools, RAG, web agents, MCP/A2A, multi-agent systems and production agents.',
  checklist: [],
  path: '/agents/docs',
}

/** Longest matching agent page for a router path like /agents/labs/rag */
export function agentPageFor(path: string): Page {
  const clean = (path.replace(/\?.*$/, '').replace(/\/$/, '') || '/agents').replace(/^\/agents\/map$/, '/agents')
  const match = agentPages
    .filter((p) => (p.path === '/agents' ? clean === '/agents' : clean === p.path || clean.startsWith(`${p.path}/`)))
    .sort((a, b) => b.path!.length - a.path!.length)[0]
  return match ?? agentGeneral
}

export const allPages = [...topics, ...questions, ...lld, ...lldProblems, ...java, ...db, ...cs, ...behavioral, ...rag, ...agentPages]
export const pageBySlug = new Map(allPages.map((p) => [p.slug, p]))

const enBySlug = new Map<string, Page>(build(enFiles, 'topic').map((p) => [p.slug, p] as const))
for (const d of AGENT_DEFS) {
  const base = agentPages.find((p) => p.slug === d.slug)!
  enBySlug.set(d.slug, { ...base, title: d.title.en, body: d.about.en, checklist: d.items.map((it) => ({ id: '', text: it.en })) })
}
enBySlug.set('agents-general', {
  ...agentGeneral,
  body: agentGeneral.body,
})

/**
 * Page in the chosen language. Structure (kind, tier, links) and checklist ids always come from
 * the Hinglish source, so progress is shared; English items map to them by position.
 */
export function localize(page: Page, lang: 'hi' | 'en'): Page {
  if (lang === 'hi') return page
  const en = enBySlug.get(page.slug)
  if (!en) return page
  return {
    ...page,
    title: en.title,
    body: en.body,
    checklist: page.checklist.map((item, i) => ({ id: item.id, text: en.checklist[i]?.text ?? item.text })),
  }
}

export const hasEnglish = (slug: string) => enBySlug.has(slug)
export const allItems = allPages.flatMap((p) => p.checklist)

export function route(p: Pick<Page, 'kind' | 'slug' | 'path'>): string {
  if (p.kind === 'agent') return href(p.path ?? '/agents')
  const prefix: Record<Exclude<Kind, 'agent'>, string> = { topic: 'topic', question: 'q', lld: 'lld', lldp: 'lldp', java: 'java', db: 'db', cs: 'cs', beh: 'behavioral', rag: 'rag' }
  return href(`${prefix[p.kind as Exclude<Kind, 'agent'>]}/${p.slug}`)
}

/** Map a relative .md link inside content to an in-app hash route */
// One-minute cheat sheets for the last half hour before an interview (content/quicklook/<slug>.md)
const quickFiles = import.meta.glob('../../content/quicklook/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const quickEnFiles = import.meta.glob('../../content-en/quicklook/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const bySlug = (files: Record<string, string>) => new Map(Object.entries(files).map(([path, text]) => [path.split('/').pop()!.replace(/\.md$/, ''), text]))
const quickHi = bySlug(quickFiles)
const quickEn = bySlug(quickEnFiles)

export function quickLook(slug: string, lang: 'hi' | 'en'): string | undefined {
  return (lang === 'en' ? quickEn.get(slug) : undefined) ?? quickHi.get(slug)
}

export function resolveMdLink(href: string): string | null {
  const m = href.match(/([\w-]+)\.md(#.*)?$/)
  if (!m) return null
  const page = pageBySlug.get(m[1])
  return page ? route(page) : null
}

/** Sections kept in revision mode: the parts worth rereading the night before */
const REVISION_HEADINGS: Record<Kind, RegExp> = {
  question: /^## (Step 1:|Step 10:|2-minute recap)/,
  topic: /^## (Interview me bolo|Common galtiyan|Say this in the interview|Common mistakes)/,
  // LLD: only the starred (most-asked) patterns
  lld: /^## ⭐/,
  java: /^## ⭐/,
  db: /^## ⭐/,
  lldp: /^## (Step 1|Step 4|2-minute recap)/,
  cs: /^## ⭐/,
  beh: /^## ⭐/,
  rag: /^## ⭐/,
  agent: /^$/,
}

export function revisionBody(page: Page): string {
  const parts = page.body.split(/^(?=## )/m)
  const intro = parts[0]
  const kept = parts.slice(1).filter((s) => REVISION_HEADINGS[page.kind].test(s))
  return [intro, ...kept].join('\n')
}
