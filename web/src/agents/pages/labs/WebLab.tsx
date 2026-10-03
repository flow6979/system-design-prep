// 03 / 04 Deep research agent lab. Plan | activity feed | cited report.
// Python side: handbook lab-api/labapi/web_lab.py (DeepResearcher + browser-safe Wikipedia/Tavily).
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LabError } from '../../components/LabError'
import { Markdown } from '../../components/Markdown'
import { TraceList, type TraceItem } from '../../components/Trace'
import { Icon, Progress } from '../../components/ui'
import { WorkerStatus } from '../../components/WorkerStatus'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { common } from '../../i18n/common'
import { webLabDict } from '../../i18n/pages/webLab'
import { useLabRun } from '../../lib/useLabRun'
import { useApp } from '../../state/app'
import '../../styles/pages/web-lab.css'
import { useVisit } from '../../lib/useVisit'

type Provider = 'wikipedia' | 'tavily'
type WebResult = { report: string; sources: string[]; sub_questions: string[]; rounds: number; searches: number; max_searches: number; pages: number; max_pages: number; notes: number }
type SearchHit = { title: string; url: string; snippet: string }
type Status = 'covered' | 'working' | 'pending'

const TONE: Record<string, TraceItem['tone']> = { plan: 'violet', search: 'amber', read: 'teal', note: 'solid', coverage: 'violet', skipped: 'red', report: 'gray' }
const shortUrl = (u: string) => u.replace(/^https?:\/\//, '').replace(/^www\./, '')

export default function WebLab() {
  useVisit('03-web-agents/04-deep-research-agent', '/agents/labs/web')
  const t = useT(webLabDict)
  const c = useT(common)
  const app = useApp()
  const g = useGuide('web-lab', ['start', 'source', 'cors'])
  const tavilyKey = app.keys.tavily ?? ''
  const [question, setQuestion] = useState(t.defaultQ)
  const [provider, setProvider] = useState<Provider>('wikipedia')
  const [maxSearches, setMaxSearches] = useState(5)
  const [maxPages, setMaxPages] = useState(8)
  const lab = useLabRun<WebResult>('web', 'Deep research')

  const steps = useMemo(() => lab.events.filter((e) => e.type === 'step'), [lab.events])
  const lastBudget = [...steps].reverse().find((e) => e.kind === 'budget')
  const searches = Number(lastBudget?.searches ?? 0)
  const pages = Number(lastBudget?.pages ?? 0)

  // Plan: pehla plan event + coverage check ke naye sawaal (round 2)
  const plan = useMemo(() => {
    const out: { q: string; round2: boolean }[] = []
    for (const e of steps) {
      if (e.kind === 'plan') for (const q of (e.sub_questions as string[]) ?? []) out.push({ q, round2: false })
      if (e.kind === 'coverage' && !e.complete) for (const q of (e.missing as string[]) ?? []) out.push({ q, round2: true })
    }
    const covered = new Set(steps.filter((e) => e.kind === 'note').map((e) => String(e.sub_question)))
    const lastSearch = [...steps].reverse().find((e) => e.kind === 'search')
    return out.map((p) => ({ ...p, status: (covered.has(p.q) ? 'covered' : lab.running && lastSearch?.text === p.q ? 'working' : 'pending') as Status }))
  }, [steps, lab.running])

  const items = useMemo<TraceItem[]>(
    () =>
      steps
        .filter((e) => e.kind !== 'budget')
        .map((e, i) => {
          const k = e.kind ?? ''
          let text: ReactNode = String(e.text ?? '')
          let meta: string | undefined
          if (k === 'search') {
            const hits = (e.results as SearchHit[]) ?? []
            text = `search("${e.text}")`
            meta = `${e.provider} · ${t.results(hits.length)}${hits.length ? ` · ${hits.slice(0, 3).map((h) => h.title).join(', ')}` : ''}`
          } else if (k === 'read') {
            text = shortUrl(String(e.text))
            meta = t.readMeta(Number(e.chars ?? 0), Number(e.injection_lines ?? 0))
          } else if (k === 'note') meta = shortUrl(String(e.source_url ?? ''))
          else if (k === 'coverage') text = t.coverageText(!!e.complete, (e.missing as string[]) ?? [])
          else if (k === 'report') text = t.reportText(((e.sources as string[]) ?? []).length)
          else if (k === 'plan') text = ((e.sub_questions as string[]) ?? []).join(' · ')
          return { key: String(i), kind: t.kinds[k] ?? k, text, meta, mono: k === 'search' || k === 'read', tone: TONE[k] }
        }),
    [steps, t],
  )

  const report = lab.result?.report ?? ''
  const reportBody = report.split(/\n## Sources\n/)[0]
  const sources = lab.result?.sources ?? []

  const start = async () => {
    const out = await lab.run({ question, provider, max_searches: maxSearches, max_pages: maxPages, ...(provider === 'tavily' ? { tavily_key: tavilyKey } : {}) })
    if (!out.ok) return
    const r = out.result
    g.done('start', t.explain.research({ subs: r.sub_questions.length, searches: r.searches, maxSearches: r.max_searches, pages: r.pages, maxPages: r.max_pages, rounds: r.rounds, sources: r.sources.length }))
  }

  return (
    <div id="main" className="page col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Link to="/agents" className="btn btn-sm">{t.back}</Link>
        <span className="muted" style={{ fontSize: 14 }}>{t.crumb} /</span>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{t.title}</h1>
        <div style={{ flexGrow: 1 }} />
        <span className={`badge ${app.offline ? 'badge-amber' : 'badge-teal'}`}>{app.offline ? c.offlineChip : t.liveBadge}</span>
      </div>

      <section className="panel col" style={{ gap: 12 }}>
        <label htmlFor="web-q" className="label">{t.qLabel}</label>
        <div className="web-top">
          <input id="web-q" className="input" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !lab.running && question.trim() && start()} />
          <button type="button" className={`btn btn-primary btn-lg ${g.pulse('start')}`} onClick={start} disabled={lab.running || !question.trim()}>
            {lab.running ? <span className="spinner" /> : <Icon name="play" size={16} />}
            {lab.running ? c.running : lab.result ? t.again : t.start}
          </button>
          {lab.running && (
            <button type="button" className="btn" onClick={lab.stop}>
              <Icon name="stop" size={14} /> {c.stop}
            </button>
          )}
        </div>
        <div className="web-controls">
          <div className="col" style={{ gap: 6 }}>
            <span className="label" id="web-prov">{t.providerLabel}</span>
            <div role="group" aria-labelledby="web-prov" className="seg">
              <button type="button" aria-pressed={provider === 'wikipedia'} onClick={() => setProvider('wikipedia')}>
                {t.wikipedia}
              </button>
              <button type="button" aria-pressed={provider === 'tavily'} disabled={!tavilyKey || app.offline} title={!tavilyKey ? t.tavilyNeedsKey : undefined} onClick={() => setProvider('tavily')}>
                {t.tavily}
              </button>
            </div>
          </div>
          <label className="col" style={{ gap: 6 }}>
            <span className="label">{t.maxSearches}: {maxSearches}</span>
            <input type="range" min={1} max={8} value={maxSearches} disabled={lab.running} onChange={(e) => setMaxSearches(Number(e.target.value))} />
          </label>
          <label className="col" style={{ gap: 6 }}>
            <span className="label">{t.maxPages}: {maxPages}</span>
            <input type="range" min={1} max={10} value={maxPages} disabled={lab.running} onChange={(e) => setMaxPages(Number(e.target.value))} />
          </label>
          <div className="col" style={{ gap: 6, alignItems: 'flex-start' }}>
            <button type="button" className={`btn btn-sm ${g.pulse('cors')}`} onClick={() => g.done('cors', t.explain.cors)}>
              <Icon name="warn" size={14} /> {t.corsBtn}
            </button>
            <WorkerStatus compact />
          </div>
        </div>
        <Tip show={g.is('start')}>{t.tipStart}</Tip>
        <Tip show={g.is('cors')}>{t.tipCors}</Tip>
        {app.offline && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>
            {c.offlineNote} {t.simulated}
          </p>
        )}
        {lab.error && <LabError error={lab.error} />}
      </section>

      <div className="lab-grid">
        <section className="panel col" style={{ gap: 14 }}>
          <div className="col" style={{ gap: 4 }}>
            <h2 className="h2">{t.planTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.planSub}</p>
          </div>
          {plan.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.planEmpty}</p>
          ) : (
            <ol className="web-plan" aria-live="polite">
              {plan.map((p, i) => (
                <li key={i}>
                  <span>{p.q}</span>
                  <span className="row" style={{ gap: 6, flexShrink: 0 }}>
                    {p.round2 && <span className="badge badge-violet">{t.roundTag}</span>}
                    <span className={`badge ${p.status === 'covered' ? 'badge-teal' : p.status === 'working' ? 'badge-amber' : 'badge-gray'}`}>{t[p.status]}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="col" style={{ gap: 10, marginTop: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.budgetTitle}</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.budgetSub}</p>
            <div className="col" style={{ gap: 4 }}>
              <span style={{ fontSize: 13 }}>
                {t.searches} {searches}/{maxSearches}
              </span>
              <Progress pct={Math.min(100, (searches / maxSearches) * 100)} label={t.searches} />
            </div>
            <div className="col" style={{ gap: 4 }}>
              <span style={{ fontSize: 13 }}>
                {t.pages} {pages}/{maxPages}
              </span>
              <Progress pct={Math.min(100, (pages / maxPages) * 100)} label={t.pages} />
            </div>
          </div>
        </section>

        <section className="panel col" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 className="h2">{t.feedTitle}</h2>
            <span className="muted" style={{ fontSize: 12 }}>{lab.running ? `${t.stepWord} ${items.length}` : lab.result ? t.finished : t.idle}</span>
          </div>
          <div className="web-feed">
            <TraceList items={items} empty={t.feedEmpty} />
          </div>
        </section>

        <section className="panel col" style={{ gap: 12 }}>
          <h2 className="h2">{t.reportTitle}</h2>
          {!report ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.reportEmpty}</p>
          ) : (
            <>
              <div className="web-report">
                <Markdown source={reportBody} file="report.md" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.sources}</h3>
              <Tip show={g.is('source')}>{t.tipSource}</Tip>
              <ol className="web-sources">
                {sources.map((u, i) => (
                  <li key={u}>
                    <span className="mono">[{i + 1}]</span>
                    <a href={u} target="_blank" rel="noopener noreferrer" className={g.pulse('source')} onClick={() => g.done('source', t.explain.source)}>
                      {shortUrl(u)} <Icon name="external" size={12} />
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
