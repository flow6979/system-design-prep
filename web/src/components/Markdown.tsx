import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Mermaid } from './Mermaid'
import { resolveMdLink } from '../content'

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...rest }) {
            const lang = /language-(\w+)/.exec(className ?? '')?.[1]
            const code = String(children).replace(/\n$/, '')
            if (lang === 'mermaid') return <Mermaid code={code} />
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          },
          pre({ children, node }) {
            // Mermaid blocks render their own container; skip the <pre> wrapper for them
            const first = node?.children?.[0]
            const cls = first && 'properties' in first ? (first.properties?.className as string[] | undefined) : undefined
            if (cls?.includes('language-mermaid')) return <>{children}</>
            return <pre>{children}</pre>
          },
          a({ href = '', children }) {
            const internal = resolveMdLink(href)
            if (internal) return <a href={internal}>{children}</a>
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
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
  )
}
