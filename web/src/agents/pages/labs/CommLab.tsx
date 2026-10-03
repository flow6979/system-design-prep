// 05 Agent communication: MCP + A2A. REPLAY of a real local run (handbook lab-api/labapi/comm_lab.py,
// recorded by lab-api/record_comm_traces.py). Real servers cannot run in a browser, so nothing here is simulated:
// every arrow is a message the real handbook code sent.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { CodeBlock, Icon, Seg } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { commLabDict } from '../../i18n/pages/commLab'
import { useLabRun } from '../../lib/useLabRun'
import '../../styles/pages/comm-lab.css'
import { useVisit } from '../../lib/useVisit'

type Protocol = 'mcp' | 'a2a'
type Msg = { seq: number; t_ms: number; from: string; to: string; kind: string; method: string | null; label: string; json: unknown; state?: string | null; error?: boolean }
type Replay = { lanes: string[]; question: string; answer: string; messages: Msg[]; recorded_at: string; command: string; mcp_sdk?: string; python?: string; project: string }

const STATES = ['submitted', 'working', 'input-required', 'completed']
const KIND_CLASS: Record<string, string> = { request: 'k-req', response: 'k-res', notification: 'k-note', llm: 'k-llm', tool_result: 'k-res', note: 'k-note', answer: 'k-ans', human: 'k-human', input_required: 'k-human', internal: 'k-internal', sse: 'k-sse' }
const WIRE_KINDS = new Set(['request', 'response', 'notification', 'sse'])

