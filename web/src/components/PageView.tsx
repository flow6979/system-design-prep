import { lld, pageBySlug, revisionBody, route, type Page } from '../content'
import { Markdown } from './Markdown'
import { Checklist } from './Checklist'
import { LangToggle, type CodeLang } from './CodeBlock'

const EYEBROW: Record<Page['kind'], (p: Page) => string> = {
  topic: () => 'Topic',
  question: (p) => `Question · Tier ${p.tier ?? 2}`,
  lld: () => 'LLD · Design patterns',
}

const REVISION_NOTE: Record<Page['kind'], string> = {
  question: 'Revision mode: sirf clarifying sawal, decision table aur 2-minute recap dikh rahe hain.',
  topic: 'Revision mode: sirf summary, interview lines aur common galtiyan dikh rahi hain.',
  lld: 'Sirf ⭐ wale (sabse zyada pooche jaane wale) patterns dikh rahe hain.',
}

/** `## ` headings of the visible body, for the jump list on LLD pages */
function sections(body: string): string[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
}

function jumpTo(title: string) {
  const el = [...document.querySelectorAll('.md h2')].find((h) => h.textContent?.trim() === title)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function PageView({
  page,
  revision,
  onToggleRevision,
  codeLang,
  onCodeLang,
}: {
  page: Page
  revision: boolean
  onToggleRevision: () => void
  codeLang: CodeLang
  onCodeLang: (l: CodeLang) => void
}) {
  const related = page.related.map((s) => pageBySlug.get(s)).filter((p): p is Page => !!p)
  const isLld = page.kind === 'lld'
  const body = revision ? revisionBody(page) : page.body

  return (
    <article className="page">
      {isLld && (
        <nav className="subtabs" aria-label="LLD sections">
          {lld.map((p) => (
            <a key={p.slug} href={route(p)} className={p.slug === page.slug ? 'on' : ''} aria-current={p.slug === page.slug ? 'page' : undefined}>
              {p.title.replace(/ (Patterns|Principles|Basics)$/, '')}
            </a>
          ))}
        </nav>
      )}
      <div className="page-meta">
        <span className="eyebrow">
          {EYEBROW[page.kind](page)} · {page.time} min
        </span>
        <div className="row wrap">
          {isLld && <LangToggle value={codeLang} onChange={onCodeLang} />}
          <label className="toggle">
            <input type="checkbox" checked={revision} onChange={onToggleRevision} />
            <span>{isLld ? 'Sirf ⭐ dikhao' : 'Revision mode'}</span>
          </label>
        </div>
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
      {revision && <p className="revision-note small">{REVISION_NOTE[page.kind]}</p>}
      {isLld && (
        <div className="jump row wrap">
          {sections(body).map((t) => (
            <button key={t} className={`chip ${t.startsWith('⭐') ? 'star' : ''}`} onClick={() => jumpTo(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <Markdown text={body} />
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
