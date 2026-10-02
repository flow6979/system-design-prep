// ReAct lab, Tinker tab: TESTING.md exercises ko live controls se asli lab pe chalao aur baseline se compare karo.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { llmMeta, TraceList, type TraceItem } from '../../components/Trace'
import { Icon, Seg } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide, type Explain } from '../../guide/guide'
import { useT } from '../../i18n'
import { common } from '../../i18n/common'
import { reactTinkerDict } from '../../i18n/pages/reactTinker'
import { useLabRun, type LabStats } from '../../lib/useLabRun'
import type { LabEvent } from '../../lib/worker'
import { useApp } from '../../state/app'
import '../../styles/pages/react-code.css'

type Mode = 'text' | 'native'
type R = { answer: string; stopped_reason: string; steps: number }
const QUESTION = 'How many times taller is Mount Everest than the Eiffel Tower?'
const DEFAULTS = { maxSteps: 8, docstring: true, failsFirst: false, mode: 'text' as Mode }
const TONE: Record<string, TraceItem['tone']> = { thought: 'teal', action: 'amber', tool_call: 'amber', observation: 'violet', tool_result: 'violet', answer: 'solid', format_error: 'red', stopped: 'red' }

function toItems(events: LabEvent[]): TraceItem[] {
  const out: TraceItem[] = []
  let meta: string | undefined
  events.forEach((ev, i) => {
    if (ev.type === 'llm_call') meta = llmMeta(ev)
    else if (ev.type === 'step') {
      const k = ev.kind ?? ''
      out.push({ key: String(i), kind: k, text: String(ev.text ?? ''), meta, mono: k === 'action' || k === 'tool_call', tone: ev.error ? 'red' : TONE[k] })
      meta = undefined
    }
  })
  return out
}

