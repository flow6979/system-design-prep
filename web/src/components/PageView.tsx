import { pageBySlug, revisionBody, route, type Page } from '../content'
import { Markdown } from './Markdown'
import { Checklist } from './Checklist'

export function PageView({ page, revision, onToggleRevision }: { page: Page; revision: boolean; onToggleRevision: () => void }) {
  const related = page.related.map((s) => pageBySlug.get(s)).filter((p): p is Page => !!p)

  return (
    <article className="page">
      <div className="page-meta">
        <span className="eyebrow">
          {page.kind === 'topic' ? 'Topic' : `Question · Tier ${page.tier ?? 2}`} · {page.time} min
        </span>
        <label className="toggle">
          <input type="checkbox" checked={revision} onChange={onToggleRevision} />
          <span>Revision mode</span>
        </label>
      </div>
      {page.patterns.length > 0 && (
        <div className="row wrap tags">
          {page.patterns.map((p) => (
            <span key={p} className="tag">
              {p}
            </span>
          ))}
          {page.askedAt.length > 0 && <span className="muted small">Asked at: {page.askedAt.join(', ')}</span>}
        </div>
      )}
      {revision && (
        <p className="revision-note small">
          Revision mode: sirf {page.kind === 'question' ? 'clarifying sawal, decision table aur 2-minute recap' : 'summary, interview lines aur common galtiyan'} dikh rahe
          hain.
        </p>
      )}
      <Markdown text={revision ? revisionBody(page) : page.body} />
      <Checklist page={page} />
      {related.length > 0 && (
        <section className="related">
          <h2>{page.kind === 'topic' ? 'Ye kin questions me lagta hai' : 'Pehle ye topics padh lo'}</h2>
          <div className="row wrap">
            {related.map((p) => (
              <a key={p.slug} href={route(p)} className="chip">
                {p.title.replace(/^Design (an? )?/, '')}
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
