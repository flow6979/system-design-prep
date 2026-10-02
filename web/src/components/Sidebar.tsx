import { useState } from 'react'
import { lld, questions, route, topics, type Page } from '../content'
import { useStore } from '../store'
import { groupStats, pageStats } from '../progress'

function Item({ page, active }: { page: Page; active: boolean }) {
  const { progress } = useStore()
  const s = pageStats(page, progress)
  return (
    <a href={route(page)} className={`side-item ${active ? 'active' : ''} ${s.complete ? 'done' : ''}`} aria-current={active ? 'page' : undefined}>
      <span className="side-title">{page.title.replace(/^Design (an? )?/, '')}</span>
      <span className="side-count mono">{s.complete ? '✓' : `${s.done}/${s.total}`}</span>
    </a>
  )
}

export function Sidebar({ current, onNavigate }: { current: string; onNavigate: () => void }) {
  const { progress } = useStore()
  const [filter, setFilter] = useState('')
  const f = filter.trim().toLowerCase()
  const match = (p: Page) => !f || p.title.toLowerCase().includes(f) || p.patterns.some((x) => x.toLowerCase().includes(f))
  const t = groupStats(topics, progress)
  const q1 = questions.filter((q) => q.tier === 1)
  const q2 = questions.filter((q) => q.tier !== 1)
  const qs1 = groupStats(q1, progress)
  const qs2 = groupStats(q2, progress)
  const ls = groupStats(lld, progress)

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
      <input
        id="side-filter"
        className="side-filter"
        placeholder="Dhoondho: cache, Uber, Kafka…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Topics aur questions filter karo"
      />
      <div className="side-group">
        <div className="side-label">
          <span>Topics</span>
          <span className="mono">
            {t.complete}/{t.pages}
          </span>
        </div>
        {topics.filter(match).map((p) => (
          <Item key={p.slug} page={p} active={current === p.slug} />
        ))}
      </div>
      <div className="side-group">
        <div className="side-label">
          <span>Questions · Tier 1</span>
          <span className="mono">
            {qs1.complete}/{qs1.pages}
          </span>
        </div>
        {q1.filter(match).map((p) => (
          <Item key={p.slug} page={p} active={current === p.slug} />
        ))}
      </div>
      {lld.length > 0 && (
        <div className="side-group">
          <div className="side-label">
            <span>LLD · Design patterns</span>
            <span className="mono">
              {ls.complete}/{ls.pages}
            </span>
          </div>
          {lld.filter(match).map((p) => (
            <Item key={p.slug} page={p} active={current === p.slug} />
          ))}
        </div>
      )}
      <div className="side-group">
        <div className="side-label">
          <span>Questions · Tier 2</span>
          <span className="mono">
            {qs2.complete}/{qs2.pages}
          </span>
        </div>
        {q2.filter(match).map((p) => (
          <Item key={p.slug} page={p} active={current === p.slug} />
        ))}
      </div>
    </nav>
  )
}
