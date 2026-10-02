// Run history: localStorage se asli runs (src/lib/history.ts), filter, compare, trace download.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT } from '../i18n'
import { historyDict } from '../i18n/pages/history'
import { clearHistory, estimateCost, loadHistory, type RunRecord } from '../lib/history'
import '../styles/pages/history.css'

type Filter = 'all' | 'ok' | 'fail' | `lab:${string}`

const fmtCost = (c: number) => (c === 0 ? '$0' : c < 0.0001 ? '<$0.0001' : `$${c.toFixed(4)}`)
const fmtMs = (ms: number) => `${(ms / 1000).toFixed(2)} s`
const runLabel = (r: RunRecord) => `${r.title}${r.params.mode ? ` (${r.params.mode})` : ''}`

export default function History() {
  const t = useT(historyDict)
  const g = useGuide('history', ['compare', 'download'])
  const [runs, setRuns] = useState<RunRecord[]>(() => loadHistory())
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const on = () => setRuns(loadHistory())
    window.addEventListener('agentlab:history', on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener('agentlab:history', on)
      window.removeEventListener('storage', on)
    }
  }, [])

  const labs = useMemo(() => Array.from(new Map(runs.map((r) => [r.lab, r.title])).entries()), [runs])
  const shown = runs.filter((r) => (filter === 'all' ? true : filter === 'ok' ? r.ok : filter === 'fail' ? !r.ok : r.lab === filter.slice(4)))
  const pair = selected.map((id) => runs.find((r) => r.id === id)).filter(Boolean) as RunRecord[]

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)
      if (next.length === 2) {
        const [a, b] = next.map((x) => runs.find((r) => r.id === x)!)
        g.done('compare', t.explain.compare(runLabel(a), runLabel(b)))
      }
      return next
    })
  }

  const download = (r: RunRecord) => {
    const body = r.events.map((e) => JSON.stringify(e)).join('\n') + '\n'
    const url = URL.createObjectURL(new Blob([body], { type: 'application/x-ndjson' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `trace-${r.lab}-${r.id}.jsonl`
    a.click()
    URL.revokeObjectURL(url)
    g.done('download', t.explain.download)
  }

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: t.all },
    { value: 'ok', label: t.passed },
    { value: 'fail', label: t.failed },
    ...labs.map(([id, title]) => ({ value: `lab:${id}` as Filter, label: title })),
  ]

  return (
    <div id="main" className="page col" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div className="col" style={{ gap: 4, maxWidth: 760 }}>
          <h1 className="h1">{t.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
        </div>
        {runs.length > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              if (window.confirm(t.confirmClear)) {
                clearHistory()
                setSelected([])
              }
            }}
          >
            {t.clear}
          </button>
        )}
      </div>

      {runs.length === 0 ? (
        <section className="panel col" style={{ gap: 10, alignItems: 'flex-start' }}>
          <h2 className="h2">{t.emptyTitle}</h2>
          <p className="muted" style={{ margin: 0 }}>{t.emptyBody}</p>
          <Link to="/agents/lab/react/run" className="btn btn-primary">
            {t.emptyCta} <Icon name="arrow" />
          </Link>
        </section>
      ) : (
        <div className="history-grid">
          <section className="panel col" style={{ gap: 12, minWidth: 0 }}>
            <div role="group" aria-label="Filter" className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {chips.map((c) => (
                <button key={c.value} type="button" className={`filter-chip${filter === c.value ? ' on' : ''}`} aria-pressed={filter === c.value} onClick={() => setFilter(c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
            <Tip show={g.is('compare')}>{t.tipCompare}</Tip>
            <div className="table-wrap">
              <table className="runs-table">
                <thead>
                  <tr>
                    <th scope="col"><span className="visually-hidden">{t.cols.select}</span></th>
                    <th scope="col">{t.cols.lab}</th>
                    <th scope="col">{t.cols.provider}</th>
                    <th scope="col">{t.cols.status}</th>
                    <th scope="col" className="num">{t.cols.steps}</th>
                    <th scope="col" className="num">{t.cols.tokens}</th>
                    <th scope="col" className="num">{t.cols.cost}</th>
                    <th scope="col" className="num">{t.cols.time}</th>
                    <th scope="col">{t.cols.when}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => {
                    const sel = selected.includes(r.id)
                    const tok = r.inputTokens + r.outputTokens
                    return (
                      <tr key={r.id} className={sel ? 'sel' : ''}>
                        <td>
                          <input type="checkbox" className={g.pulse('compare')} checked={sel} onChange={() => toggle(r.id)} aria-label={`${t.cols.select}: ${runLabel(r)}`} />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{runLabel(r)}</div>
                          <div className="mono muted" style={{ fontSize: 11 }}>{r.lab}</div>
                        </td>
                        <td>
                          <div>{r.provider}</div>
                          <div className="mono muted" style={{ fontSize: 11 }}>{r.model}</div>
                        </td>
                        <td>
                          <span className={`badge ${r.ok ? 'badge-teal' : 'badge-red'}`}>{r.ok ? t.ok : t.fail}</span>
                          {r.offline && <span className="badge badge-gray" style={{ marginLeft: 4 }}>{t.offline}</span>}
                        </td>
                        <td className="num">{r.steps}</td>
                        <td className="num">{tok}</td>
                        <td className="num">{fmtCost(estimateCost(r.provider, r.inputTokens, r.outputTokens))}</td>
                        <td className="num">{fmtMs(r.ms)}</td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{t.ago(Math.floor((Date.now() - r.startedAt) / 60000))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>{t.costNote}</p>
          </section>

          <section className="panel col" style={{ gap: 12 }} aria-labelledby="cmp-h">
            <h2 id="cmp-h" className="h2">{t.compareTitle}</h2>
            {pair.length < 2 ? (
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.compareHint}</p>
            ) : (
              <Compare a={pair[0]} b={pair[1]} />
            )}
            {pair.length > 0 && (
              <>
                <Tip show={g.is('download')}>{t.tipDownload}</Tip>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {pair.map((r, i) => (
                    <button key={r.id} type="button" className={`btn btn-sm ${g.pulse('download')}`} onClick={() => download(r)}>
                      {t.download} ({i === 0 ? 'A' : 'B'})
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function Compare({ a, b }: { a: RunRecord; b: RunRecord }) {
  const t = useT(historyDict)
  const rows: { label: string; va: number | string; vb: number | string; fmt?: (v: number) => string; lower?: boolean }[] = [
    { label: t.metrics.steps, va: a.steps, vb: b.steps, lower: true },
    { label: t.metrics.calls, va: a.llmCalls, vb: b.llmCalls, lower: true },
    { label: t.metrics.tokens, va: a.inputTokens + a.outputTokens, vb: b.inputTokens + b.outputTokens, lower: true },
    { label: t.metrics.ms, va: a.ms, vb: b.ms, fmt: fmtMs, lower: true },
    { label: t.metrics.cost, va: estimateCost(a.provider, a.inputTokens, a.outputTokens), vb: estimateCost(b.provider, b.inputTokens, b.outputTokens), fmt: fmtCost, lower: true },
    { label: t.metrics.stopped, va: a.stoppedReason || (a.ok ? '-' : 'error'), vb: b.stoppedReason || (b.ok ? '-' : 'error') },
  ]
  return (
    <>
      <div className="table-wrap">
        <table className="runs-table compare">
          <thead>
            <tr>
              <th scope="col">{t.metric}</th>
              <th scope="col">A: {runLabel(a)}</th>
              <th scope="col">B: {runLabel(b)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const num = typeof r.va === 'number' && typeof r.vb === 'number'
              const aBetter = num && r.lower && r.va < r.vb
              const bBetter = num && r.lower && r.vb < r.va
              const show = (v: number | string) => (typeof v === 'number' && r.fmt ? r.fmt(v) : String(v))
              return (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td className={aBetter ? 'better' : ''}>{show(r.va)}</td>
                  <td className={bBetter ? 'better' : ''}>{show(r.vb)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>{t.better}</span>
      {[a, b].map((r, i) => (
        <div key={r.id} className="answer-box">
          <span className="eyebrow">
            {i === 0 ? 'A' : 'B'} · {r.ok ? t.answer : t.error}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>{r.ok ? r.answer || '-' : r.error}</span>
        </div>
      ))}
    </>
  )
}
