// 02 / 04 ReAct lab. Tabs: Samjho (CONCEPTS.md), Chalao (live run), Code, Tinker.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { Markdown } from '../../components/Markdown'
import { llmMeta, TraceList, type TraceItem } from '../../components/Trace'
import { Icon, Seg, Stat } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { common } from '../../i18n/common'
import { reactLabDict } from '../../i18n/pages/reactLab'
import { docFile, fetchRaw, findNode, loadTree } from '../../lib/handbook'
import { useLabRun } from '../../lib/useLabRun'
import { useApp } from '../../state/app'
import ReactCode from './ReactCode'
import ReactTinker from './ReactTinker'
import { useVisit } from '../../lib/useVisit'

export const REACT_PROJECT = '02-agentic-architectures/04-react'
type Tab = 'learn' | 'run' | 'code' | 'tinker'
type Mode = 'text' | 'native'

const TONE: Record<string, TraceItem['tone']> = { thought: 'teal', action: 'amber', tool_call: 'amber', observation: 'violet', tool_result: 'violet', answer: 'solid', format_error: 'red', stopped: 'red' }
const NODE: Record<Mode, Record<string, number>> = {
  text: { thought: 1, action: 2, observation: 3, format_error: 1, answer: 4, stopped: 4 },
  native: { thought: 1, tool_call: 2, tool_result: 3, answer: 4, stopped: 4 },
}

export default function ReactLab() {
  useVisit('02-agentic-architectures/04-react', '/agents/lab/react/run')
  const { tab: tabParam } = useParams()
  const tab = (['learn', 'run', 'code', 'tinker'].includes(tabParam ?? '') ? tabParam : 'run') as Tab
  const navigate = useNavigate()
  const t = useT(reactLabDict)
  const g = useGuide('react-lab', ['run', 'mode', 'rerun', 'code'])

  const tabs = (['learn', 'run', 'code', 'tinker'] as Tab[]).map((k) => ({ value: k, label: t.tabs[k] }))
  const goTab = (k: Tab) => {
    if (k === 'code') g.done('code', g.current === 'code' ? t.explain.code : undefined)
    navigate(`/agents/lab/react/${k}`)
  }

  return (
    <div id="main" className="page col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Link to="/agents/section/02-agentic-architectures" className="btn btn-sm">{t.back}</Link>
        <span className="muted" style={{ fontSize: 14 }}>{t.crumb} /</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <div style={{ flexGrow: 1 }} />
        <Seg label="Lab tabs" value={tab} onChange={goTab} options={tabs} className={g.pulse('code')} />
      </div>
      <Tip show={g.is('code') && tab === 'run'} align="end">{t.tipCode}</Tip>
      {tab === 'learn' && <LearnTab />}
      {tab === 'run' && <RunTab g={g} />}
      {tab === 'code' && <ReactCode />}
      {tab === 'tinker' && <ReactTinker />}
    </div>
  )
}

function LearnTab() {
  const { lang } = useApp()
  const [doc, setDoc] = useState<{ file: string; text: string } | null>(null)
  useEffect(() => {
    let live = true
    loadTree()
      .then((root) => {
        const node = findNode(root, REACT_PROJECT)
        const file = node && docFile(node, 'CONCEPTS', lang)
        if (!file) throw new Error('CONCEPTS not found')
        return fetchRaw(file).then((text) => live && setDoc({ file, text }))
      })
      .catch(() => live && setDoc(null))
    return () => {
      live = false
    }
  }, [lang])
  return <section className="panel">{doc ? <Markdown source={doc.text} file={doc.file} /> : <p className="muted">...</p>}</section>
}

