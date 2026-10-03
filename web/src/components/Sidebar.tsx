import { useState } from 'react'
import { agentPages, db, java, lld, localize, questions, route, topics, type Page } from '../content'
import { readLocal, useStore, writeLocal } from '../store'
import { useLang, useTr } from '../i18n'
import { groupStats, pageStats } from '../progress'
import { Icon } from './Icon'

export const shortTitle = (title: string) => title.replace(/^Design (an? )?/, '')

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

function Group({ label, pages, current, match, filtering }: { label: string; pages: Page[]; current: string; match: (p: Page) => boolean; filtering: boolean }) {
  const { progress } = useStore()
  const key = `hld.side.${label}`
  // Groups start collapsed so the sidebar stays short; the open state is remembered
  const [closed, setClosed] = useState<boolean>(() => readLocal(key, true))
  const s = groupStats(pages, progress)
  const shown = pages.filter(match)
  if (!shown.length) return null
  // Searching or standing on a page inside the group always shows it
  const open = filtering || !closed || pages.some((p) => p.slug === current)
  return (
    <div className="side-group">
      <button
        className="side-label"
        aria-expanded={open}
        onClick={() => {
          setClosed(open)
          writeLocal(key, open)
        }}
      >
        <span className="caret" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span>{label}</span>
        <span className="mono">
          {s.complete}/{s.pages}
        </span>
      </button>
      {open && shown.map((p) => <Item key={p.slug} page={p} active={current === p.slug} />)}
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
      <a href="#/" className={`side-item home ${current === '' ? 'active' : ''}`}>
        <Icon name="home" size={17} />
        Dashboard
      </a>
      <a href="#/plan" className={`side-item home ${current === 'plan' ? 'active' : ''}`}>
        <Icon name="plan" size={17} />
        {tr('Mera plan', 'My plan')}
      </a>
      <a href="#/quiz" className={`side-item home ${current === 'quiz' ? 'active' : ''}`}>
        <Icon name="quiz" size={17} />
        Quiz
      </a>
      {lld[0] && (
        <a href={route(lld[0])} className={`side-item home ${lld.some((p) => p.slug === current) ? 'active' : ''}`}>
          <Icon name="code" size={17} />
          LLD · Design patterns
        </a>
      )}
      {java[0] && (
        <a href={route(java[0])} className={`side-item home ${java.some((p) => p.slug === current) ? 'active' : ''}`}>
          <Icon name="cup" size={17} />
          Java
        </a>
      )}
      {db[0] && (
        <a href={route(db[0])} className={`side-item home ${db.some((p) => p.slug === current) ? 'active' : ''}`}>
          <Icon name="db" size={17} />
          Databases
        </a>
      )}
      <a href="#/agents" className={`side-item home ${current.startsWith('agents') ? 'active' : ''}`}>
        <Icon name="bot" size={17} />
        Agentic AI
      </a>
      <input
        id="side-filter"
        className="side-filter"
        placeholder={tr('Dhoondho: cache, Uber, Kafka…', 'Search: cache, Uber, Kafka…')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label={tr('Topics aur questions filter karo', 'Filter topics and questions')}
      />
      <Group label="Topics" pages={topics} current={current} match={match} filtering={!!f} />
      <Group label="Questions · Tier 1" pages={questions.filter((q) => q.tier === 1)} current={current} match={match} filtering={!!f} />
      <Group label="LLD · Design patterns" pages={lld} current={current} match={match} filtering={!!f} />
      <Group label="Databases" pages={db} current={current} match={match} filtering={!!f} />
      <Group label="Java" pages={java} current={current} match={match} filtering={!!f} />
      <Group label="Questions · Tier 2" pages={questions.filter((q) => q.tier !== 1)} current={current} match={match} filtering={!!f} />
      <Group label="Agentic AI" pages={agentPages} current={current} match={match} filtering={!!f} />
    </nav>
  )
}
