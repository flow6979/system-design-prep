import { agentPages, lld, localize, pageBySlug, questions, route, topics } from '../content'
import { useStore } from '../store'
import { useLang, useTr } from '../i18n'
import { groupStats, pageStats } from '../progress'
import { shortTitle } from './Sidebar'

type Text = { hi: string; en: string }

const PLAN: { day: string; title: Text; slugs: string[]; note?: Text }[] = [
  {
    day: 'Day 1',
    title: { hi: 'Foundation', en: 'Foundation' },
    slugs: ['00-interview-framework', '21-numbers-cheatsheet', '01-scaling-basics', '02-sql-vs-nosql', '03-indexing-replication', '04-sharding-consistent-hashing', '05-caching', '06-cap-consistency'],
  },
  {
    day: 'Day 2',
    title: { hi: 'Patterns', en: 'Patterns' },
    slugs: ['07-message-queues-kafka', '08-real-time-communication', '09-locks-and-contention', '10-idempotency-retries', '11-rate-limiting', '12-blob-storage-cdn', '13-geospatial', '14-search-indexing', '15-counting-top-k', '16-distributed-transactions', '17-unique-id-generation', '18-fan-out', '19-api-design', '20-reliability-observability'],
  },
  { day: 'Day 3', title: { hi: 'Questions 1–4', en: 'Questions 1–4' }, slugs: ['t1-01-url-shortener', 't1-02-rate-limiter', 't1-03-news-feed', 't1-04-whatsapp-chat'] },
  { day: 'Day 4', title: { hi: 'Questions 5–8', en: 'Questions 5–8' }, slugs: ['t1-05-bookmyshow', 't1-06-uber', 't1-07-youtube', 't1-08-dropbox'] },
  { day: 'Day 5', title: { hi: 'Questions 9–12', en: 'Questions 9–12' }, slugs: ['t1-09-notification-system', 't1-10-typeahead', 't1-11-payment-system', 't1-12-web-crawler'] },
  {
    day: 'Day 6',
    title: { hi: 'Mock interviews', en: 'Mock interviews' },
    slugs: ['t1-05-bookmyshow', 't1-04-whatsapp-chat', 't1-06-uber'],
    note: {
      hi: 'Har question khol ke right panel me Mock tab se 45 min ka round do. Score ke weak points dobara padho.',
      en: 'Open each question and do a 45-min round from the Mock tab in the right panel. Re-read the weak points from your score.',
    },
  },
  {
    day: 'Day 7',
    title: { hi: 'Tier 2 + revision', en: 'Tier 2 + revision' },
    slugs: ['22-red-flags', ...questions.filter((q) => q.tier !== 1).map((q) => q.slug)],
    note: {
      hi: 'Revision mode on karke sirf decision tables aur recaps padho.',
      en: 'Turn on Revision mode and read only the decision tables and recaps.',
    },
  },
]

function Bar({ value }: { value: number }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${value}%` }} />
    </div>
  )
}

export function Dashboard() {
  const { progress } = useStore()
  const { lang } = useLang()
  const tr = useTr()
  const everything = [...topics, ...questions, ...lld, ...agentPages]
  const all = groupStats(everything, progress)
  const next = everything.find((p) => !pageStats(p, progress).complete)
  const groups: [string, ReturnType<typeof groupStats>, string][] = [
    ['Topics', groupStats(topics, progress), route(topics[0])],
    ['Tier 1', groupStats(questions.filter((q) => q.tier === 1), progress), route(questions[0])],
    ['Tier 2', groupStats(questions.filter((q) => q.tier !== 1), progress), route(questions.find((q) => q.tier !== 1) ?? questions[0])],
    ['LLD', groupStats(lld, progress), lld[0] ? route(lld[0]) : '#/'],
    ['Agentic AI', groupStats(agentPages, progress), '#/agents'],
  ]
  // The first day that is not finished opens by default
  const plans = PLAN.map((d) => {
    const pages = d.slugs.map((s) => pageBySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
    return { ...d, pages, stats: groupStats(pages, progress) }
  })
  const today = plans.findIndex((d) => d.stats.percent < 100)

  return (
    <div className="dashboard">
      {next && (
        <a className="continue" href={route(next)}>
          <span className="continue-label">{tr('Agla', 'Next')}</span>
          <span className="continue-title">{localize(next, lang).title}</span>
          <span className="mono small">{next.time} min →</span>
        </a>
      )}

      <section className="progress-panel" aria-label="Progress">
        <div className="progress-total">
          <span className="stat-value mono">{all.percent}%</span>
          <span className="muted small mono">
            {all.done}/{all.total}
          </span>
        </div>
        <div className="progress-rows">
          {groups.map(([label, st, href]) => (
            <a className="progress-row" key={label} href={href}>
              <span>{label}</span>
              <Bar value={st.percent} />
              <span className="mono small muted">{st.percent}%</span>
            </a>
          ))}
        </div>
      </section>

      <section className="plan">
        <h2>{tr('7 din ka plan', '7-day plan')}</h2>
        <div className="day-list">
          {plans.map((d, i) => (
            <details className="day-row" key={d.day} open={i === today}>
              <summary>
                <span className="eyebrow">{d.day}</span>
                <span className="day-title">{d.title[lang]}</span>
                <Bar value={d.stats.percent} />
                <span className="mono small muted">
                  {d.stats.complete}/{d.stats.pages}
                </span>
              </summary>
              {d.note && <p className="muted small">{d.note[lang]}</p>}
              <div className="row wrap">
                {d.pages.map((p) => (
                  <a key={p.slug} href={route(p)} className={`chip ${pageStats(p, progress).complete ? 'done' : ''}`}>
                    {shortTitle(localize(p, lang).title)}
                  </a>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="tips">
        <h2>{tr('Interview tips', 'Interview tips')}</h2>
        <ul>
          <li>{tr('Pehle 5 min sirf sawal poochho.', 'Spend the first 5 minutes asking questions.')}</li>
          <li>{tr('Har choice ke saath bolo: kyun, aur kya nahi liya.', 'For every choice, say why and what you did not pick.')}</li>
          <li>{tr('Pehle simple design, phir deep dive.', 'Simple design first, then go deep.')}</li>
          <li>{tr('End me failures aur improvements khud bolo.', 'End with failures and improvements.')}</li>
          <li>{tr('Raat ko Revision mode me saare recaps padho.', 'The night before, read all recaps in Revision mode.')}</li>
        </ul>
      </section>
    </div>
  )
}
