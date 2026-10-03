// Learning map (/map): handbook ke asli tree (docs.json) se section cards.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Progress } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT } from '../i18n'
import { homeDict } from '../i18n/pages/home'
import { findNode, loadTree, type DocNode } from '../lib/handbook'
import { labFor } from '../lib/labRoutes'
import { runnerRoute } from '../lib/projects'
import { useProjects } from '../lib/useProjects'
import { getProgress, markVisited, onProgress } from '../lib/progress'
import { PATH_ORDER, projectLabel, projectsOf, sectionNum, shortTitle } from '../lib/sections'
import { useApp } from '../state/app'
import '../styles/pages/map.css'

const REACT_ID = '02-agentic-architectures/04-react'

export default function Home() {
  const runMan = useProjects()
  const t = useT(homeDict)
  const { lang } = useApp()
  const navigate = useNavigate()
  const g = useGuide('map', ['react-row', 'path'])
  const [root, setRoot] = useState<DocNode | null>(null)
  const [err, setErr] = useState(false)
  const [progress, setProgress] = useState(getProgress)

  useEffect(() => {
    loadTree().then(setRoot).catch(() => setErr(true))
    return onProgress(() => setProgress(getProgress()))
  }, [])

  const sections = root ? root.children.filter((s) => s.id !== 'lab-api' || Object.keys(s.docs).length) : []
  const visited = progress.visited

  const open = (id: string, route: string) => {
    markVisited(id, route)
    if (id === REACT_ID) g.done('react-row', t.explainReact)
    navigate(route)
  }

  const lastNode = root && progress.last ? findNode(root, progress.last.id) : null

  return (
    <div id="main" className="page col" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div className="col" style={{ gap: 6 }}>
          <h1 className="h1">{t.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
        </div>
        <Tip show={g.is('react-row')} align="end">{t.tipReact}</Tip>
      </div>

      <section className="continue-strip" aria-label={t.continueTitle}>
        <div className="col" style={{ gap: 4, flexGrow: 1, minWidth: 220 }}>
          <span className="eyebrow">{t.continueTitle}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {progress.last ? (lastNode ? projectLabel(lastNode, lang) : progress.last.id) : t.continueEmpty}
          </span>
        </div>
        {progress.last ? (
          <Link className="btn btn-primary" to={progress.last.route}>
            {t.continueBtn} <Icon name="arrow" />
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => open(REACT_ID, '/agents/lab/react/run')}>
            {t.startBtn} <Icon name="arrow" />
          </button>
        )}
      </section>

      <section className="col" style={{ gap: 8 }} aria-labelledby="path-h">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <h2 id="path-h" className="eyebrow" style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>{t.pathTitle}</h2>
          <Tip show={g.is('path')}>{t.tipPath}</Tip>
        </div>
        <div className="path">
          {PATH_ORDER.map((id, i) => {
            const node = root ? findNode(root, id) : null
            const name = node ? `${sectionNum(node)} ${shortTitle(node, lang)}` : id
            return (
              <span key={id} style={{ display: 'contents' }}>
                <button type="button" className={g.pulse('path')} onClick={() => g.done('path', t.explainPath(name, t.pathWhy[id] ?? ''))}>
                  {name}
                </button>
                {i < PATH_ORDER.length - 1 && <span aria-hidden="true" style={{ color: 'var(--faint)' }}>→</span>}
              </span>
            )
          })}
        </div>
      </section>

      {err && <p role="alert" style={{ color: 'var(--red)' }}>{t.loadError}</p>}
      {!root && !err && <p className="muted">{t.loading}</p>}

      <div className="map-grid">
        {sections.map((s) => {
          const projects = projectsOf(s)
          const total = projects.length || 1
          const done = projects.length ? projects.filter((p) => visited[p.id]).length : visited[s.id] ? 1 : 0
          const hl = s.id === '02-agentic-architectures' && g.is('react-row')
          const live = projects.filter((p) => labFor(p.id))
          const rows = (live.length ? [...live, ...projects.filter((p) => !labFor(p.id))] : projects).slice(0, 3)
          return (
            <article key={s.id} className={`map-card${hl ? ' hl' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>{sectionNum(s)}</span>
                <span className="muted" style={{ fontSize: 12 }}>{projects.length ? t.projects(projects.length) : t.guide}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{shortTitle(s, lang)}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{t.pathWhy[s.id] ?? ''}</p>
              <Progress pct={(done / total) * 100} label={shortTitle(s, lang)} />
              <div className="col" style={{ gap: 6, marginTop: 4 }}>
                {(rows.length ? rows : [s]).map((p) => {
                  const lab = labFor(p.id)
                  const man = runMan[p.id]
                  const target = p.id === REACT_ID && g.is('react-row')
                  const route = lab ? lab.route : man ? runnerRoute(p.id) : `/docs/${p.id}`
                  const badge = lab ? (lab.replay ? 'replay' : 'live') : man ? (man.browser === 'replay' ? 'replay' : 'live') : 'docs'
                  return (
                    <button key={p.id} type="button" className={`map-row${target ? ' target al-pulse' : ''}`} style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => open(p.id, route)}>
                      <span style={{ flexGrow: 1 }}>{p === s ? shortTitle(s, lang) : projectLabel(p, lang)}</span>
                      <span className={`badge ${badge === 'replay' ? 'badge-violet' : badge === 'live' ? 'badge-teal' : 'badge-gray'}`}>{badge === 'replay' ? t.replay : badge === 'live' ? t.live : t.docs}</span>
                    </button>
                  )
                })}
                {projects.length > 0 && (
                  <Link to={`/agents/section/${s.id}`} className="row" style={{ gap: 6, fontSize: 13, marginTop: 4 }}>
                    {t.openSection} <Icon name="arrow" size={14} />
                  </Link>
                )}
              </div>
            </article>
          )
        })}
        {root && (
          <article className="map-card" style={{ background: 'var(--panel-soft)' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>07+</span>
              <span className="muted" style={{ fontSize: 12 }}>{t.round2Sub}</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{t.round2}</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--ink-3)' }}>
              {t.round2Items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
        )}
      </div>
    </div>
  )
}
