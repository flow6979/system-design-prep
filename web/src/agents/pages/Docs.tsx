// Docs reader (/docs/<node id>?doc=README|CONCEPTS|TESTING): handbook ki koi bhi md file, dono languages mein.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Markdown } from '../components/Markdown'
import { Icon, Seg } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT, type Lang } from '../i18n'
import { githubFile } from '../i18n/common'
import { docsDict } from '../i18n/pages/docs'
import { fetchRaw, findNode, loadTree, type DocBase, type DocNode, docLabel, prettyFile } from '../lib/handbook'
import { labFor } from '../lib/labRoutes'
import { runnerRoute } from '../lib/projects'
import { useProjects } from '../lib/useProjects'
import { markVisited } from '../lib/progress'
import { humanName, projectLabel, projectsOf, sectionNum, shortTitle } from '../lib/sections'
import { useApp } from '../state/app'
import '../styles/pages/map.css'

const BASES: DocBase[] = ['README', 'CONCEPTS', 'TESTING']

/** Bundler non-numbered folders (e.g. support-desk) ko tree mein nahi daalta; unke liye guess karo. */
function syntheticNode(id: string): DocNode {
  const guess = (b: DocBase) => ({ hi: `${id}/${b}.md`, en: `${id}/${b}.en.md` })
  return { id, name: id.split('/').pop() || id, title: { hi: null, en: null }, docs: { CONCEPTS: guess('CONCEPTS'), TESTING: guess('TESTING') }, files: [], children: [] }
}

function ancestors(id: string): string[] {
  const parts = id.split('/')
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'))
}

