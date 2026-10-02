// Handbook ki .md files ko render karo (marked + DOMPurify: HTML hamesha sanitize).
// Relative links (e.g. "CONCEPTS.en.md", "../04-rag/README.md") ko app ke /docs route pe mod dete hain.
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { githubFile } from '../i18n/common'
import { stripSwitcher } from '../lib/handbook'

function resolve(fromFile: string, href: string): string {
  const dir = fromFile.split('/').slice(0, -1)
  for (const part of href.split('/')) {
    if (part === '..') dir.pop()
    else if (part && part !== '.') dir.push(part)
  }
  return dir.join('/')
}

export function Markdown({ source, file }: { source: string; file: string }) {
  const navigate = useNavigate()
  const html = useMemo(() => {
    const raw = marked.parse(stripSwitcher(source), { async: false, gfm: true }) as string
    return hideFileWords(DOMPurify.sanitize(raw))
  }, [source])

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (/^(https?:|mailto:|#)/.test(href)) {
      if (href.startsWith('http')) a.setAttribute('target', '_blank')
      return
    }
    e.preventDefault()
    const target = resolve(file, href.split('#')[0])
    if (target.endsWith('.md')) navigate(`/agents/docs/${target.replace(/\/(README|CONCEPTS|TESTING)(\.en)?\.md$/, '')}?doc=${/(README|CONCEPTS|TESTING)/.exec(target)?.[1] ?? 'README'}`)
    else if (target.endsWith('/') || !/\.[a-z]+$/.test(target)) navigate(`/agents/docs/${target.replace(/\/$/, '')}`)
    else window.open(githubFile(target), '_blank', 'noopener')
  }

  return <div className="markdown" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Readers see "overview" instead of raw file names like README.md (links keep their real targets) */
function hideFileWords(html: string): string {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement?.closest('pre')) continue
    if (n.nodeValue?.includes('README')) n.nodeValue = n.nodeValue.replace(/\bREADME(\.en)?(\.md)?\b/g, 'overview')
  }
  return tpl.innerHTML
}
