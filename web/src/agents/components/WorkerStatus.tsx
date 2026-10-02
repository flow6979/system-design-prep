// Pyodide load hone ka status. Pehli baar ~10-20s lagte hain (Python + handbook download),
// uske baad browser cache se turant.
import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { bridge, type InitProgress } from '../lib/worker'
import { Progress } from './ui'

const dict = {
  hi: { loading: 'Python browser mein load ho raha hai (pehli baar ~15 sec)...', ready: 'Python ready: handbook code browser mein chal raha hai', failed: 'Python load nahi hua', retry: 'Dobara try karo', stages: { pyodide: 'Pyodide download', packages: 'pydantic install', handbook: 'handbook code', python: 'labapi import', done: 'ready' } as Record<string, string> },
  en: { loading: 'Loading Python in your browser (first time ~15 sec)...', ready: 'Python ready: the handbook code runs in your browser', failed: 'Python failed to load', retry: 'Try again', stages: { pyodide: 'downloading Pyodide', packages: 'installing pydantic', handbook: 'handbook code', python: 'importing labapi', done: 'ready' } as Record<string, string> },
}

export function useWorkerReady() {
  const [ready, setReady] = useState(bridge.ready)
  const [progress, setProgress] = useState<InitProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const start = () => {
    setError(null)
    bridge
      .init(setProgress)
      .then(() => setReady(true))
      .catch((e) => setError(String(e.message || e)))
  }
  useEffect(() => {
    if (!bridge.ready) start()
  }, [])
  return { ready, progress, error, retry: start }
}

export function WorkerStatus({ compact }: { compact?: boolean }) {
  const t = useT(dict)
  const { ready, progress, error, retry } = useWorkerReady()
  if (ready && compact) return null
  if (error)
    return (
      <div className="row" role="alert" style={{ gap: 10, fontSize: 13, color: 'var(--red)' }}>
        {t.failed}: {error.slice(0, 120)}
        <button type="button" className="btn btn-sm" onClick={retry}>
          {t.retry}
        </button>
      </div>
    )
  if (ready)
    return (
      <div className="row" style={{ gap: 8, fontSize: 13, color: 'var(--muted)' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--green)' }} />
        {t.ready}
      </div>
    )
  return (
    <div className="col" style={{ gap: 6, fontSize: 13, color: 'var(--muted)', minWidth: 240 }}>
      <span>
        {t.loading} {progress ? `(${t.stages[progress.stage] ?? progress.stage})` : ''}
      </span>
      <Progress pct={progress?.pct ?? 2} label={t.loading} />
    </div>
  )
}
