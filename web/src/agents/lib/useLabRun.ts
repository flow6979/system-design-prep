// useLabRun: kisi bhi lab ko chalane ka ek hook. Events jodta hai, history mein save karta hai,
// errors ko structured rakhta hai. Har lab page isi ko use kare.
//
//   const lab = useLabRun('react', 'ReAct')
//   await lab.run({ mode: 'native', question })
//   lab.events / lab.running / lab.result / lab.error / lab.stats
import { useCallback, useRef, useState } from 'react'
import { useApp } from '../state/app'
import { saveRun } from './history'
import { providerById } from './providers'
import { bridge, type LabError, type LabEvent, type LabResult } from './worker'

export type LabStats = { llm_calls?: number; input_tokens?: number; output_tokens?: number; ms?: number }

export function useLabRun<R extends Record<string, unknown> = Record<string, unknown>>(lab: string, title: string, opts: { pip?: string[] } = {}) {
  const app = useApp()
  const [events, setEvents] = useState<LabEvent[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<(R & LabStats) | null>(null)
  const [error, setError] = useState<LabError | null>(null)
  const runId = useRef(0)

  const run = useCallback(
    async (params: Record<string, unknown> = {}, extra: { offline?: boolean } = {}): Promise<LabResult<R & LabStats>> => {
      const my = ++runId.current
      setEvents([])
      setResult(null)
      setError(null)
      setRunning(true)
      const req = { lab, params, pip: opts.pip, ...app.llmRequest(), ...(extra.offline ? { offline: true } : {}) }
      const collected: LabEvent[] = []
      const t0 = Date.now()
      let out: LabResult<R & LabStats>
      try {
        out = await bridge.run<R & LabStats>(req, (ev) => {
          if (my !== runId.current) return
          collected.push(ev)
          setEvents((prev) => [...prev, ev])
        })
      } catch (e) {
        out = { ok: false, error: { kind: 'internal', status: null, message: String((e as Error).message || e) } }
      }
      if (my !== runId.current) return out
      setRunning(false)
      const prov = req.offline ? providerById('offline') : providerById(app.provider)
      const stats = out.ok ? out.result : ({} as LabStats)
      if (out.ok) setResult(out.result)
      else setError(out.error)
      saveRun({
        id: `${t0}-${Math.random().toString(36).slice(2, 7)}`,
        lab,
        title,
        provider: prov?.id ?? 'offline',
        model: prov?.model ?? 'scripted',
        offline: !!req.offline,
        ok: out.ok,
        startedAt: t0,
        ms: stats.ms ?? Date.now() - t0,
        llmCalls: stats.llm_calls ?? 0,
        inputTokens: stats.input_tokens ?? 0,
        outputTokens: stats.output_tokens ?? 0,
        steps: Number((out.ok && (out.result as Record<string, unknown>).steps) || collected.filter((e) => e.type === 'step').length),
        params,
        answer: out.ok ? String((out.result as Record<string, unknown>).answer ?? '') : '',
        stoppedReason: out.ok ? String((out.result as Record<string, unknown>).stopped_reason ?? '') : undefined,
        error: out.ok ? undefined : out.error.message,
        events: collected.slice(0, 200),
      })
      return out
    },
    [lab, title, app, opts.pip],
  )

  const stop = useCallback(() => {
    runId.current++
    bridge.restart()
    setRunning(false)
  }, [])

  return { run, stop, events, running, result, error, setEvents }
}
