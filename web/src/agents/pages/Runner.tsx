// Generic runner: handbook ke KISI BHI project ka asli main.py browser mein (labapi 'project' lab).
// Route: /run/<project id>, e.g. /run/02-agentic-architectures/01-prompt-chaining
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LabError } from '../components/LabError'
import { Icon, Stat } from '../components/ui'
import { WorkerStatus } from '../components/WorkerStatus'
import { Tip, useGuide, type Explain } from '../guide/guide'
import { usePick, useT } from '../i18n'
import { common, githubFile } from '../i18n/common'
import { runnerDict } from '../i18n/pages/runner'
import { fetchRaw, findNode, loadTree, nodeTitle } from '../lib/handbook'
import { labFor } from '../lib/labRoutes'
import { markVisited } from '../lib/progress'
import { providerById } from '../lib/providers'
import { runnerRoute, type RunnerInput } from '../lib/projects'
import { useLabRun } from '../lib/useLabRun'
import { useProjects } from '../lib/useProjects'
import { useApp } from '../state/app'
import '../styles/pages/runner.css'

type Line = { key: number; kind: 'out' | 'err' | 'step' | 'meta'; text: string; tag?: string }

export default function Runner() {
  const id = (useParams()['*'] || '').replace(/\/$/, '')
  const t = useT(runnerDict)
  const c = useT(common)
  const pick = usePick()
  const app = useApp()
  const projects = useProjects()
  const info = projects[id]
  const [title, setTitle] = useState(id.split('/').pop() || id)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [openFile, setOpenFile] = useState<{ path: string; text: string } | null>(null)
  const g = useGuide('runner', ['run', 'watch'])
  const lab = useLabRun<{ exit_code: number; lines: number; shims: string[]; replay?: boolean; recorded_at?: string; command?: string }>('project', title, { pip: info?.pip })
  const outRef = useRef<HTMLOListElement>(null)
  const replay = info?.browser === 'replay'
  const dedicated = info?.lab_route ?? labFor(id)?.route
  const section = id.split('/')[0]

  useEffect(() => {
    loadTree().then((root) => {
      const n = findNode(root, id)
      if (n) setTitle(nodeTitle(n, app.lang).replace(/:\s*concepts.*$/i, ''))
    })
    markVisited(id, runnerRoute(id))
  }, [id, app.lang])

  useEffect(() => setValues({}), [id])

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = []
    lab.events.forEach((ev, i) => {
      if (ev.type === 'start') out.push({ key: i, kind: 'meta', text: `$ python ${info?.main ?? 'main.py'} ${(ev.argv as string[]).map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}` })
      else if (ev.type === 'replay') out.push({ key: i, kind: 'meta', text: `# ${t.replayBanner} · ${ev.recorded_at} · $ ${ev.command}` })
      else if (ev.type === 'step') out.push({ key: i, kind: 'step', tag: `${ev.agent}:${ev.kind}`, text: String(ev.text ?? '') })
      else if (ev.type === 'output') out.push({ key: i, kind: ev.stream === 'stderr' ? 'err' : 'out', text: String(ev.text ?? '') })
    })
    return out
  }, [lab.events, info, t])

  useEffect(() => {
    const el = outRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  if (!Object.keys(projects).length) return <div id="main" className="page muted">...</div>
  if (!info)
    return (
      <div id="main" className="page col">
        <h1 className="h1">{t.notFound}</h1>
        <Link className="btn" to="/agents" style={{ alignSelf: 'flex-start' }}>Map</Link>
      </div>
    )

  const inputs = info.inputs ?? []
  const valueOf = (inp: RunnerInput) => (values[inp.name] !== undefined ? values[inp.name] : inp.default ?? (inp.kind === 'flag' ? false : ''))
  const prov = providerById(app.provider)

  const run = async () => {
    const out = await lab.run({ project: id, values: Object.fromEntries(inputs.map((i) => [i.name, valueOf(i)])) })
    if (!out.ok) return
    const r = out.result
    const ex = info.explain ? pick(info.explain) : null
    const e: Explain = ex
      ? { title: ex.title, flow: ex.flow, lines: [...ex.lines, ...(r.replay ? [] : [`${r.llm_calls ?? 0} LLM calls · ${r.lines} lines`])], file: info.files?.[0] ?? info.main }
      : t.genericExplain(title, r.llm_calls ?? 0, r.lines, !!r.replay)
    g.done('run', e)
  }

  const showFile = async (path: string) => {
    if (openFile?.path === path) return setOpenFile(null)
    setOpenFile({ path, text: await fetchRaw(path).catch(() => '# could not load') })
    g.done('watch')
  }

  return (
    <div id="main" className="page col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
        <Link to={`/agents/section/${section}`} className="btn btn-sm">{t.back}</Link>
        <span className="muted mono" style={{ fontSize: 13 }}>{id}</span>
      </div>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>{title}</h1>
        <span className={`badge ${replay ? 'badge-violet' : 'badge-teal'}`}>{replay ? t.replay : t.live}</span>
        <div style={{ flexGrow: 1 }} />
        {dedicated && (
          <Link to={dedicated} className="btn btn-sm btn-outline">
            <Icon name="play" size={12} /> {t.dedicatedLab}
          </Link>
        )}
        <Link to={`/agents/docs/${id}`} className="btn btn-sm">
          <Icon name="doc" size={14} /> {t.learn}
        </Link>
        <a className="btn btn-sm" href={githubFile(info.main)} target="_blank" rel="noopener noreferrer">
          {t.github} <Icon name="external" size={12} />
        </a>
      </div>
      {info.summary && <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)', maxWidth: 900 }}>{pick(info.summary)}</p>}

      <div className="lab-grid runner-grid">
        <section className="panel col" style={{ gap: 12 }}>
          <h2 className="h2">{t.inputs}</h2>
          {replay ? (
            <div className="replay-banner">
              <strong>{t.replayBanner}</strong>
              <span>{info.replay_reason ? pick(info.replay_reason) : t.replayWhy}</span>
            </div>
          ) : inputs.length ? (
            inputs
              .filter((inp) => !(inp.kind === 'choice' && (inp.choices?.length ?? 0) <= 1)) // ek hi option = fixed, dikhane ki zaroorat nahi
              .map((inp) => <Field key={inp.name} inp={inp} value={valueOf(inp)} onChange={(v) => setValues((p) => ({ ...p, [inp.name]: v }))} />)
          ) : (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.noInputs}</p>
          )}
          {!replay && info.stdin && <p className="muted" style={{ margin: 0, fontSize: 12 }}>{t.stdinNote} {pick(info.stdin)}</p>}
          {!replay && (
            <p style={{ margin: 0, fontSize: 13, color: app.offline ? 'var(--amber)' : 'var(--muted)' }}>
              {app.offline ? t.offlineNote : t.liveNote.replace('{model}', prov?.model ?? '')}
            </p>
          )}
          {!replay && !app.offline && info.live_note && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{pick(info.live_note)}</p>}
          <Tip show={g.is('run')}>{t.tipRun}</Tip>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-primary btn-lg ${g.pulse('run')}`} onClick={run} disabled={lab.running}>
              {lab.running ? <span className="spinner" /> : <Icon name="play" size={16} />}
              {lab.running ? c.running : lab.result ? c.runAgain : c.run}
            </button>
            {lab.running && (
              <button type="button" className="btn" onClick={lab.stop}>
                <Icon name="stop" size={14} /> {c.stop}
              </button>
            )}
          </div>
          <WorkerStatus compact />
          {lab.error && <LabError error={lab.error} />}
        </section>

        <section className="panel col" style={{ gap: 10, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 className="h2">{t.output}</h2>
            {lab.result && <span className="muted mono" style={{ fontSize: 12 }}>{t.exit} {lab.result.exit_code}</span>}
          </div>
          <ol ref={outRef} className="terminal" aria-live="polite" aria-label={t.output}>
            {!lines.length && <li className="term-empty">{t.outputEmpty}</li>}
            {lines.map((l) => (
              <li key={l.key} className={`term-${l.kind}`}>
                {l.tag && <span className="term-tag">[{l.tag}]</span>} {l.text || ' '}
              </li>
            ))}
          </ol>
          {lab.result && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              <Stat label={t.stats.calls} value={lab.result.llm_calls ?? 0} />
              <Stat label={t.stats.tokens} value={(lab.result.input_tokens ?? 0) + (lab.result.output_tokens ?? 0)} />
              <Stat label={t.stats.time} value={`${((lab.result.ms ?? 0) / 1000).toFixed(1)} s`} />
              <Stat label={t.stats.lines} value={lab.result.lines} />
            </div>
          )}
        </section>

        <section className="panel col" style={{ gap: 12 }}>
          {info.watch && (
            <>
              <h2 className="h2">{t.watch}</h2>
              <Tip show={g.is('watch')}>{t.tipWatch}</Tip>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, lineHeight: 1.5 }}>
                {pick(info.watch).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </>
          )}
          {!!info.files?.length && (
            <>
              <h3 style={{ fontSize: 16 }}>{t.files}</h3>
              <div className="col" style={{ gap: 6 }}>
                {info.files.map((f) => (
                  <button key={f} type="button" className="file-btn mono" aria-pressed={openFile?.path === f} onClick={() => showFile(f)}>
                    <Icon name="code" size={14} /> {f.split('/').pop()}
                  </button>
                ))}
              </div>
            </>
          )}
          {!!lab.result?.shims?.length && (
            <>
              <h3 style={{ fontSize: 16 }}>{t.shims}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {lab.result.shims.map((s) => (
                  <li key={s}>{t.shimText[s] ?? s}</li>
                ))}
              </ul>
            </>
          )}
          {replay && lab.result?.command && (
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              {t.reproduce} <code>{lab.result.command}</code>
            </p>
          )}
        </section>
      </div>

      {openFile && (
        <section className="panel col" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 13 }}>{openFile.path}</span>
            <div className="row" style={{ gap: 8 }}>
              <a className="btn btn-sm" href={githubFile(openFile.path)} target="_blank" rel="noopener noreferrer">GitHub <Icon name="external" size={12} /></a>
              <button type="button" className="btn btn-sm" onClick={() => setOpenFile(null)}>{t.hideCode}</button>
            </div>
          </div>
          <pre className="code-view">
            {openFile.text.split('\n').map((l, i) => (
              <span key={i} className="code-line">
                <span className="code-ln">{i + 1}</span>
                {l || ' '}
                {'\n'}
              </span>
            ))}
          </pre>
        </section>
      )}
    </div>
  )
}

function Field({ inp, value, onChange }: { inp: RunnerInput; value: unknown; onChange: (v: unknown) => void }) {
  const pick = usePick()
  const id = `in-${inp.name}`
  const label = inp.label ? pick(inp.label) : inp.name
  const help = inp.help ? pick(inp.help) : null
  if (inp.kind === 'flag')
    return (
      <label className="row" style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>
          {label} {inp.arg && <code className="muted" style={{ fontSize: 11 }}>{inp.arg}</code>}
          {help && <span className="muted" style={{ display: 'block', fontSize: 12 }}>{help}</span>}
        </span>
      </label>
    )
  return (
    <div className="col" style={{ gap: 4 }}>
      <label htmlFor={id} className="label">
        {label} {inp.arg && <code style={{ fontSize: 11 }}>{inp.arg}</code>}
      </label>
      {inp.kind === 'choice' ? (
        <select id={id} className="input" value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {(inp.choices ?? []).map((ch) => (
            <option key={String(ch)} value={String(ch)}>{String(ch)}</option>
          ))}
        </select>
      ) : inp.kind === 'textarea' ? (
        <textarea id={id} className="input" rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="input" type={inp.kind === 'number' ? 'number' : 'text'} value={String(value ?? '')} onChange={(e) => onChange(inp.kind === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />
      )}
      {help && <span className="muted" style={{ fontSize: 12 }}>{help}</span>}
    </div>
  )
}
