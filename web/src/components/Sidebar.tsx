import { useState } from 'react'
import { agentPages, lld, localize, questions, route, topics, type Page } from '../content'
import { useStore } from '../store'
import { useLang, useTr } from '../i18n'
import { groupStats, pageStats } from '../progress'

export const shortTitle = (title: string) => title.replace(/^Design (an? )?/, '')

function Item({ page, active }: { page: Page; active: boolean }) {
  const { progress } = useStore()
  const { lang } = useLang()
  const s = pageStats(page, progress)
  return (
    <a href={route(page)} className={`side-item ${active ? 'active' : ''} ${s.complete ? 'done' : ''}`} aria-current={active ? 'page' : undefined}>
      <span className="side-title">{shortTitle(localize(page, lang).title)}</span>
      <span className="side-count mono">{s.complete ? '✓' : `${s.done}/${s.total}`}</span>
    </a>
  )
}

function Group({ label, pages, current, match }: { label: string; pages: Page[]; current: string; match: (p: Page) => boolean }) {
  const { progress } = useStore()
  const s = groupStats(pages, progress)
  const shown = pages.filter(match)
  if (!shown.length) return null
  return (
    <div className="side-group">
      <div className="side-label">
        <span>{label}</span>
        <span className="mono">
          {s.complete}/{s.pages}
        </span>
      </div>
      {shown.map((p) => (
        <Item key={p.slug} page={p} active={current === p.slug} />
      ))}
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
        Dashboard
      </a>
      <a href="#/quiz" className={`side-item home ${current === 'quiz' ? 'active' : ''}`}>
        Pattern quiz
      </a>
      {lld[0] && (
        <a href={route(lld[0])} className={`side-item home ${lld.some((p) => p.slug === current) ? 'active' : ''}`}>
          LLD · Design patterns
        </a>
      )}
      <a href="#/agents" className={`side-item home ${current.startsWith('agents') ? 'active' : ''}`}>
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
      <Group label="Topics" pages={topics} current={current} match={match} />
      <Group label="Questions · Tier 1" pages={questions.filter((q) => q.tier === 1)} current={current} match={match} />
      <Group label="LLD · Design patterns" pages={lld} current={current} match={match} />
      <Group label="Questions · Tier 2" pages={questions.filter((q) => q.tier !== 1)} current={current} match={match} />
      <Group label="Agentic AI" pages={agentPages} current={current} match={match} />
      {!f && (
        <div className="side-group">
          <a href="#/agents/docs" className="side-item">
            {tr('Agentic AI docs', 'Agentic AI docs')}
          </a>
          <a href="#/agents/history" className="side-item">
            {tr('Lab history', 'Lab history')}
          </a>
          <a href="#/agents/presenter" className="side-item">
            Presenter
          </a>
        </div>
      )}
    </nav>
  )
}