export default function CommLab() {
  useVisit('05-agent-communication/07-mcp', '/agents/labs/comm')
  const t = useT(commLabDict)
  const g = useGuide('comm-lab', ['play', 'arrow', 'a2a', 'playA2a'])
  const lab = useLabRun<Replay>('comm', 'MCP + A2A (replay)')
  const [protocol, setProtocol] = useState<Protocol>('mcp')
  const [data, setData] = useState<Partial<Record<Protocol, Replay>>>({})
  const [shown, setShown] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const listRef = useRef<HTMLOListElement>(null)

  const replay = data[protocol]
  const msgs = useMemo(() => replay?.messages ?? [], [replay])

  // Recorded trace Pyodide worker se lo (ek baar per protocol). Koi LLM call nahi, isliye offline.
  useEffect(() => {
    if (data[protocol]) return
    let live = true
    lab.run({ protocol }, { offline: true }).then((out) => {
      if (live && out.ok) setData((d) => ({ ...d, [protocol]: out.result }))
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol])

  useEffect(() => () => stopTimer(), [])
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-seq="${shown}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [shown])

  function stopTimer() {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    setPlaying(false)
  }

  function finished(p: Protocol) {
    if (p === 'mcp') g.done('play', t.explain.mcpDone)
    else g.done('playA2a', t.explain.a2aDone)
  }

  function play() {
    if (!msgs.length) return
    stopTimer()
    let n = shown >= msgs.length ? 0 : shown
    setShown(n)
    setPlaying(true)
    const p = protocol
    const total = msgs.length
    timer.current = window.setInterval(() => {
      n += 1
      setShown(n)
      setSelected(n)
      if (n >= total) {
        stopTimer()
        finished(p)
      }
    }, 650)
  }

  function next() {
    stopTimer()
    const n = Math.min(shown + 1, msgs.length)
    setShown(n)
    setSelected(n)
    if (n === msgs.length && shown < msgs.length) finished(protocol)
  }

  function showAll() {
    stopTimer()
    const wasDone = shown >= msgs.length
    setShown(msgs.length)
    if (!wasDone && msgs.length) finished(protocol)
  }

  function switchProtocol(p: Protocol) {
    if (p === protocol) return
    stopTimer()
    setProtocol(p)
    setShown(0)
    setSelected(null)
    if (p === 'a2a') g.done('a2a', t.explain.toA2a)
  }

  function pick(m: Msg) {
    setSelected(m.seq)
    if (WIRE_KINDS.has(m.kind)) g.done('arrow', t.explain.arrow(m.method ?? m.label))
  }

  const lanes = replay?.lanes ?? (protocol === 'mcp' ? ['host', 'client', 'server'] : ['user', 'orchestrator', 'remote'])
  const visible = msgs.slice(0, shown)
  const sel = msgs.find((m) => m.seq === selected) ?? null
  const reached = useMemo(() => {
    const s = msgs.slice(0, shown).map((m) => m.state).filter(Boolean) as string[]
    return { set: new Set(s), current: s[s.length - 1] }
  }, [msgs, shown])
  const recordedAt = replay ? replay.recorded_at.replace('T', ' ').replace('Z', ' UTC') : ''
  const legendKinds = ['request', 'response', 'llm', protocol === 'mcp' ? 'notification' : 'sse', protocol === 'a2a' ? 'internal' : 'tool_result']

  return (
    <div id="main" className="page col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Link to="/agents" className="btn btn-sm">{t.back}</Link>
        <span className="muted" style={{ fontSize: 14 }}>{t.crumb} /</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <span className="badge badge-amber">{t.replayBadge}</span>
        <div style={{ flexGrow: 1 }} />
        <Link to={`/agents/docs/05-agent-communication/${protocol === 'mcp' ? '07-mcp' : '08-a2a'}`} className="btn btn-sm">
          <Icon name="doc" size={16} /> {t.docs}
        </Link>
        <Seg label={t.protocol} value={protocol} onChange={switchProtocol} className={g.pulse('a2a')} options={[{ value: 'mcp', label: 'MCP' }, { value: 'a2a', label: 'A2A' }]} />
      </div>
      <Tip show={g.is('a2a')} align="end">{t.tipA2a}</Tip>

      <section className="comm-replay" aria-label={t.replayTitle}>
        <div className="col" style={{ gap: 4, minWidth: 0 }}>
          <strong>{t.replayTitle}</strong>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.replayWhy}</span>
          {replay && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {t.recorded}: {recordedAt} · mcp {replay.mcp_sdk} · Python {replay.python} · {replay.project}
            </span>
          )}
        </div>
        {replay && (
          <div className="col" style={{ gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.reproduce}</span>
            <code className="comm-cmd">{replay.command}</code>
          </div>
        )}
      </section>

      <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.subtitle[protocol]}</p>

      <div className="comm-grid">
        <section className="panel col" style={{ gap: 12, minWidth: 0 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-primary ${g.pulse('play') || g.pulse('playA2a')}`} onClick={play} disabled={!msgs.length || playing}>
              {playing ? <span className="spinner" /> : <Icon name="play" size={16} />}
              {playing ? t.playing : t.play}
            </button>
            <button type="button" className="btn" onClick={next} disabled={!msgs.length || shown >= msgs.length}>{t.step}</button>
            <button type="button" className="btn btn-sm" onClick={showAll} disabled={!msgs.length}>{t.showAll}</button>
            <button type="button" className="btn btn-sm" onClick={() => { stopTimer(); setShown(0); setSelected(null) }} disabled={!shown}>{t.reset}</button>
            <span className="muted" style={{ fontSize: 13 }}>{shown} {t.of} {msgs.length}</span>
            <WorkerStatus compact />
          </div>
          <Tip show={g.is('play') || g.is('playA2a')}>{protocol === 'mcp' ? t.tipPlay : t.tipPlayA2a}</Tip>
          <Tip show={g.is('arrow') && shown > 0}>{t.tipArrow}</Tip>
          {lab.error && <LabError error={lab.error} />}

          {replay && (
            <div className="comm-question">
              <span className="eyebrow">{t.question}</span> {replay.question}
            </div>
          )}

          {protocol === 'a2a' && (
            <div className="col" style={{ gap: 6 }}>
              <span className="eyebrow">{t.states}</span>
              <ol className="comm-states">
                {STATES.map((s) => (
                  <li key={s} className={`${reached.set.has(s) ? 'on' : ''} ${reached.current === s ? 'current' : ''}`} aria-current={reached.current === s ? 'step' : undefined}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          <div className={`comm-seq ${g.pulse('arrow') && shown > 0 ? 'al-pulse' : ''}`} style={{ '--lanes': lanes.length } as CSSProperties}>
            <div className="comm-lanes" aria-hidden="true">
              {lanes.map((l) => (
                <div key={l} className="comm-lane-head">{t.lanes[l] ?? l}</div>
              ))}
            </div>
            <div className="comm-lifelines" aria-hidden="true">
              {lanes.map((l, i) => (
                <span key={l} style={{ left: `${((i + 0.5) / lanes.length) * 100}%` }} />
              ))}
            </div>
            {!replay && <p className="muted" style={{ fontSize: 14, padding: 16, margin: 0 }}>{t.loading}</p>}
            <ol ref={listRef} className="comm-rows" aria-live="polite">
              {visible.map((m) => (
                <SeqRow key={m.seq} m={m} lanes={lanes} selected={selected === m.seq} onPick={pick} laneName={(l) => t.lanes[l] ?? l} kindName={t.kinds[m.kind] ?? m.kind} />
              ))}
            </ol>
          </div>

          {replay && shown >= msgs.length && msgs.length > 0 && (
            <div className="comm-answer al-in">
              <span className="eyebrow">{t.answer}</span>
              <span>{String(replay.answer)}</span>
            </div>
          )}

          <div className="comm-legend" aria-label={t.legend}>
            {legendKinds.map((k) => (
              <span key={k} className={`comm-legend-item ${KIND_CLASS[k]}`}>{t.kinds[k]}</span>
            ))}
          </div>
        </section>

        <aside className="panel col comm-json" style={{ gap: 10, minWidth: 0 }} aria-live="polite">
          <h2 className="h2">{t.json}</h2>
          {sel ? (
            <>
              <dl className="comm-meta">
                <div><dt>{t.meta.seq}</dt><dd>{sel.seq}</dd></div>
                <div><dt>{t.meta.t}</dt><dd>{sel.t_ms} ms</dd></div>
                <div><dt>{t.meta.kind}</dt><dd>{t.kinds[sel.kind] ?? sel.kind}</dd></div>
                {sel.method && <div><dt>{t.meta.method}</dt><dd className="mono">{sel.method}</dd></div>}
                {sel.state && <div><dt>{t.meta.state}</dt><dd className="mono">{sel.state}</dd></div>}
              </dl>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {t.lanes[sel.from] ?? sel.from} → {t.lanes[sel.to] ?? sel.to}
              </div>
              <CodeBlock maxHeight={520}>{typeof sel.json === 'string' ? sel.json : JSON.stringify(sel.json, null, 2)}</CodeBlock>
            </>
          ) : (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.jsonEmpty}</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function SeqRow({ m, lanes, selected, onPick, laneName, kindName }: { m: Msg; lanes: string[]; selected: boolean; onPick: (m: Msg) => void; laneName: (l: string) => string; kindName: string }) {
  const n = lanes.length
  const a = Math.max(0, lanes.indexOf(m.from))
  const b = Math.max(0, lanes.indexOf(m.to))
  const self = a === b
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const cls = KIND_CLASS[m.kind] ?? 'k-note'
  const style: CSSProperties = self
    ? { left: `${(a / n) * 100 + 2}%`, width: `${100 / n - 4}%` }
    : { left: `${((lo + 0.5) / n) * 100}%`, width: `${((hi - lo) / n) * 100}%` }
  return (
    <li data-seq={m.seq} className="comm-row al-in">
      <button type="button" className={`comm-msg ${cls} ${self ? 'self' : b > a ? 'right' : 'left'} ${selected ? 'selected' : ''} ${m.error ? 'err' : ''}`} style={style} onClick={() => onPick(m)} aria-pressed={selected} aria-label={`${m.seq}. ${laneName(m.from)} → ${laneName(m.to)}: ${m.label} (${kindName})`}>
        <span className="comm-label">
          <span className="comm-seqno">{m.seq}</span> {m.label}
        </span>
        {!self && <span className="comm-arrow" aria-hidden="true" />}
      </button>
    </li>
  )
}
