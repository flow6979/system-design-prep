// Handbook content (build time pe scripts/sync-handbook.mjs ne public/handbook/ mein daala).
//   loadTree()      -> sections/projects/doc files ka tree (docs.json)
//   fetchRaw(path)  -> koi bhi file ka text (docs .md, source .py)
//   docFile(node, 'CONCEPTS', lang) -> sahi language ki file (na ho to dusri)
import type { Lang } from '../i18n'

export type DocBase = 'README' | 'CONCEPTS' | 'TESTING'
export type DocNode = {
  id: string // "02-agentic-architectures/04-react"
  name: string // "04-react"
  title: { hi: string | null; en: string | null }
  docs: Partial<Record<DocBase, { hi: string | null; en: string | null }>>
  files: string[]
  children: DocNode[]
}

const BASE = `${import.meta.env.BASE_URL}handbook/`
let treePromise: Promise<DocNode> | null = null
const rawCache = new Map<string, Promise<string>>()

export function loadTree(): Promise<DocNode> {
  if (!treePromise) {
    treePromise = fetch(`${BASE}docs.json`).then((r) => {
      if (!r.ok) throw new Error(`docs.json HTTP ${r.status}`)
      return r.json()
    })
    treePromise.catch(() => (treePromise = null))
  }
  return treePromise
}

export function fetchRaw(path: string): Promise<string> {
  if (!rawCache.has(path)) {
    const p = fetch(`${BASE}raw/${path}`).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
      return r.text()
    })
    p.catch(() => rawCache.delete(path))
    rawCache.set(path, p)
  }
  return rawCache.get(path)!
}

export function loadMeta(): Promise<{ commit?: string; builtAt?: string; files?: number }> {
  return fetch(`${BASE}meta.json`).then((r) => (r.ok ? r.json() : {}))
}

export function docFile(node: DocNode, base: DocBase, lang: Lang): string | null {
  const d = node.docs[base]
  if (!d) return null
  return d[lang] ?? d[lang === 'hi' ? 'en' : 'hi']
}

export function findNode(root: DocNode, id: string): DocNode | null {
  if (root.id === id) return root
  for (const c of root.children) {
    const f = findNode(c, id)
    if (f) return f
  }
  return null
}

export function nodeTitle(node: DocNode, lang: Lang): string {
  return node.title[lang] ?? node.title[lang === 'hi' ? 'en' : 'hi'] ?? node.name
}

/** Markdown se language-switcher line hatao (UI ka apna switcher hai). */
export function stripSwitcher(md: string): string {
  return md.replace(/^\*\*Language:\*\*[^\n]*\n+/, '')
}

const DOC_LABELS: Record<DocBase, { hi: string; en: string }> = {
  README: { hi: 'Overview', en: 'Overview' },
  CONCEPTS: { hi: 'Concepts', en: 'Concepts' },
  TESTING: { hi: 'Testing', en: 'Testing' },
}

/** Tab label for a doc kind. The UI never shows raw file names like README.md. */
export function docLabel(base: DocBase, lang: Lang): string {
  return DOC_LABELS[base][lang]
}

/** "04-rag/README.en.md" -> "04-rag · overview" for display in cards and breadcrumbs */
export function prettyFile(path: string): string {
  return path.replace(/(?:^|\/)(README|CONCEPTS|TESTING)(\.en)?\.md$/, (_m, base: string) => ` · ${base.toLowerCase() === 'readme' ? 'overview' : base.toLowerCase()}`).replace(/^ · /, '')
}
