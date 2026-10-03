import { useEffect, useRef, useState } from 'react'

let counter = 0
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  return mermaidPromise
}

// A tab opened before a deploy still points at the old lazy chunks (mermaid loads one per diagram type);
// they 404 after the deploy, so load the new build once instead of showing raw code
const STALE = /dynamically imported module|Importing a module script failed|error loading dynamically|MIME type|Failed to fetch/i
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem('viewinter.reloadedAt') ?? 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem('viewinter.reloadedAt', String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

const isDark = () => document.documentElement.dataset.theme === 'dark'

export function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [themeTick, setThemeTick] = useState(0)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    loadMermaid().then(async (mermaid) => {
      if (cancelled) return
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
        const message = e instanceof Error ? e.message : String(e)
        if (STALE.test(message) && reloadForNewBuild()) return
        if (!cancelled) setError(message)
      }
    }, (e) => {
      mermaidPromise = null
      const message = e instanceof Error ? e.message : String(e)
      if (STALE.test(message) && reloadForNewBuild()) return
      if (!cancelled) setError(message)
    })
    return () => {
      cancelled = true
    }
  }, [code, themeTick, attempt])

  if (error) {
    return (
      <div className="mermaid-error">
        <p>
          Diagram render nahi hua.{' '}
          <button type="button" className="link-btn" onClick={() => (setError(null), setAttempt((a) => a + 1))}>
            Dobara try karo
          </button>
        </p>
        <p className="muted small">{error.split('\n')[0].slice(0, 160)}</p>
        <pre>{code}</pre>
      </div>
    )
  }
  return <div className="mermaid-box" ref={ref} />
}