export default function ReactTinker() {
  const t = useT(reactTinkerDict)
  const c = useT(common)
  const app = useApp()
  const g = useGuide('react-tinker', ['slider', 'run'])
  const [maxSteps, setMaxSteps] = useState(DEFAULTS.maxSteps)
  const [docstring, setDocstring] = useState(DEFAULTS.docstring)
  const [failsFirst, setFailsFirst] = useState(DEFAULTS.failsFirst)
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode)
  const base = useLabRun<R>('react', 'ReAct tinker baseline')
  const mine = useLabRun<R>('react', 'ReAct tinker')
  const items = useMemo(() => toItems(mine.events), [mine.events])

  const anyRunning = base.running || mine.running
  const changed = { steps: maxSteps !== DEFAULTS.maxSteps, doc: docstring !== DEFAULTS.docstring, fail: failsFirst !== DEFAULTS.failsFirst, mode: mode !== DEFAULTS.mode }

  const onSlider = (v: number) => {
    setMaxSteps(v)
    if (v <= 2 && g.current === 'slider') g.done('slider', t.sliderExplain(v))
  }

  const runBaseline = () => base.run({ mode: DEFAULTS.mode, question: QUESTION, max_steps: DEFAULTS.maxSteps })

  const runMine = async () => {
    if (!base.result && !base.running) await runBaseline()
    const out = await mine.run({ mode, question: QUESTION, max_steps: maxSteps, calculator_docstring: docstring, lookup_fails_first: failsFirst })
    if (!out.ok) return
    let e: Explain = t.exp.same
    if (out.result.stopped_reason === 'max_steps') e = t.exp.limit(maxSteps)
    else if (failsFirst) e = t.exp.error
    else if (!docstring) e = t.exp.nodoc
    else if (changed.mode) e = t.exp.mode
    if (g.current === 'run' || g.current === 'slider') g.done('run', e)
    else g.explain(e)
  }

  const reset = () => {
    setMaxSteps(DEFAULTS.maxSteps)
    setDocstring(DEFAULTS.docstring)
    setFailsFirst(DEFAULTS.failsFirst)
    setMode(DEFAULTS.mode)
  }

  const card = (on: boolean) => `rt-card${on ? ' changed' : ''}`
  const badge = (on: boolean) => <span className={`badge ${on ? 'badge-teal' : 'badge-gray'}`}>{on ? t.changed : t.dflt}</span>

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="col" style={{ gap: 4 }}>
        <h2 className="h2" style={{ fontSize: 24 }}>{t.title}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.sub}</p>
        <p style={{ margin: 0, fontSize: 13 }}>
          <span className="muted">{t.question}:</span> <span className="mono">{QUESTION}</span>
        </p>
      </div>

      <div className="rt-cards">
        <section className={card(changed.steps)} aria-labelledby="e1">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">{t.ex} 1</span>
            {badge(changed.steps)}
          </div>
          <h3 id="e1" style={{ fontSize: 17 }}>{t.e1t}</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{t.e1d}</p>
          <Tip show={g.is('slider')}>{t.tipSlider}</Tip>
          <label htmlFor="rt-steps" className="label">
            {t.stepsLabel}: <strong className="mono" style={{ color: 'var(--ink)' }}>{maxSteps}</strong>
          </label>
          <input id="rt-steps" type="range" min={1} max={10} value={maxSteps} onChange={(e) => onSlider(Number(e.target.value))} className={g.pulse('slider')} style={{ width: '100%', accentColor: 'var(--teal)' }} />
        </section>

        <section className={card(changed.doc)} aria-labelledby="e2">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">{t.ex} 2</span>
            {badge(changed.doc)}
          </div>
          <h3 id="e2" style={{ fontSize: 17 }}>{t.e2t}</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{t.e2d}</p>
          <label className="row" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={docstring} onChange={(e) => setDocstring(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--teal)' }} />
            {t.e2c}
          </label>
          <code className="mono" style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, background: 'var(--chip)', color: 'var(--ink-3)', whiteSpace: 'pre-wrap' }}>
            {docstring ? 'description="Evaluate an arithmetic expression like \'8849 / 330\'..."' : 'description="x"'}
          </code>
        </section>

        <section className={card(changed.fail)} aria-labelledby="e3">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">{t.ex} 3</span>
            {badge(changed.fail)}
          </div>
          <h3 id="e3" style={{ fontSize: 17 }}>{t.e3t}</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{t.e3d}</p>
          <label className="row" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={failsFirst} onChange={(e) => setFailsFirst(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--teal)' }} />
            {t.e3c}
          </label>
        </section>

        <section className={card(changed.mode)} aria-labelledby="e4">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">{t.ex} 4</span>
            {badge(changed.mode)}
          </div>
          <h3 id="e4" style={{ fontSize: 17 }}>{t.e4t}</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{t.e4d}</p>
          <Seg label={t.modeLabel} value={mode} onChange={setMode} options={[{ value: 'text', label: 'Text ReAct' }, { value: 'native', label: 'Native' }]} />
          <Link to="/agents/settings" className="row" style={{ gap: 6, fontSize: 13 }}>
            <Icon name="settings" size={14} /> {t.settings}
          </Link>
        </section>
      </div>

      {app.offline && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{t.offlineNote}</p>}
      <Tip show={g.is('run')}>{t.tipRun}</Tip>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className={`btn btn-primary btn-lg ${g.pulse('run')}`} onClick={runMine} disabled={anyRunning}>
          {mine.running ? <span className="spinner" /> : <Icon name="play" size={16} />}
          {mine.running ? c.running : t.run}
        </button>
        <button type="button" className="btn" onClick={runBaseline} disabled={anyRunning}>
          {base.running ? <span className="spinner" /> : null} {t.baselineRun}
        </button>
        <button type="button" className="btn" onClick={reset} disabled={anyRunning}>
          {t.reset}
        </button>
        {anyRunning && (
          <button type="button" className="btn" onClick={() => (mine.running ? mine.stop() : base.stop())}>
            <Icon name="stop" size={14} /> {c.stop}
          </button>
        )}
        <WorkerStatus compact />
      </div>
      {base.error && <LabError error={base.error} />}
      {mine.error && <LabError error={mine.error} />}

      <section className="panel col" style={{ gap: 12 }} aria-labelledby="rt-cmp">
        <h2 id="rt-cmp" className="h2">{t.compare}</h2>
        <div className="rt-compare" aria-live="polite">
          <Column title={t.baseline} r={base.result} running={base.running} other={mine.result} t={t} />
          <Column title={t.mine} r={mine.result} running={mine.running} other={base.result} t={t} />
        </div>
      </section>

      {items.length > 0 && (
        <section className="panel col" style={{ gap: 12 }}>
          <h2 className="h2" style={{ fontSize: 18 }}>{t.trace}</h2>
          <TraceList items={items} />
        </section>
      )}
    </div>
  )
}

type TD = (typeof reactTinkerDict)['hi']
function Column({ title, r, running, other, t }: { title: string; r: (R & LabStats) | null; running: boolean; other: (R & LabStats) | null; t: TD }) {
  const rows: [string, string | number, string | number | undefined][] = r
    ? [
        [t.k.steps, r.steps, other?.steps],
        [t.k.calls, r.llm_calls ?? 0, other?.llm_calls],
        [t.k.tokens, (r.input_tokens ?? 0) + (r.output_tokens ?? 0), other ? (other.input_tokens ?? 0) + (other.output_tokens ?? 0) : undefined],
        [t.k.stop, r.stopped_reason, other?.stopped_reason],
      ]
    : []
  return (
    <div className="col" style={{ gap: 6, padding: 14, borderRadius: 12, background: 'var(--panel-soft)', border: '1px solid var(--line-3)' }}>
      <span className="eyebrow">{title}</span>
      {!r && <span className="muted" style={{ fontSize: 13 }}>{running ? t.runningNote : t.noRun}</span>}
      {rows.map(([k, v, o]) => (
        <div key={k} className="rt-row">
          <span className="muted">{k}</span>
          <span className={`v${o !== undefined && o !== v ? ' diff' : ''}`}>{v}</span>
        </div>
      ))}
      {r && (
        <div className="col" style={{ gap: 4, marginTop: 4 }}>
          <span className="muted" style={{ fontSize: 12 }}>{t.k.answer}</span>
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>{r.answer}</span>
        </div>
      )}
    </div>
  )
}
