import { useEffect, useRef, useState } from 'react'

let counter = 0
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  return mermaidPromise
}

const isDark = () => document.documentElement.dataset.theme === 'dark'

export function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [themeTick, setThemeTick] = useState(0)

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    loadMermaid().then(async (mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark() ? 'dark' : 'neutral',
        securityLevel: 'strict',
        fontFamily: 'Source Sans 3, system-ui, sans-serif',
      })
      try {
        const { svg } = await mermaid.render(`mmd-${++counter}`, code)
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })
    return () => {
      cancelled = true
    }
  }, [code, themeTick])

  if (error) {
    return (
      <div className="mermaid-error">
        <p>Diagram render nahi hua. Neeche raw code hai:</p>
        <pre>{code}</pre>
      </div>
    )
  }
  return <div className="mermaid-box" ref={ref} />
}
