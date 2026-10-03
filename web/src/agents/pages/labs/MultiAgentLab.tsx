// 06 Multi-agent lab: supervisor / crew / group chat / swarm, handbook ka asli code (labapi 'multi').
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { TraceList, type TraceItem } from '../../components/Trace'
import { Icon, Seg, Stat } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { common } from '../../i18n/common'
import { multiLabDict, type Topology } from '../../i18n/pages/multiLab'
import { providerById } from '../../lib/providers'
import { useLabRun } from '../../lib/useLabRun'
import type { LabEvent } from '../../lib/worker'
import { useApp } from '../../state/app'
import '../../styles/pages/multi-lab.css'
import { useVisit } from '../../lib/useVisit'

const DEFAULT_TASKS: Record<Topology, string> = {
  supervisor: 'Should I install solar panels at home? Give a short, accurate answer.',
  crew: 'a tiny calculator library that adds two numbers',
  groupchat: 'Plan 3 days in Goa under INR 30k',
  swarm: 'I want a refund for order A100',
}

type Node = { id: string; x: number; y: number; hub?: boolean }
const GRAPHS: Record<Topology, { nodes: Node[]; edges: [string, string][] }> = {
  supervisor: {
    nodes: [{ id: 'supervisor', x: 330, y: 235 }, { id: 'researcher', x: 120, y: 75 }, { id: 'writer', x: 540, y: 75 }, { id: 'critic', x: 330, y: 405 }],
    edges: [['supervisor', 'researcher'], ['supervisor', 'writer'], ['supervisor', 'critic']],
  },
  crew: {
    nodes: [{ id: 'pm', x: 110, y: 110 }, { id: 'architect', x: 330, y: 110 }, { id: 'developer', x: 550, y: 110 }, { id: 'qa', x: 550, y: 360 }],
    edges: [['pm', 'architect'], ['architect', 'developer'], ['developer', 'qa']],
  },
  groupchat: {
    nodes: [{ id: 'hub', x: 330, y: 235, hub: true }, { id: 'planner', x: 120, y: 80 }, { id: 'budget_keeper', x: 540, y: 80 }, { id: 'local_guide', x: 120, y: 395 }, { id: 'manager', x: 540, y: 395 }],
    edges: [['hub', 'planner'], ['hub', 'budget_keeper'], ['hub', 'local_guide'], ['hub', 'manager']],
  },
  swarm: {
    nodes: [{ id: 'triage', x: 120, y: 110 }, { id: 'orders', x: 540, y: 110 }, { id: 'refunds', x: 540, y: 370 }, { id: 'tech', x: 120, y: 370 }],
    edges: [['triage', 'orders'], ['triage', 'refunds'], ['triage', 'tech'], ['orders', 'refunds']],
  },
}

const TONE: Record<string, TraceItem['tone']> = { route: 'amber', message: 'teal', handoff: 'violet', tool: 'amber', tool_result: 'violet', done: 'solid' }
const TIMELINE_KINDS = ['route', 'message', 'handoff', 'tool', 'tool_result']

type MultiResult = { answer: string; stopped_reason: string; rounds: number; path?: string[]; selector?: string; reworks?: number; roles: string[] }

/** Kaunsa edge light karna hai: route (supervisor -> worker), message/handoff (sender -> receiver). */
function edgeFor(topology: Topology, ev: LabEvent | undefined): [string, string] | null {
  if (!ev) return null
  if (ev.kind === 'route' && ev.next && ev.next !== 'FINISH') return ['supervisor', String(ev.next)]
  const s = String(ev.sender ?? '')
  const r = String(ev.receiver ?? '')
  if (ev.kind === 'message' || ev.kind === 'handoff') {
    if (topology === 'groupchat') return s && s !== 'user' ? ['hub', s] : null
    if (s && r && s !== 'user' && r !== 'user') return [s, r]
  }
  return null
}

