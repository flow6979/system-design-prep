// Section page (/section/:sectionId): us section ke saare projects, handbook tree se.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon, Seg } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT } from '../i18n'
import { sectionDict } from '../i18n/pages/section'
import { docFile, findNode, loadTree, type DocNode } from '../lib/handbook'
import { labFor } from '../lib/labRoutes'
import { runnerRoute } from '../lib/projects'
import { useProjects } from '../lib/useProjects'
import { getProgress, markVisited } from '../lib/progress'
import { firstParagraph, projectLabel, projectsOf, sectionNum, shortTitle } from '../lib/sections'
import { useApp } from '../state/app'
import '../styles/pages/map.css'

const ARCH = '02-agentic-architectures'
const WORKFLOWS = ['01', '02', '03', '07', '08']
const family = (name: string) => (name.startsWith('00') ? 'Concept' : WORKFLOWS.includes(name.slice(0, 2)) ? 'Workflow' : 'Agent')

export default function Section() {
  const { sectionId = '' } = useParams()
  const t = useT(sectionDict)
  const { lang } = useApp()
  const navigate = useNavigate()
  const runMan = useProjects()
  const isArch = sectionId === ARCH
  const g = useGuide(`section-${sectionId}`, isArch ? ['helper', 'learn'] : ['learn'])
  const [root, setRoot] = useState<DocNode | null>(null)
  const [descs, setDescs] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'Workflow' | 'Agent'>('all')
  const [a1, setA1] = useState<boolean | null>(null)
  const [rec, setRec] = useState<string | null>(null)
  const visited = getProgress().visited

  useEffect(() => {
    loadTree().then(setRoot).catch(() => setRoot(null))
  }, [])

  const section = root ? findNode(root, sectionId) : null
  const projects = section ? projectsOf(section) : []

  useEffect(() => {
    let live = true
    setDescs({})
    for (const p of projects) {
      const f = docFile(p, 'CONCEPTS', lang) ?? docFile(p, 'README', lang) ?? `${p.id}/${lang === 'en' ? 'CONCEPTS.en.md' : 'CONCEPTS.md'}`
      firstParagraph(f).then((d) => live && d && setDescs((prev) => ({ ...prev, [p.id]: d })))
    }
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id, lang])

  if (root && !section)
    return (
      <div id="main" className="page col">
        <p>{t.notFound}</p>
        <Link to="/agents/map" className="btn" style={{ alignSelf: 'flex-start' }}>{t.back}</Link>
      </div>
    )
  if (!section) return <div id="main" className="page muted">{t.loading}</div>

  const answer = (q: 1 | 2, yes: boolean) => {
    if (q === 1) return setA1(yes)
    const id = a1 ? (yes ? '03-parallelization' : '01-prompt-chaining') : yes ? '04-react' : '05-plan-and-execute'
    setRec(id)
    const node = projects.find((p) => p.name === id)
    g.done('helper', t.explainHelper(node ? projectLabel(node, lang) : id, t.why[id]))
  }

  const openDocs = (p: DocNode) => {
    markVisited(p.id, `/docs/${p.id}`)
    g.done('learn', t.explainLearn)
    navigate(`/agents/docs/${p.id}`)
  }

  const shown = projects.filter((p) => filter === 'all' || family(p.name) === filter)

  return (
    <div id="main" className="page col" style={{ gap: 18 }}>
      <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
        <Link to="/agents/map" className="btn btn-sm">{t.back}</Link>
        <span className="mono" style={{ color: 'var(--amber)' }}>{sectionNum(section)}</span>
        <h1 className="h1" style={{ fontSize: 30 }}>{shortTitle(section, lang)}</h1>
        <span className="muted" style={{ fontSize: 13 }}>{t.projects(projects.length)}</span>
        <div style={{ flexGrow: 1 }} />
        {section.docs.README && <Link to={`/agents/docs/${section.id}?doc=README`} className="row" style={{ gap: 6, fontSize: 14 }}><Icon name="doc" size={16} /> {t.readSection}</Link>}
      </div>

      <div className={isArch ? 'section-layout' : ''}>
        {isArch && (
          <aside className="col" style={{ gap: 16 }}>
            <section className="panel col" style={{ gap: 10 }}>
              <h2 className="h2" style={{ fontSize: 17 }}>{t.spectrumTitle}</h2>
              <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex' }} aria-hidden="true">
                <div style={{ flexGrow: 1, background: 'var(--amber-soft)' }} />
                <div style={{ flexGrow: 1, background: 'var(--teal-soft)' }} />
              </div>
              <div className="row" style={{ justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
                <span style={{ color: 'var(--amber-dark)' }}>{t.spectrumLeft}</span>
                <span style={{ color: 'var(--teal-dark)', textAlign: 'right' }}>{t.spectrumRight}</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{t.spectrumNote}</p>
            </section>
            <section className={`panel col ${g.pulse('helper')}`} style={{ gap: 10 }} aria-labelledby="helper-h">
              <h2 id="helper-h" className="h2" style={{ fontSize: 17 }}>{t.helperTitle}</h2>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.helperSub}</p>
              <Tip show={g.is('helper')}>{t.tipHelper}</Tip>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>1. {t.q1}</p>
              <div className="row helper-q" style={{ gap: 8 }}>
                <button type="button" className="btn btn-sm" aria-pressed={a1 === true} onClick={() => answer(1, true)} style={a1 === true ? { borderColor: 'var(--teal)', background: 'var(--teal-bg)' } : undefined}>{t.yes}</button>
                <button type="button" className="btn btn-sm" aria-pressed={a1 === false} onClick={() => answer(1, false)} style={a1 === false ? { borderColor: 'var(--teal)', background: 'var(--teal-bg)' } : undefined}>{t.no}</button>
              </div>
              {a1 !== null && (
                <>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>2. {a1 ? t.q2yes : t.q2no}</p>
                  <div className="row helper-q" style={{ gap: 8 }}>
                    <button type="button" className="btn btn-sm" onClick={() => answer(2, true)}>{t.yes}</button>
                    <button type="button" className="btn btn-sm" onClick={() => answer(2, false)}>{t.no}</button>
                  </div>
                </>
              )}
              {rec && (
                <div aria-live="polite" style={{ padding: 12, borderRadius: 10, background: 'var(--teal-bg)', border: '1px solid var(--teal)', fontSize: 14 }}>
                  <span className="eyebrow">{t.recommend}</span>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{rec}</div>
                </div>
              )}
              {(a1 !== null || rec) && (
                <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setA1(null); setRec(null) }}>{t.restart}</button>
              )}
            </section>
          </aside>
        )}

        <section className="panel col" style={{ gap: 6, padding: 12 }}>
          {isArch && (
            <div style={{ padding: '4px 4px 10px' }}>
              <Seg label="Filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: t.filterAll }, { value: 'Workflow', label: t.filterWorkflow }, { value: 'Agent', label: t.filterAgent }]} />
            </div>
          )}
          <Tip show={g.is('learn')}>{t.tipLearn}</Tip>
          {shown.map((p) => {
            const lab = labFor(p.id)
            const runnable = !!runMan[p.id]
            const replayOnly = runMan[p.id]?.browser === 'replay'
            const fam = family(p.name)
            return (
              <div key={p.id} className={`proj-row${rec === p.name ? ' rec' : ''}`}>
                <div className="col" style={{ gap: 4, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{projectLabel(p, lang)}</span>
                    {isArch && <span className={`badge ${fam === 'Agent' ? 'badge-teal' : fam === 'Workflow' ? 'badge-amber' : 'badge-gray'}`}>{t.family[fam]}</span>}
                    <span className={`badge ${runnable ? (replayOnly ? 'badge-violet' : 'badge-teal') : 'badge-gray'}`}>{runnable ? (replayOnly ? t.replay : t.live) : t.docs}</span>
                    {visited[p.id] && <span className="muted" style={{ fontSize: 12 }}>· {t.visited}</span>}
                  </div>
                  <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{descs[p.id] ?? ' '}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', wordBreak: 'break-all' }}>{p.id}</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className={`btn btn-sm ${g.pulse('learn')}`} onClick={() => openDocs(p)}>
                    <Icon name="doc" size={14} /> {t.learn}
                  </button>
                  {lab && (
                    <Link to={lab.route} className="btn btn-sm btn-outline" onClick={() => markVisited(p.id, lab.route)} title={lab.route}>
                      <Icon name="play" size={12} /> Lab
                    </Link>
                  )}
                  {runnable && (
                    <Link to={runnerRoute(p.id)} className="btn btn-sm btn-primary" title={`${p.id}/main.py`}>
                      <Icon name="play" size={12} /> {t.run}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
