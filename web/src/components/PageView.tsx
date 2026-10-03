import { allPages, behavioral, cs, rag, db, java, lld, lldProblems, localize, pageBySlug, quickLook, revisionBody, route, type Page } from '../content'
import { ListPicker } from './ListPicker'
import { useLang, useTr } from '../i18n'
import { Markdown } from './Markdown'
import { Icon, type IconName } from './Icon'
import { Checklist } from './Checklist'
import { LangToggle, type CodeLang } from './CodeBlock'
import { shortTitle } from './Sidebar'

/** `## ` headings of the visible body, for the jump list on LLD pages */
function sections(body: string): string[] {
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
}

function jumpTo(title: string) {
  const plain = title.replace(/^⭐\s*/, '')
  const el = [...document.querySelectorAll('.md h2')].find((h) => h.textContent?.replace(/^[★⭐]\s*/, '').trim() === plain)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** full page · revision (⭐ / recap sections) · quick look (1-minute cheat sheet) */
export type ReadMode = 'full' | 'revision' | 'quick'

export function PageView({
  page: source,
  mode,
  onMode,
  codeLang,
  onCodeLang,
}: {
  page: Page
  mode: ReadMode
  onMode: (m: ReadMode) => void
  codeLang: CodeLang
  onCodeLang: (l: CodeLang) => void
}) {
  const { lang } = useLang()
  const tr = useTr()
  const page = localize(source, lang)
  const related = page.related.map((s) => pageBySlug.get(s)).filter((p): p is Page => !!p)
  const isLld = page.kind === 'lld'
  // LLD and Java are multi-page sections shown with sub-tabs, a star filter and a jump list
  const TABS: Partial<Record<Page['kind'], Page[]>> = { lld, lldp: lldProblems, java, db, cs, beh: behavioral, rag }
  const tabs = TABS[page.kind] ?? []
  const tabbed = tabs.length > 0
  // ⭐ filter for star-based sections; problems keep the regular revision mode
  const starFilter = tabbed && page.kind !== 'lldp'
  const quick = quickLook(page.slug, lang)
  const revision = mode === 'revision'
  const body = revision ? revisionBody(page) : page.body

  const eyebrow = { topic: 'Topic', question: `HLD problem · Tier ${page.tier ?? 2}`, lld: 'LLD · Design patterns', lldp: 'LLD problem', java: 'Java', db: 'Databases', cs: 'CS fundamentals', beh: 'Behavioral', rag: 'RAG', agent: 'Agentic AI' }[page.kind]
  const revisionNote = {
    question: tr(
      'Revision mode: sirf clarifying sawal, decision table aur 2-minute recap dikh rahe hain.',
      'Revision mode: showing only clarifying questions, the decision table and the 2-minute recap.',
    ),
    topic: tr(
      'Revision mode: sirf summary, interview lines aur common galtiyan dikh rahi hain.',
      'Revision mode: showing only the summary, interview lines and common mistakes.',
    ),
    lld: tr('Sirf ★ wale (sabse zyada pooche jaane wale) patterns dikh rahe hain.', 'Showing only ★ patterns (the most asked ones).'),
    java: tr('Sirf ★ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ★ sections (the most asked ones).'),
    db: tr('Sirf ★ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ★ sections (the most asked ones).'),
    cs: tr('Sirf ★ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ★ sections (the most asked ones).'),
    beh: tr('Sirf ★ wale (must-prepare) sections dikh rahe hain.', 'Showing only ★ sections (must-prepare).'),
    rag: tr('Sirf ★ wale (sabse zyada pooche jaane wale) sections dikh rahe hain.', 'Showing only ★ sections (the most asked ones).'),
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
          <ListPicker slug={page.slug} />
        </div>
      </div>
      <div className="mode-switch" role="radiogroup" aria-label={tr('Kaise padhna hai', 'Reading mode')}>
        {(
          [
            ['full', 'book', tr('Poora page', 'Full page'), tr('Sab kuch, detail me', 'Everything, in detail')],
            ['revision', 'star', 'Revision', starFilter ? tr('Sirf important sections', 'Only key sections') : tr('Sirf recap aur interview lines', 'Only recap and interview lines')],
            ['quick', 'bolt', 'Quick look', tr('1 minute me key points', 'Key points in 1 minute')],
          ] as [ReadMode, IconName, string, string][]
        ).map(([m, icon, label, hint]) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'on' : ''} onClick={() => onMode(m)} disabled={m === 'quick' && !quick}>
            <span className="mode-label">
              <Icon name={icon} size={16} /> {label}
            </span>
            <span className="mode-hint">{hint}</span>
          </button>
        ))}
      </div>
      {page.patterns.length > 0 && mode !== 'quick' && (
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
      {starFilter && mode !== 'quick' && (
        <div className="jump row wrap">
          {sections(body).map((t) => (
            <button key={t} className={`chip ${t.startsWith('⭐') ? 'star' : ''}`} onClick={() => jumpTo(t)}>
              {t.replace(/^⭐\s*/, '★ ')}
            </button>
          ))}
        </div>
      )}
      {/* Java and DB pages are not paired Java/C++, so the language switch must not hide their code */}
      {mode === 'quick' && quick ? (
        <section className="quicklook">
          <Markdown text={quick} showAllCode />
          <button type="button" className="link-btn small" onClick={() => onMode('full')}>
            {tr('Poora page padho →', 'Read the full page →')}
          </button>
        </section>
      ) : (
        <Markdown text={body} showAllCode={page.kind !== 'lld'} />
      )}
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