export default function MultiAgentLab() {
  useVisit('06-multi-agent-systems/03-supervisor-team', '/agents/labs/multi')
  const t = useT(multiLabDict)
  const c = useT(common)
  const app = useApp()
  const g = useGuide('multi-lab', ['run', 'topology', 'rerun'])
  const [topology, setTopology] = useState<Topology>('supervisor')
  const [task, setTask] = useState(DEFAULT_TASKS.supervisor)
  const [selector, setSelector] = useState('llm')
  const [maxRounds, setMaxRounds] = useState(8)
  const lab = useLabRun<MultiResult>('multi', 'Multi-agent')

  const steps = useMemo(() => lab.events.filter((e) => e.type === 'step'), [lab.events])
  const lastRound = [...steps].reverse().find((e) => e.kind === 'round')
  const lastActive = [...steps].reverse().find((e) => e.kind === 'agent_active')
  const lastEdgeEv = [...steps].reverse().find((e) => edgeFor(topology, e))
  const activeRole = lab.running ? String(lastActive?.role ?? '') : ''
  const activeEdge = lab.running ? edgeFor(topology, lastEdgeEv) : null
  const doneEv = steps.find((e) => e.kind === 'done')

  const callsByRole = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of lab.events) if (e.type === 'llm_call' && e.role) m[String(e.role)] = (m[String(e.role)] ?? 0) + 1
    return m
  }, [lab.events])

  const roleName = (id: string) => (id === 'hub' ? t.hub : t.roles[id]?.[0] ?? id)
  const target = (id: unknown) => (id === 'all' ? t.hub : id === 'user' ? t.user : roleName(String(id)))
  const items: TraceItem[] = steps
    .filter((e) => TIMELINE_KINDS.includes(e.kind ?? ''))
    .map((e, i) => {
      const k = e.kind ?? ''
      const who = k === 'message' || k === 'handoff' ? `${roleName(String(e.sender))} → ${target(e.receiver)}` : k === 'route' ? roleName('supervisor') : roleName(String(e.role ?? ''))
      return { key: String(i), kind: t.kinds[k] ?? k, text: String(e.text ?? ''), meta: who, mono: k === 'route' || k === 'tool', tone: e.error ? 'red' : TONE[k] }
    })

  const primary = providerById(app.provider)
  const modelFor = (role: string) => (app.offline ? 'ScriptedLLM' : app.roleModels[role] || primary?.spec || '')
  const graph = GRAPHS[topology]
  const roles = graph.nodes.filter((n) => !n.hub).map((n) => n.id)
  const pos = Object.fromEntries(graph.nodes.map((n) => [n.id, n]))

  const switchTopology = (next: Topology) => {
    if (next === topology || lab.running) return
    setTopology(next)
    setTask(DEFAULT_TASKS[next])
    lab.setEvents([])
    const e = t.explain.switched(next)
    if (g.current === 'topology') g.done('topology', e)
    else g.explain(e)
  }

  const run = async () => {
    const models: Record<string, string> = {}
    for (const r of roles) if (app.roleModels[r]) models[r] = app.roleModels[r]
    const out = await lab.run({ topology, task, max_rounds: maxRounds, selector, models })
    if (!out.ok) return
    const r = out.result
    const e = t.explain.ran(topology, { rounds: r.rounds, reason: t.reasons[r.stopped_reason] ?? r.stopped_reason, calls: r.llm_calls ?? 0, path: r.path, selector: t.selectors[r.selector ?? ''] ?? r.selector, reworks: r.reworks })
    if (g.current === 'run') g.done('run', e)
    else if (g.current === 'rerun' && topology !== 'supervisor') g.done('rerun', e)
    else g.explain(e)
  }

  const reason = lab.result ? lab.result.stopped_reason : doneEv ? String(doneEv.reason) : ''
  const rerunTip = g.is('rerun') && topology !== 'supervisor'

  return (
    <div id="main" className="page col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Link to="/agents" className="btn btn-sm">{t.back}</Link>
        <span className="muted" style={{ fontSize: 14 }}>{t.crumb} /</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <div style={{ flexGrow: 1 }} />
        <Link to="/agents/docs/06-multi-agent-systems" className="btn btn-sm">
          <Icon name="doc" size={16} /> {t.docs}
        </Link>
      </div>

      <section className="panel col" style={{ gap: 10 }} aria-label={t.topoLabel}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <span className="eyebrow">{t.topoLabel}</span>
          <Seg label={t.topoLabel} value={topology} onChange={switchTopology} className={g.pulse('topology')} options={(['supervisor', 'crew', 'groupchat', 'swarm'] as Topology[]).map((k) => ({ value: k, label: t.topo[k] }))} />
          <Tip show={g.is('topology')}>{t.tipTopology}</Tip>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.topoSub[topology]}</p>
      </section>

      <div className="multi-grid">
        <section className="panel col" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h2 className="h2">{t.graphTitle}</h2>
            {lastRound && (
              <span className="badge badge-gray" aria-live="polite">
                {t.round} {String(lastRound.n)}
                {lastRound.max ? ` / ${String(lastRound.max)}` : ''}
              </span>
            )}
          </div>
          <svg viewBox="0 0 660 470" className="multi-graph" role="img" aria-label={t.graphAria(activeRole ? roleName(activeRole) : '')}>
            {graph.edges.map(([a, b]) => {
              const on = !!activeEdge && ((activeEdge[0] === a && activeEdge[1] === b) || (activeEdge[0] === b && activeEdge[1] === a))
              return <line key={`${a}-${b}`} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} style={{ stroke: on ? 'var(--teal)' : 'var(--line-2)', strokeWidth: on ? 5 : 2, transition: 'all .2s' }} />
            })}
            {graph.nodes.map((n) => {
              const on = n.id === activeRole || (!!n.hub && !!activeEdge && activeEdge[0] === 'hub')
              const [label, sub] = n.hub ? [t.hub, t.selectors[selector] ?? ''] : t.roles[n.id] ?? [n.id, '']
              const calls = callsByRole[n.id]
              return (
                <g key={n.id} transform={`translate(${n.x - 100},${n.y - 38})`}>
                  <rect width="200" height="76" rx="14" style={{ fill: on ? 'var(--teal)' : n.hub ? 'var(--chip)' : 'var(--panel)', stroke: on ? 'var(--teal)' : 'var(--line-2)', strokeWidth: on ? 3 : 1.5, transition: 'all .2s' }} />
                  <text x="100" y="30" textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, fill: on ? 'var(--accent-ink)' : 'var(--ink)' }}>
                    {label}
                  </text>
                  <text x="100" y="50" textAnchor="middle" style={{ fontSize: 12, fill: on ? 'var(--accent-ink)' : 'var(--muted)' }}>
                    {sub}
                  </text>
                  {calls ? (
                    <text x="100" y="66" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: on ? 'var(--accent-ink)' : 'var(--teal)' }}>
                      {t.calls(calls)}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </svg>
          <div className="col" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span className="eyebrow">{t.modelsTitle}</span>
              
            </div>
            <ul className="multi-models">
              {roles.map((r) => (
                <li key={r} className="chip">
                  <span style={{ fontWeight: 600 }}>{roleName(r)}</span>
                  <span className="mono" style={{ fontSize: 12, color: app.roleModels[r] && !app.offline ? 'var(--amber)' : 'var(--muted)' }}>
                    {modelFor(r)}
                  </span>
                </li>
              ))}
            </ul>
            <span className="muted" style={{ fontSize: 12 }}>{t.modelsNote}</span>
          </div>
          <div className="multi-context">
            <span className="eyebrow">{t.contextTitle}</span>
            <ul>
              {t.context[topology].map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="col" style={{ gap: 16 }}>
          <div className="panel col" style={{ gap: 10 }}>
            <label htmlFor="multi-task" className="label">
              {t.task}
            </label>
            <textarea id="multi-task" className="input" rows={2} value={task} onChange={(e) => setTask(e.target.value)} />
            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              {topology === 'groupchat' && (
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="label">{t.selector}</span>
                  <Seg label={t.selector} value={selector} onChange={setSelector} options={['llm', 'rules', 'roundrobin'].map((k) => ({ value: k, label: t.selectors[k] }))} />
                </div>
              )}
              {topology !== 'crew' && (
                <label className="row label" style={{ gap: 8 }}>
                  {t.maxRounds}
                  <select className="input" style={{ width: 80, height: 36, padding: '0 8px' }} value={maxRounds} onChange={(e) => setMaxRounds(Number(e.target.value))}>
                    {[3, 4, 6, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {app.offline && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{c.offlineNote}</p>}
            <Tip show={g.is('run') || rerunTip}>{g.current === 'rerun' ? t.tipRerun : t.tipRun}</Tip>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className={`btn btn-primary btn-lg ${g.pulse('run') || (rerunTip ? 'al-pulse' : '')}`} onClick={run} disabled={lab.running || !task.trim()}>
                {lab.running ? <span className="spinner" /> : <Icon name="play" size={16} />}
                {lab.running ? c.running : lab.result ? c.runAgain : c.run}
              </button>
              {lab.running && (
                <button type="button" className="btn" onClick={lab.stop}>
                  <Icon name="stop" size={14} /> {c.stop}
                </button>
              )}
              <WorkerStatus compact />
            </div>
            {lab.error && <LabError error={lab.error} />}
          </div>

          <div className="panel col" style={{ gap: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 className="h2">{t.timeline}</h2>
              <span className="muted" style={{ fontSize: 12 }}>{items.length || ''}</span>
            </div>
            <div className="multi-timeline">
              <TraceList items={items} empty={t.timelineEmpty} />
            </div>
          </div>

          <div aria-live="polite" className="panel col" style={{ gap: 10, background: lab.result ? 'var(--teal-bg)' : undefined, borderColor: lab.result ? 'var(--teal)' : undefined }}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span className="eyebrow">{t.finalOutput}</span>
              {reason && (
                <span className="badge badge-teal">
                  {t.termination}: {t.reasons[reason] ?? reason}
                </span>
              )}
            </div>
            <div className="multi-answer" style={{ color: lab.result ? 'var(--ink)' : 'var(--muted)' }}>
              {lab.result ? lab.result.answer : t.pending}
            </div>
            {lab.result && (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                <Stat label="LLM calls" value={lab.result.llm_calls ?? 0} />
                <Stat label="Tokens" value={(lab.result.input_tokens ?? 0) + (lab.result.output_tokens ?? 0)} />
                <Stat label={t.round} value={lab.result.rounds} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