function RunTab({ g }: { g: ReturnType<typeof useGuide> }) {
  const t = useT(reactLabDict)
  const c = useT(common)
  const app = useApp()
  const [mode, setMode] = useState<Mode>('text')
  const [question, setQuestion] = useState(t.samples[0])
  const lab = useLabRun<{ answer: string; stopped_reason: string; steps: number }>('react', 'ReAct')

  const items = useMemo<TraceItem[]>(() => {
    const out: TraceItem[] = []
    let meta: string | undefined
    lab.events.forEach((ev, i) => {
      if (ev.type === 'llm_call') meta = llmMeta(ev)
      else if (ev.type === 'step') {
        const k = ev.kind ?? ''
        out.push({ key: String(i), kind: t.kinds[k] ?? k, text: String(ev.text ?? ''), meta: meta ?? (k.includes('observation') || k === 'tool_result' ? 'tool' : undefined), mono: k === 'action' || k === 'tool_call', tone: ev.error ? 'red' : TONE[k] })
        meta = undefined
      }
    })
    return out
  }, [lab.events, t])

  const lastStep = [...lab.events].reverse().find((e) => e.type === 'step')
  const activeNode = lab.running ? (lastStep ? NODE[mode][lastStep.kind ?? ''] ?? 0 : 0) : lab.result ? 4 : -1

  const run = async () => {
    const out = await lab.run({ mode, question })
    if (!out.ok) return
    const r = out.result
    const tokens = (r.input_tokens ?? 0) + (r.output_tokens ?? 0)
    let e = mode === 'text' ? t.explain.runText(r.llm_calls ?? 0, Math.max(0, (r.steps ?? 1) - 1)) : t.explain.runNative(r.llm_calls ?? 0, tokens)
    if (r.stopped_reason === 'max_steps') e = t.explain.stopped
    if (mode === 'text') g.done('run', e)
    else if (g.current === 'rerun') g.done('rerun', e)
    else g.explain(e)
  }

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    lab.setEvents([])
    if (m === 'native') g.done('mode', t.explain.mode)
  }

  const nodes = t.nodes[mode]
  return (
    <div className="lab-grid">
      <section className="panel col" style={{ gap: 14 }}>
        <h2 className="h2">{t.conceptTitle}</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3)' }}>{t.concept}</p>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          {nodes.map(([label, sub], i) => {
            const on = i === activeNode
            return (
              <li key={label} className="col" style={{ alignItems: 'center', gap: 6 }}>
                <div aria-current={on ? 'step' : undefined} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 14, transition: 'all .2s', background: on ? 'var(--teal)' : 'var(--panel-soft)', color: on ? 'var(--accent-ink)' : 'var(--ink)', border: `1px solid ${on ? 'var(--teal)' : 'var(--line)'}` }}>
                  <span style={{ fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{sub}</span>
                </div>
                {i < nodes.length - 1 && <Icon name="down" size={14} />}
              </li>
            )
          })}
        </ol>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>{t.loopNote}</p>
      </section>

      <section className="panel col" style={{ gap: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <h2 className="h2">{t.runTitle}</h2>
          <Seg label="ReAct style" value={mode} onChange={switchMode} className={g.pulse('mode')} options={[{ value: 'text', label: 'Text ReAct' }, { value: 'native', label: 'Native tool calling' }]} />
        </div>
        <Tip show={g.is('mode')} align="end">{t.tipMode}</Tip>
        <label htmlFor="q" className="label">{t.ask}</label>
        <textarea id="q" className="input" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} />
        <div className="col" style={{ gap: 6 }}>
          <span className="label" style={{ fontSize: 12 }}>{t.samplesLabel}</span>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {t.samples.map((s) => (
              <button key={s} type="button" className="chip" style={{ border: 0, cursor: 'pointer' }} onClick={() => setQuestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="chip">{t.tools}: lookup</span>
          <span className="chip">calculator</span>
          <span className="chip">max_steps = 8</span>
        </div>
        {app.offline && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{t.offlineNote}</p>}
        <Tip show={g.is('run') || g.is('rerun')}>{g.current === 'rerun' ? t.tipRerun : t.tipRun}</Tip>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={`btn btn-primary btn-lg ${g.pulse('run') || g.pulse('rerun')}`} onClick={run} disabled={lab.running || !question.trim()}>
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
        <div style={{ flexGrow: 1 }} />
        <div aria-live="polite" style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6, background: lab.result ? 'var(--teal-bg)' : 'var(--panel-soft)', border: lab.result ? '1px solid var(--teal)' : '1px dashed var(--line-2)' }}>
          <span className="eyebrow">{t.finalAnswer}</span>
          <span style={{ fontSize: 16, lineHeight: 1.5, color: lab.result ? 'var(--ink)' : 'var(--muted)' }}>{lab.result ? lab.result.answer : t.pending}</span>
        </div>
      </section>

      <section className="panel col" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 className="h2">{t.traceTitle}</h2>
          <span className="muted" style={{ fontSize: 12 }}>{lab.running ? `${t.stepN} ${items.length}` : lab.result ? t.done : t.idle}</span>
        </div>
        <TraceList items={items} empty={t.traceEmpty} />
        <div style={{ flexGrow: 1 }} />
        {lab.result && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            <Stat label={t.stats.calls} value={lab.result.llm_calls ?? 0} />
            <Stat label={t.stats.tokens} value={(lab.result.input_tokens ?? 0) + (lab.result.output_tokens ?? 0)} />
            <Stat label={t.stats.time} value={`${((lab.result.ms ?? 0) / 1000).toFixed(2)} s`} />
          </div>
        )}
      </section>
    </div>
  )
}
