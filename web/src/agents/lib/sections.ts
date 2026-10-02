// Handbook tree ke nodes ke display helpers (Map, Section, Docs pages share karte hain).
import type { Lang } from '../i18n'
import { EXTRA_CHILDREN } from './labRoutes'
import { fetchRaw, nodeTitle, stripSwitcher, type DocNode } from './handbook'

export const PATH_ORDER = ['common', '02-agentic-architectures', '03-web-agents', '04-rag', '05-agent-communication', '06-multi-agent-systems', '01-production-agent']

export function sectionNum(node: DocNode): string {
  if (node.id === 'common') return '00'
  if (node.id === 'lab-api') return 'API'
  return node.name.slice(0, 2)
}

/** "02 · Agentic Architectures" -> "Agentic Architectures"; common -> "agentkit core". */
export function shortTitle(node: DocNode, lang: Lang): string {
  if (node.id === 'common') return 'agentkit core'
  if (node.id === 'lab-api') return 'Lab API'
  const t = nodeTitle(node, lang)
  const cleaned = t.replace(/^\d\d\s*[·:.-]\s*/, '').replace(/:\s*concepts.*$/i, '').trim()
  return cleaned || humanName(node.name)
}

export function humanName(folder: string): string {
  return folder.replace(/^(\d\d)-/, '$1 ').replace(/-/g, ' ')
}

/** Project children, including non-numbered folders the bundler skips (e.g. support-desk). */
export function projectsOf(section: DocNode): DocNode[] {
  const have = new Set(section.children.map((c) => c.id))
  const extra = (EXTRA_CHILDREN[section.id] ?? []).filter((e) => !have.has(e.id)).map<DocNode>((e) => ({ id: e.id, name: e.name, title: { hi: null, en: null }, docs: {}, files: [], children: [] }))
  return [...section.children, ...extra]
}

/** Project ka display naam: "04 ReAct" jaisa, title se. */
export function projectLabel(node: DocNode, lang: Lang): string {
  const num = /^\d\d/.exec(node.name)?.[0]
  const t = node.title[lang] ?? node.title[lang === 'hi' ? 'en' : 'hi']
  if (!t) return humanName(node.name)
  const cleaned = t.replace(/^\d\d\s*[·:.-]\s*/, '').replace(/:\s*concepts.*$/i, '').replace(/\s+[—-]\s+.*$/, '').replace(/\s*\(.*\)\s*$/, '').trim()
  return num ? `${num} ${cleaned}` : cleaned
}

const descCache = new Map<string, Promise<string>>()

/** Doc ka pehla paragraph (H1 ke baad), plain text, ~180 chars. */
export function firstParagraph(file: string): Promise<string> {
  if (!descCache.has(file)) {
    descCache.set(
      file,
      fetchRaw(file)
        .then((md) => {
          const lines = stripSwitcher(md).split('\n')
          let i = lines.findIndex((l) => /^#\s/.test(l))
          i = i === -1 ? 0 : i + 1
          const para: string[] = []
          for (; i < lines.length; i++) {
            const l = lines[i].trim()
            if (!l) {
              if (para.length) break
              continue
            }
            if (/^(#|```|\||>|<|---|\*\*Language)/.test(l)) {
              if (para.length) break
              continue
            }
            para.push(l.replace(/^[-*]\s+/, ''))
          }
          const text = para
            .join(' ')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_]/g, '')
          return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text
        })
        .catch(() => ''),
    )
  }
  return descCache.get(file)!
}