export default function Docs() {
  const t = useT(docsDict)
  const app = useApp()
  const navigate = useNavigate()
  const params = useParams()
  const [search] = useSearchParams()
  const id = (params['*'] || '').replace(/\/$/, '') || '.'
  const g = useGuide('docs', ['lang', 'tab'])
  const [root, setRoot] = useState<DocNode | null>(null)
  const [open, setOpen] = useState<Set<string>>(() => new Set(ancestors(id)))
  const [doc, setDoc] = useState<{ file: string; text: string; fellBack: boolean } | null>(null)
  const [missing, setMissing] = useState(false)
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTree().then(setRoot).catch(() => undefined)
  }, [])
  useEffect(() => {
    setOpen((prev) => new Set([...prev, ...ancestors(id)]))
    if (id !== '.') markVisited(id, `/docs/${id}`)
  }, [id])

  const node = useMemo(() => (root ? findNode(root, id) ?? (id !== '.' ? syntheticNode(id) : null) : null), [root, id])
  const available = node ? BASES.filter((b) => node.docs[b]) : []
  const wanted = (search.get('doc') as DocBase) || (node?.docs.README ? 'README' : 'CONCEPTS')
  const base: DocBase = available.includes(wanted) ? wanted : available[0] ?? 'README'

  useEffect(() => {
    if (!node) return
    const d = node.docs[base]
    if (!d) {
      setMissing(true)
      setDoc(null)
      return
    }
    let live = true
    setMissing(false)
    const other: Lang = app.lang === 'hi' ? 'en' : 'hi'
    const first = d[app.lang]
    const load = (file: string | null, fellBack: boolean): Promise<void> =>
      file ? fetchRaw(file).then((text) => { if (live) setDoc({ file, text, fellBack }) }) : Promise.reject(new Error('none'))
    load(first, false)
      .catch(() => load(d[other], true))
      .catch(() => live && (setDoc(null), setMissing(true)))
    return () => {
      live = false
    }
  }, [node, base, app.lang])

  // Headings ko ids do aur TOC banao (Markdown render hone ke baad).
  useEffect(() => {
    const el = bodyRef.current
    if (!el || !doc) return setToc([])
    const seen = new Map<string, number>()
    const items: { id: string; text: string; level: number }[] = []
    el.querySelectorAll('h2, h3').forEach((h) => {
      const text = h.textContent || ''
      let slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'
      const n = seen.get(slug) ?? 0
      seen.set(slug, n + 1)
      if (n) slug = `${slug}-${n}`
      h.id = slug
      items.push({ id: slug, text, level: h.tagName === 'H3' ? 3 : 2 })
    })
    setToc(items)
  }, [doc])

  const setLang = (l: Lang) => {
    app.setLang(l)
    const d = node?.docs[base]
    g.done('lang', t.explainLang((d && d[l]) || ''))
  }
  const setBase = (b: DocBase) => {
    navigate(`/agents/docs/${id === '.' ? '' : id}?doc=${b}`)
    if (b === 'TESTING') g.done('tab', t.explainTab(node?.docs.TESTING?.[app.lang] ?? ''))
  }

  const runMan = useProjects()
  const lab = labFor(id) ?? (runMan[id] ? { route: runnerRoute(id) } : null)
  const title = !node ? '' : id === '.' ? t.root : node.children.length || node.id.split('/').length === 1 ? `${sectionNum(node)} ${shortTitle(node, app.lang)}` : node.title[app.lang] || node.title.en ? projectLabel(node, app.lang) : humanName(node.name)
  const d = node?.docs[base]

  return (
    <div id="main" className="page docs-layout">
      <nav className="panel docs-tree" aria-label={t.tree}>
        <div className="eyebrow" style={{ padding: '4px 8px 8px' }}>{t.tree}</div>
        <Link to="/agents/docs" className={`tree-btn${id === '.' ? ' on' : ''}`} aria-current={id === '.' ? 'page' : undefined}>
          <span className="tree-num">/</span>
          <span>Overview</span>
        </Link>
        {root?.children.filter((s) => Object.keys(s.docs).length || s.children.length).map((s) => <TreeNode key={s.id} node={s} current={id} open={open} setOpen={setOpen} depth={0} />)}
      </nav>

      <section className="col" style={{ gap: 14, minWidth: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className="col" style={{ gap: 4, minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>{title}</h1>
            <span className="mono" style={{ fontSize: 13, color: 'var(--teal)', wordBreak: 'break-all' }}>{doc?.file ? prettyFile(doc.file) : ''}</span>
          </div>
          <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
            <span className="label" style={{ fontSize: 12 }}>{t.langLabel}</span>
            <div role="group" aria-label={t.langLabel} className={`row ${g.pulse('lang')}`} style={{ gap: 8, borderRadius: 12 }}>
              {(['hi', 'en'] as Lang[]).map((l) => (
                <button key={l} type="button" className="lang-opt" aria-pressed={app.lang === l} onClick={() => setLang(l)}>
                  <span style={{ fontWeight: 700 }}>{l === 'hi' ? 'Hinglish' : 'English'}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{l === 'en' ? 'Plain English' : 'Hindi + English mix'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Tip show={g.is('lang')} align="end">{t.tipLang}</Tip>
        {available.length > 1 && (
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Seg label="Doc files" value={base} onChange={setBase} className={g.pulse('tab')} options={available.map((b) => ({ value: b, label: docLabel(b, app.lang) }))} />
            <Tip show={g.is('tab') && available.includes('TESTING')}>{t.tipTab}</Tip>
          </div>
        )}
        {doc?.fellBack && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{t.fallback(app.lang === 'hi' ? 'English' : 'Hinglish')}</p>}
        <article className="panel" style={{ padding: '24px 32px' }} ref={bodyRef}>
          {doc ? <Markdown source={doc.text} file={doc.file} /> : <p className="muted">{missing ? t.missing : t.loading}</p>}
        </article>
      </section>

      <aside className="docs-rail">
        {toc.length > 0 && (
          <nav className="panel toc" aria-label={t.onPage} style={{ padding: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{t.onPage}</div>
            {toc.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={h.level === 3 ? 'h3' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        )}
        {d && (
          <a className="btn btn-sm" href={githubFile(doc?.file ?? d.hi ?? d.en ?? '')} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={14} /> {t.github}
          </a>
        )}
        {lab && (
          <Link className="btn btn-sm btn-primary" to={lab.route}>
            <Icon name="play" size={12} /> {t.run}
          </Link>
        )}
      </aside>
    </div>
  )
}

function TreeNode({ node, current, open, setOpen, depth }: { node: DocNode; current: string; open: Set<string>; setOpen: (f: (s: Set<string>) => Set<string>) => void; depth: number }) {
  const { lang } = useApp()
  const kids = projectsOf(node)
  const isOpen = open.has(node.id)
  const on = current === node.id
  const label = depth === 0 ? shortTitle(node, lang) : node.title.hi || node.title.en ? projectLabel(node, lang) : humanName(node.name)
  const num = depth === 0 ? sectionNum(node) : /^\d\d/.exec(node.name)?.[0] ?? '·'
  const hasDocs = Object.keys(node.docs).length > 0 || node.id.includes('/')
  return (
    <div>
      <div className="row" style={{ gap: 2, paddingLeft: depth * 12 }}>
        {kids.length > 0 ? (
          <button type="button" className="tree-btn" style={{ width: 28, padding: 0, justifyContent: 'center', flexShrink: 0 }} aria-expanded={isOpen} aria-label={label} onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(node.id)) n.delete(node.id); else n.add(node.id); return n })}>
            <span aria-hidden="true" style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--muted)' }}>›</span>
          </button>
        ) : (
          <span style={{ width: 28, flexShrink: 0 }} />
        )}
        {hasDocs ? (
          <Link to={`/agents/docs/${node.id}`} className={`tree-btn${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined}>
            <span className="tree-num">{num}</span>
            <span>{label}</span>
          </Link>
        ) : (
          <span className="tree-btn" style={{ cursor: 'default' }}>
            <span className="tree-num">{num}</span>
            <span>{label}</span>
          </span>
        )}
      </div>
      {isOpen && kids.map((c) => <TreeNode key={c.id} node={c} current={current} open={open} setOpen={setOpen} depth={depth + 1} />)}
    </div>
  )
}
