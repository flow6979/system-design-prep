import { parse as parseYaml } from 'yaml'

export type Kind = 'topic' | 'question' | 'lld'

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
export const allPages = [...topics, ...questions, ...lld]
export const pageBySlug = new Map(allPages.map((p) => [p.slug, p]))

const enBySlug = new Map(
  build(enFiles, 'topic').map((p) => [p.slug, p] as const),
)

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

export function route(p: Pick<Page, 'kind' | 'slug'>): string {
  return `#/${{ topic: 'topic', question: 'q', lld: 'lld' }[p.kind]}/${p.slug}`
}

/** Map a relative .md link inside content to an in-app hash route */
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
}

export function revisionBody(page: Page): string {
  const parts = page.body.split(/^(?=## )/m)
  const intro = parts[0]
  const kept = parts.slice(1).filter((s) => REVISION_HEADINGS[page.kind].test(s))
  return [intro, ...kept].join('\n')
}
