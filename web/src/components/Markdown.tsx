import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Mermaid } from './Mermaid'
import { CodeBlock, ShowAllCodeContext, useVisibleCode } from './CodeBlock'
import { resolveMdLink } from '../content'
import { BASE } from '../router'

function starred(children: ReactNode): ReactNode {
  const list = Array.isArray(children) ? children : [children]
  const first = list[0]
  if (typeof first !== 'string' || !first.startsWith('⭐')) return children
  return [
    <span key="star" className="star-mark" aria-label="important">
      ★
    </span>,
    first.replace(/^⭐\s*/, ' '),
    ...list.slice(1),
  ]
}

export function Markdown({ text, showAllCode = false }: { text: string; showAllCode?: boolean }) {
  return (
    <ShowAllCodeContext.Provider value={showAllCode}>
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Fenced blocks are handled in `pre`; this only sees inline code
          code({ className, children, ...rest }) {
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
          pre({ node }) {
            const first = node?.children?.[0]
            const cls = first && 'properties' in first ? (first.properties?.className as string[] | undefined) : undefined
            const lang = cls?.find((c) => c.startsWith('language-'))?.slice('language-'.length)
            const text =
              first && 'children' in first
                ? first.children.map((c) => ('value' in c ? String(c.value) : '')).join('').replace(/\n$/, '')
                : ''
            return <Fenced lang={lang} code={text} />
          },
          a({ href = '', children }) {
            const internal = resolveMdLink(href)
            if (internal) return <a href={internal}>{children}</a>
            // In-app paths like /viewinter/agents/labs/rag stay in the same tab
            if (href?.startsWith(BASE)) return <a href={href}>{children}</a>
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
          // "⭐" in headings marks the most-asked sections; show it as a quiet accent star instead of an emoji
          h2({ children }) {
            return <h2>{starred(children)}</h2>
          },
          h3({ children }) {
            return <h3>{starred(children)}</h3>
          },
          table({ children }) {
            return (
              <div className="table-wrap">
                <table>{children}</table>
              </div>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
    </ShowAllCodeContext.Provider>
  )
}

function Fenced({ lang, code }: { lang?: string; code: string }) {
  const visible = useVisibleCode(lang)
  if (lang === 'mermaid') return <Mermaid code={code} />
  if (!visible) return null
  return <CodeBlock lang={lang} code={code} />
}
