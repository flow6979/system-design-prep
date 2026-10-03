import { href } from '../router'
import { useEffect, useState } from 'react'
import { agentPages, behavioral, cs, db, java, lld, lldProblems, localize, questions, route, topics, type Page } from '../content'
import { readLocal, useStore, writeLocal } from '../store'
import { useLang, useTr } from '../i18n'
import { groupStats, pageStats } from '../progress'
import { Icon, type IconName } from './Icon'

export const shortTitle = (title: string) => title.replace(/^Design (an? )?/, '')

interface Sub {
  label?: { hi: string; en: string }
  pages: Page[]
}
interface Section {
  id: string
  label: string
  icon: IconName
  subs: Sub[]
}

// Every subject appears once, in study order; sub-headings only where a subject has parts
const SECTIONS: Section[] = [
  {
    id: 'hld',
    label: 'HLD · System design',
    icon: 'hld',
    subs: [
      { label: { hi: 'Topics', en: 'Topics' }, pages: topics },
      { label: { hi: 'Problems · Tier 1', en: 'Problems · Tier 1' }, pages: questions.filter((q) => q.tier === 1) },
      { label: { hi: 'Problems · Tier 2', en: 'Problems · Tier 2' }, pages: questions.filter((q) => q.tier !== 1) },
    ],
  },
  {
    id: 'lld',
    label: 'LLD',
    icon: 'code',
    subs: [
      { label: { hi: 'Design patterns', en: 'Design patterns' }, pages: lld },
      { label: { hi: 'Problems', en: 'Problems' }, pages: lldProblems },
    ],
  },
  { id: 'java', label: 'Java', icon: 'cup', subs: [{ pages: java }] },
  { id: 'db', label: 'Databases', icon: 'db', subs: [{ pages: db }] },
  {
    id: 'cs',
    label: 'CS fundamentals',
    icon: 'chip',
    subs: [
      { label: { hi: 'Networking', en: 'Networking' }, pages: cs.filter((p) => p.order <= 5) },
      { label: { hi: 'Operating systems', en: 'Operating systems' }, pages: cs.filter((p) => p.order > 5) },
    ],
  },
  { id: 'beh', label: 'Behavioral', icon: 'chat', subs: [{ pages: behavioral }] },
  { id: 'agents', label: 'Agentic AI', icon: 'bot', subs: [{ pages: agentPages }] },
]

function Item({ page, active }: { page: Page; active: boolean }) {
  const { progress } = useStore()
  const { lang } = useLang()
  const s = pageStats(page, progress)
  return (
    <a href={route(page)} className={`side-item ${active ? 'active' : ''} ${s.complete ? 'done' : ''}`} aria-current={active ? 'page' : undefined}>
      <span className="side-title">{shortTitle(localize(page, lang).title)}</span>
      {/* Count only once started, so untouched pages stay quiet */}
      {s.complete ? <span className="side-count mono">✓</span> : s.done > 0 ? <span className="side-count mono">{`${s.done}/${s.total}`}</span> : null}
    </a>
  )
}

/** A labelled part of a section; only the part holding the current page starts open */
function SubGroup({ sub, sectionId, current, filtering, single }: { sub: Sub; sectionId: string; current: string; filtering: boolean; single: boolean }) {
  const { lang } = useLang()
  const key = `hld.side2.${sectionId}.${sub.label?.en ?? ''}`
  const hasCurrent = sub.pages.some((p) => p.slug === current)
  const [userOpen, setUserOpen] = useState<boolean>(() => hasCurrent || readLocal(key, false))
  // Opening a page reveals its group once; after that the reader can still collapse it
  useEffect(() => {
    if (hasCurrent) setUserOpen(true)
  }, [current, hasCurrent])
  const open = single || !sub.label || filtering || userOpen
  return (
    <div className="side-sub">
      {sub.label && (
        <button
          className="side-sub-label"
          aria-expanded={open}
          onClick={() => {
            setUserOpen(!open)
            writeLocal(key, !open)
          }}
        >
          <span>{sub.label[lang]}</span>
          <span className="mono">
            {sub.pages.length} {open ? '▾' : '▸'}
          </span>
        </button>
      )}
      {open && sub.pages.map((p) => <Item key={p.slug} page={p} active={current === p.slug} />)}
    </div>
  )
}

function SectionGroup({ section, current, match, filtering }: { section: Section; current: string; match: (p: Page) => boolean; filtering: boolean }) {
  const { progress } = useStore()
  const all = section.subs.flatMap((s) => s.pages)
  const key = `hld.side2.${section.id}`
  const hasCurrent = all.some((p) => p.slug === current) || (section.id === 'agents' && current.startsWith('agents'))
  const [closed, setClosed] = useState<boolean>(() => !hasCurrent && readLocal(key, true))
  useEffect(() => {
    if (hasCurrent) setClosed(false)
  }, [current, hasCurrent])
  const shown = section.subs.map((s) => ({ ...s, pages: s.pages.filter(match) })).filter((s) => s.pages.length)
  if (!all.length || (filtering && !shown.length)) return null
  const open = filtering || !closed
  const st = groupStats(all, progress)
  return (
    <div className={`side-section ${hasCurrent ? 'current' : ''}`}>
      <button
        className="side-section-head"
        aria-expanded={open}
        onClick={() => {
          setClosed(open)
          writeLocal(key, open)
        }}
      >
        <Icon name={section.icon} size={17} />
        <span className="side-section-label">{section.label}</span>
        <span className="side-section-count mono">{st.complete ? `${st.complete}/${st.pages}` : st.pages}</span>
        <span className="caret" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <div className="side-section-body">
          {shown.map((sub, i) => (
            <SubGroup key={i} sub={sub} sectionId={section.id} current={current} filtering={filtering} single={shown.length === 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ current, onNavigate }: { current: string; onNavigate: () => void }) {
  const { lang } = useLang()
  const tr = useTr()
  const [filter, setFilter] = useState('')
  const f = filter.trim().toLowerCase()
  const match = (p: Page) =>
    !f ||
    p.title.toLowerCase().includes(f) ||
    localize(p, lang).title.toLowerCase().includes(f) ||
    p.patterns.some((x) => x.toLowerCase().includes(f))

  return (
    <nav className="sidebar" onClick={(e) => (e.target as HTMLElement).closest('a') && onNavigate()}>
      <a href={href('')} className={`side-item home ${current === '' ? 'active' : ''}`}>
        <Icon name="home" size={17} />
        Dashboard
      </a>
      <a href={href('plan')} className={`side-item home ${current === 'plan' ? 'active' : ''}`}>
        <Icon name="plan" size={17} />
        {tr('Mera plan', 'My plan')}
      </a>
      <a href={href('quiz')} className={`side-item home ${current === 'quiz' ? 'active' : ''}`}>
        <Icon name="quiz" size={17} />
        Quiz
      </a>
      <input
        id="side-filter"
        className="side-filter"
        placeholder={tr('Dhoondho: cache, Uber, Kafka…', 'Search: cache, Uber, Kafka…')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label={tr('Pages dhoondho', 'Search pages')}
      />
      {SECTIONS.map((s) => (
        <SectionGroup key={s.id} section={s} current={current} match={match} filtering={!!f} />
      ))}
    </nav>
  )
}
