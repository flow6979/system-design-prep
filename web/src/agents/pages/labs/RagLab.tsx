// 04 RAG / 02 PDF chat lab. Python: handbook lab-api/labapi/rag_lab.py (pypdf via micropip).
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { Icon, Seg } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { common } from '../../i18n/common'
import { ragLabDict } from '../../i18n/pages/ragLab'
import { useLabRun } from '../../lib/useLabRun'
import type { LabEvent } from '../../lib/worker'
import { useApp } from '../../state/app'
import '../../styles/pages/rag-lab.css'
import { useVisit } from '../../lib/useVisit'

type Source = 'sample' | 'upload' | 'text'
type Chunk = { id: string; page: number; score: number; text: string }
type Turn = { q: string; a: string; pages: number[]; noRag: boolean; grounded: boolean; chunks: Chunk[]; minScore: number }
type RagResult = { answer: string; pages?: number[] | number; chunks?: Chunk[]; embedder?: string; n_chunks?: number; no_rag?: boolean; gated?: boolean; ingested?: boolean }

const STAGES = ['load', 'chunk', 'embed', 'store', 'retrieve', 'generate'] as const
const MAX_BYTES = 5 * 1024 * 1024

export default function RagLab() {
  useVisit('04-rag/02-pdf-chat', '/agents/labs/rag')
  const t = useT(ragLabDict)
  const c = useT(common)
  const app = useApp()
  const g = useGuide('rag-lab', ['ingest', 'ask', 'cite', 'norag'])
  const lab = useLabRun<RagResult>('rag', 'RAG PDF chat', { pip: ['pypdf'] })

  const [source, setSource] = useState<Source>('sample')
  const [file, setFile] = useState<{ name: string; b64: string } | null>(null)
  const [fileErr, setFileErr] = useState('')
  const [text, setText] = useState('')
  const [strategy, setStrategy] = useState('lines')
  const [size, setSize] = useState(500)
  const [overlap, setOverlap] = useState(100)
  const [topK, setTopK] = useState(3)
  const [minScore, setMinScore] = useState(0.1)
  const [question, setQuestion] = useState(t.samples[0])
  const [noRag, setNoRag] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [info, setInfo] = useState<{ embedder: string; n: number; pages: number } | null>(null)
  const [selected, setSelected] = useState<{ turn: number; page: number } | null>(null)

  const docParams = () => ({
    source,
    chunk_size: size,
    overlap,
    strategy,
    ...(source === 'upload' ? { pdf_b64: file?.b64 ?? '', filename: file?.name } : {}),
    ...(source === 'text' ? { text } : {}),
  })
  const docReady = source === 'sample' || (source === 'upload' && !!file) || (source === 'text' && text.trim().length >= 20)
  const resetIndex = () => setInfo(null)

  const onFile = (f: File | undefined) => {
    setFileErr('')
    setFile(null)
    resetIndex()
    if (!f) return
    if (f.size > MAX_BYTES) return setFileErr(t.tooBig)
    const reader = new FileReader()
    reader.onload = () => setFile({ name: f.name, b64: String(reader.result).split(',', 2)[1] ?? '' })
    reader.readAsDataURL(f)
  }

  const ingest = async () => {
    const out = await lab.run({ action: 'ingest', ...docParams() })
    if (!out.ok) return
    const r = out.result
    setInfo({ embedder: r.embedder ?? '', n: r.n_chunks ?? 0, pages: typeof r.pages === 'number' ? r.pages : 0 })
    g.done('ingest', t.explain.ingest(r.n_chunks ?? 0, r.embedder ?? ''))
  }

  const ask = async (q = question) => {
    if (!q.trim()) return
    const history = turns.filter((x) => !x.noRag).slice(-4).map((x) => ({ q: x.q, a: x.a }))
    const out = await lab.run({ action: 'ask', ...docParams(), question: q, top_k: topK, min_score: minScore, no_rag: noRag, history })
    if (!out.ok) return
    const r = out.result
    const pages = Array.isArray(r.pages) ? r.pages : []
    const turn: Turn = { q, a: r.answer, pages, noRag: !!r.no_rag, grounded: !r.no_rag && !r.gated, chunks: r.chunks ?? [], minScore }
    setTurns((prev) => [...prev, turn])
    setSelected(null)
    if (r.embedder) setInfo((i) => ({ embedder: r.embedder!, n: r.n_chunks ?? i?.n ?? 0, pages: i?.pages ?? 0 }))
    if (turn.noRag) g.done('norag', t.explain.noRag)
    else g.done('ask', t.explain.ask(pages, r.llm_calls ?? 0))
  }

  const clickCite = (turn: number, page: number) => {
    setSelected({ turn, page })
    g.done('cite', t.explain.cite)
  }

  const stageState = useMemo(() => pipeline(lab.events), [lab.events])
  const lastTurnIdx = turns.length - 1
  const shownTurn = selected ? turns[selected.turn] : turns[lastTurnIdx]
  const shownChunks = lab.running ? liveChunks(lab.events) : shownTurn && !shownTurn.noRag ? shownTurn.chunks : []
  const highlightPage = selected?.page ?? null

  return (
    <div id="main" className="page col" style={{ gap: 16 }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Link to="/agents/map" className="btn btn-sm">{t.back}</Link>
        <span className="muted" style={{ fontSize: 14 }}>{t.crumb}</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <span className="badge badge-teal">{c.live}</span>
        <div style={{ flexGrow: 1 }} />
        <WorkerStatus compact />
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: 900 }}>{t.sub}</p>

      <ol className="rag-pipeline" aria-label="RAG pipeline" aria-live="polite">
        {STAGES.map((s, i) => {
          const st = stageState[s]
          return (
            <li key={s} className={`rag-stage rag-stage-${st?.status ?? 'idle'}`}>
              <span className="rag-stage-n" aria-hidden="true">{st?.status === 'done' ? <Icon name="check" size={12} /> : i + 1}</span>
              <span className="rag-stage-name">{t.stages[s]}</span>
              <span className="rag-stage-detail">
                {st?.detail ?? ''}
                {st?.ms != null && st.status === 'done' && st.ms > 0 ? ` · ${st.ms} ms` : ''}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="lab-grid">
        <section className="panel col" style={{ gap: 12 }} aria-labelledby="docs-h">
          <h2 id="docs-h" className="h2">{t.docsTitle}</h2>
          <Seg label={t.source} value={source} onChange={(v) => { setSource(v); resetIndex() }} options={[{ value: 'sample', label: t.sample }, { value: 'upload', label: t.upload }, { value: 'text', label: t.text }]} />
          {source === 'sample' && (
            <div className="row" style={{ gap: 10, padding: 12, borderRadius: 10, background: 'var(--panel-soft)', border: '1px solid var(--line-3)' }}>
              <Icon name="doc" /> <span style={{ fontSize: 13 }}>{t.sampleDesc}</span>
            </div>
          )}
          {source === 'upload' && (
            <div className="col" style={{ gap: 6 }}>
              <label htmlFor="rag-file" className="label">{t.uploadLabel}</label>
              <input id="rag-file" type="file" accept="application/pdf,.pdf" onChange={(e) => onFile(e.target.files?.[0])} className="rag-file" />
              {file && <span className="mono" style={{ fontSize: 12, color: 'var(--teal)' }}>{file.name}</span>}
              {fileErr && <span role="alert" style={{ fontSize: 12, color: 'var(--red)' }}>{fileErr}</span>}
            </div>
          )}
          {source === 'text' && (
            <div className="col" style={{ gap: 6 }}>
              <label htmlFor="rag-text" className="label">{t.textLabel}</label>
              <textarea id="rag-text" className="input" rows={6} value={text} placeholder={t.textPh} onChange={(e) => { setText(e.target.value); resetIndex() }} />
            </div>
          )}
          <fieldset className="col" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
            <legend className="eyebrow" style={{ marginBottom: 6 }}>{t.settings}</legend>
            <label className="label" htmlFor="rag-strategy">{t.strategy}</label>
            <select id="rag-strategy" className="input" value={strategy} onChange={(e) => { setStrategy(e.target.value); resetIndex() }}>
              {Object.entries(t.strategies).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <NumField id="rag-size" label={t.size} value={size} min={100} max={2000} step={50} onChange={(v) => { setSize(v); resetIndex() }} />
              <NumField id="rag-overlap" label={t.overlap} value={overlap} min={0} max={500} step={10} onChange={(v) => { setOverlap(v); resetIndex() }} />
            </div>
          </fieldset>
          <Tip show={g.is('ingest')}>{t.tipIngest}</Tip>
          <button type="button" className={`btn btn-primary ${g.pulse('ingest')}`} disabled={!docReady || lab.running} onClick={ingest}>
            {lab.running ? <span className="spinner" /> : <Icon name="upload" size={16} />}
            {lab.running ? t.ingesting : t.ingest}
          </button>
          {info && (
            <div className="col" style={{ gap: 4, fontSize: 13 }}>
              <span style={{ color: 'var(--teal-dark)', fontWeight: 600 }}>{t.ingested(info.n, info.pages)}</span>
              <span className="muted">
                {t.embedder}: <span className="mono">{info.embedder.startsWith('local') ? t.embedLocal : info.embedder}</span>
              </span>
            </div>
          )}
        </section>

        <section className="panel col" style={{ gap: 12 }} aria-labelledby="chat-h">
          <h2 id="chat-h" className="h2">{t.chatTitle}</h2>
          <div className="rag-chat" aria-live="polite">
            {!turns.length && <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{t.emptyChat}</p>}
            {turns.map((turn, i) => (
              <div key={i} className="col" style={{ gap: 6 }}>
                <div className="rag-msg rag-msg-user">
                  <span className="eyebrow">{t.you}</span>
                  {turn.q}
                </div>
                <div className={`rag-msg rag-msg-agent${turn.noRag ? ' rag-msg-norag' : ''}`}>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="eyebrow">{t.agent}</span>
                    <span className={`badge ${turn.noRag ? 'badge-amber' : turn.grounded ? 'badge-teal' : 'badge-gray'}`}>{turn.noRag ? t.noRagBadge : turn.grounded ? t.grounded : t.notFound}</span>
                  </div>
                  <span style={{ lineHeight: 1.55 }}>{withCitations(turn.a, (p) => clickCite(i, p), i === lastTurnIdx ? g.pulse('cite') : '', selected?.turn === i ? selected.page : null)}</span>
                </div>
              </div>
            ))}
          </div>
          <Tip show={g.is('cite') && turns.some((x) => x.pages.length)}>{t.tipCite}</Tip>
          <label htmlFor="rag-q" className="label">{t.ask}</label>
          <textarea id="rag-q" className="input" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }} />
          <div className="col" style={{ gap: 6 }}>
            <span className="label" style={{ fontSize: 12 }}>{t.samplesLabel}</span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {t.samples.map((s) => (
                <button key={s} type="button" className="chip" style={{ border: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => setQuestion(s)}>{s}</button>
              ))}
            </div>
          </div>
          <label className={`row rag-toggle ${g.pulse('norag')}`} style={{ gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={noRag} onChange={(e) => setNoRag(e.target.checked)} />
            {t.noRag}
          </label>
          <Tip show={g.is('norag')}>{t.tipNoRag}</Tip>
          {app.offline && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{c.offlineNote}</p>}
          <Tip show={g.is('ask')}>{t.tipAsk}</Tip>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-primary btn-lg ${g.pulse('ask')}`} disabled={lab.running || !question.trim() || (!docReady && !noRag)} onClick={() => ask()}>
              {lab.running ? <span className="spinner" /> : <Icon name="play" size={16} />}
              {lab.running ? t.asking : t.askBtn}
            </button>
            {lab.running && (
              <button type="button" className="btn" onClick={lab.stop}>
                <Icon name="stop" size={14} /> {c.stop}
              </button>
            )}
          </div>
          {lab.error && <LabError error={lab.error} />}
        </section>

        <section className="panel col" style={{ gap: 12 }} aria-labelledby="chunks-h">
          <h2 id="chunks-h" className="h2">{t.chunksTitle}</h2>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumField id="rag-k" label={t.topK} value={topK} min={1} max={8} step={1} onChange={setTopK} />
            <NumField id="rag-min" label={t.minScore} value={minScore} min={0} max={1} step={0.05} onChange={setMinScore} />
          </div>
          {!shownChunks.length && <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{t.chunksEmpty}</p>}
          <ol className="col" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
            {shownChunks.map((ch) => {
              const below = ch.score < (shownTurn?.minScore ?? minScore)
              const hi = highlightPage != null && ch.page === highlightPage
              return (
                <li key={ch.id} className={`rag-chunk al-in${hi ? ' rag-chunk-hi' : ''}${below ? ' rag-chunk-below' : ''}`}>
                  <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                    <span className="badge badge-violet">{t.page} {ch.page}</span>
                    <span className="mono" style={{ fontSize: 12 }}>{t.score} {ch.score.toFixed(2)}</span>
                  </div>
                  <div className="rag-bar" aria-hidden="true">
                    <div style={{ width: `${Math.max(2, Math.min(100, ch.score * 100))}%` }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{ch.text.length > 360 ? `${ch.text.slice(0, 360)}...` : ch.text}</p>
                  <span className="muted" style={{ fontSize: 11 }}>{below ? t.belowMin : t.why}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}

function NumField({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <label htmlFor={id} className="label" style={{ fontSize: 12 }}>{label}</label>
      <input
        id={id}
        className="input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
      />
    </div>
  )
}

function pipeline(events: LabEvent[]) {
  const out: Record<string, { status: string; detail?: string; ms?: number | null }> = {}
  for (const e of events) {
    if (e.kind !== 'stage') continue
    out[String(e.stage)] = { status: e.status === 'done' ? 'done' : 'running', detail: String(e.text ?? ''), ms: (e.ms as number | null) ?? null }
  }
  return out
}

function liveChunks(events: LabEvent[]): Chunk[] {
  const ev = [...events].reverse().find((e) => e.kind === 'chunks')
  return (ev?.chunks as Chunk[] | undefined) ?? []
}

/** "[p.3]" ko clickable button bana do. */
function withCitations(text: string, onCite: (p: number) => void, pulseCls: string, activePage: number | null): ReactNode[] {
  let first = true
  return text.split(/(\[p\.\d+\])/g).map((part, i) => {
    const m = /^\[p\.(\d+)\]$/.exec(part)
    if (!m) return <span key={i}>{part}</span>
    const p = Number(m[1])
    const cls = first ? pulseCls : ''
    first = false
    return (
      <button key={i} type="button" className={`rag-cite ${cls}${activePage === p ? ' rag-cite-on' : ''}`} onClick={() => onCite(p)} aria-label={`page ${p}`}>
        p.{p}
      </button>
    )
  })
}
