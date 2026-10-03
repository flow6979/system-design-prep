import { allPages, behavioral, cs, db, java, lld, lldProblems, localize, pageBySlug, revisionBody, route, type Page } from '../content'
import { useLang, useTr } from '../i18n'
import { Markdown } from './Markdown'
import { Checklist } from './Checklist'
import { LangToggle, type CodeLang } from './CodeBlock'
import { shortTitle } from './Sidebar'

/** `## ` headings of the visible body, for the jump list on LLD pages */
function sections(body: string): string[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
}

function jumpTo(title: string) {
  const el = [...document.querySelectorAll('.md h2')].find((h) => h.textContent?.trim() === title)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function PageView({
  page: source,
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
  const { lang } = useLang()
  const tr = useTr()
  const page = localize(source, lang)
  const related = page.related.map((s) => pageBySlug.get(s)).filter((p): p is Page => !!p)
  const isLld = page.kind === 'lld'
  // LLD and Java are multi-page sections shown with sub-tabs, a star filter and a jump list
  const TABS: Partial<Record<Page['kind'], Page[]>> = { lld, lldp: lldProblems, java, db, cs, beh: behavioral }
  const tabs = TABS[page.kind] ?? []
  const tabbed = tabs.length > 0
  // ⭐ filter for star-based sections; problems keep the regular revision mode
  const starFilter = tabbed && page.kind !== 'lldp'
  const body = revision ? revisionBody(page) : page.body

  const eyebrow = { topic: 'Topic', question: `HLD problem · Tier ${page.tier ?? 2}`, lld: 'LLD · Design patterns', lldp: 'LLD problem', java: 'Java', db: 'Databases', cs: 'CS fundamentals', beh: 'Behavioral', agent: 'Agentic AI' }[page.kind]
  const revisionNote = {
    question: tr(
      'Revision mode: sirf clarifying sawal, decision table aur 2-minute recap dikh rahe hain.',
      'Revision mode: showing only clarifying questions, the decision table and the 2-minute recap.',
    ),
    topic: tr(
      'Revision mode: sirf summary, interview lines aur common galtiyan dikh rahi hain.',
      'Revision mode: showing only the summary, interview lines and common mistakes.',
    ),
    lld: tr('Sirf ⭐ wale (sabse zyada pooche jaane wale) patterns dikh rahe hain.', 'Showing only ⭐ patterns (the most asked ones).'),
    java: tr('Sirf ⭐ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ⭐ sections (the most asked ones).'),
    db: tr('Sirf ⭐ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ⭐ sections (the most asked ones).'),
    cs: tr('Sirf ⭐ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ⭐ sections (the most asked ones).'),
    beh: tr('Sirf ⭐ wale (must-prepare) sections dikh rahe hain.', 'Showing only ⭐ sections (must-prepare).'),
    lldp: tr('Revision mode: sirf requirements, patterns aur 2-minute recap dikh rahe hain.', 'Revision mode: showing only requirements, patterns and the 2-minute recap.'),
    agent: '',
  }[page.kind]

  return (
    <article className="page">
      {tabbed && (
        <nav className="subtabs" aria-label="Sections">
          {tabs.map((p) => (
            <a key={p.slug} href={route(p)} className={p.slug === page.slug ? 'on' : ''} aria-current={p.slug === page.slug ? 'page' : undefined}>
              {localize(p, lang).title.replace(/ (Patterns|Principles|Basics)$/, '').replace(/:.*$/, '')}
            </a>
          ))}
        </nav>
      )}
      <div className="page-meta">
        <span className="eyebrow">
          {eyebrow} · {page.time} min
        </span>
        <div className="row wrap">
          {isLld && <LangToggle value={codeLang} onChange={onCodeLang} />}
          <button
            type="button"
            className={`revise-btn ${revision ? 'on' : ''}`}
            aria-pressed={revision}
            onClick={onToggleRevision}
            title={starFilter ? tr('Sirf ⭐ wale points dikhao', 'Show only ⭐ points') : tr('Sirf recap aur interview lines dikhao', 'Show only the recap and interview lines')}
          >
            <span aria-hidden="true">{starFilter ? '⭐' : '⚡'}</span>
            <span>{revision ? tr('Revision on', 'Revision on') : starFilter ? tr('Quick revision: sirf ⭐', 'Quick revision: only ⭐') : tr('Quick revision', 'Quick revision')}</span>
          </button>
        </div>
      </div>
      {page.patterns.length > 0 && (
        <div className="row wrap tags">
          {page.patterns.map((p) => (
            <span key={p} className="tag">
              {p}
            </span>
          ))}
          {page.askedAt.length > 0 && (
            <span className="muted small">{page.askedAt.join(' · ')}</span>
          )}
        </div>
      )}
      {revision && <p className="revision-note small">{revisionNote}</p>}
      {starFilter && (
        <div className="jump row wrap">
          {sections(body).map((t) => (
            <button key={t} className={`chip ${t.startsWith('⭐') ? 'star' : ''}`} onClick={() => jumpTo(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      {/* Java and DB pages are not paired Java/C++, so the language switch must not hide their code */}
      <Markdown text={body} showAllCode={page.kind !== 'lld'} />
      <Checklist page={page} />
      <PrevNext page={page} />
      {related.length > 0 && (
        <section className="related">
          <h2>{page.kind === 'topic' ? tr('Ye kin questions me lagta hai', 'Questions that use this') : tr('Pehle ye topics padh lo', 'Read these topics first')}</h2>
          <div className="row wrap">
            {related.map((p) => (
              <a key={p.slug} href={route(p)} className="chip">
                {shortTitle(localize(p, lang).title)}
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

/** Previous / next page in reading order (same order as the sidebar) */
function PrevNext({ page }: { page: Page }) {
  const { lang } = useLang()
  const tr = useTr()
  const order = allPages.filter((p) => p.kind === page.kind && (page.kind !== 'question' || p.tier === page.tier))
  const i = order.findIndex((p) => p.slug === page.slug)
  const prev = order[i - 1]
  const next = order[i + 1]
  if (!prev && !next) return null
  return (
    <nav className="prev-next" aria-label={tr('Pichla / agla', 'Previous / next')}>
      {prev ? (
        <a href={route(prev)} className="pn prev">
          <span className="muted small">← {tr('Pichla', 'Previous')}</span>
          <span>{shortTitle(localize(prev, lang).title)}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={route(next)} className="pn next">
          <span className="muted small">{tr('Agla', 'Next')} →</span>
          <span>{shortTitle(localize(next, lang).title)}</span>
        </a>
      )}
    </nav>
  )
}
