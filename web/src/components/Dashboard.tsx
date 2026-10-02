import { lld, localize, pageBySlug, questions, route, topics } from '../content'
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
  const all = groupStats([...topics, ...questions, ...lld], progress)
  const next = [...topics, ...questions, ...lld].find((p) => !pageStats(p, progress).complete)
  const tiles: [string, ReturnType<typeof groupStats>][] = [
    ['Topics', groupStats(topics, progress)],
    ['Tier 1 questions', groupStats(questions.filter((q) => q.tier === 1), progress)],
    ['Tier 2 questions', groupStats(questions.filter((q) => q.tier !== 1), progress)],
    ['LLD patterns', groupStats(lld, progress)],
  ]

  return (
    <div className="dashboard">
      <header className="dash-head">
        <span className="eyebrow">{tr('1 hafte ka HLD plan', '1-week HLD plan')}</span>
        <h1>{tr('System design, ek din ek block', 'System design, one block a day')}</h1>
        <p className="muted">
          {tr(
            'Topics se patterns samjho, questions se pura interview flow practice karo. Har page ke end ki checklist tick karo. Jo bina dekhe bol sakte ho, wahi tick karna.',
            'Learn the patterns from topics, then practise the full interview flow with questions. Tick the checklist at the end of each page, but only what you can explain without looking.',
          )}
        </p>
      </header>

      <section className="stats">
        <div className="stat main">
          <span className="stat-label">Overall</span>
          <span className="stat-value mono">{all.percent}%</span>
          <Bar value={all.percent} />
          <span className="muted small">
            {all.done} / {all.total} checklist points
          </span>
        </div>
        {tiles.map(([label, st]) => (
          <div className="stat" key={label}>
            <span className="stat-label">{label}</span>
            <span className="stat-value mono">{st.percent}%</span>
            <Bar value={st.percent} />
            <span className="muted small">
              {st.complete}/{st.pages} {tr('pages complete', 'pages complete')}
            </span>
          </div>
        ))}
      </section>

      {next && (
        <a className="continue" href={route(next)}>
          <span className="muted small">{tr('Agla padho', 'Read next')}</span>
          <span className="continue-title">{localize(next, lang).title}</span>
          <span className="mono small">{next.time} min →</span>
        </a>
      )}

      <section className="plan">
        <h2>{tr('7 din ka plan', '7-day plan')}</h2>
        <div className="days">
          {PLAN.map((d) => {
            const pages = d.slugs.map((s) => pageBySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p)
            const s = groupStats(pages, progress)
            return (
              <article className="day" key={d.day}>
                <div className="day-head">
                  <span className="eyebrow">{d.day}</span>
                  <span className="mono small">{s.percent}%</span>
                </div>
                <h3>{d.title[lang]}</h3>
                <Bar value={s.percent} />
                {d.note && <p className="muted small">{d.note[lang]}</p>}
                <ul>
                  {pages.map((p) => (
                    <li key={p.slug} className={pageStats(p, progress).complete ? 'done' : ''}>
                      <a href={route(p)}>{shortTitle(localize(p, lang).title)}</a>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {lld.length > 0 && (
        <section className="plan">
          <h2>{tr('LLD round ke liye', 'For the LLD round')}</h2>
          <p className="muted">
            {tr(
              'OOP, SOLID aur design patterns, Java aur C++ code ke saath. ⭐ wale sabse zyada pooche jaate hain. Revision ke time "Sirf ⭐ dikhao" on karo.',
              'OOP, SOLID and design patterns with Java and C++ code. ⭐ ones are asked the most. Turn on "Only ⭐" when revising.',
            )}
          </p>
          <div className="row wrap">
            {lld.map((p) => (
              <a key={p.slug} href={route(p)} className="chip">
                {localize(p, lang).title} · {p.time} min
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="tips">
        <h2>{tr('Interview me full marks ke liye', 'How to score full marks')}</h2>
        <ul>
          <li>{tr('Pehle 5 min sirf sawal poochho. Bina requirements ke design shuru mat karo.', 'Spend the first 5 minutes asking questions. Never start designing without requirements.')}</li>
          <li>
            {tr(
              'Har tech choice ke saath "kyun" aur "kya nahi liya, kyun" bolo. Isi pe sabse zyada marks milte hain.',
              'With every tech choice, say why, and what you did not pick and why. This earns the most marks.',
            )}
          </li>
          <li>{tr('Simple design pehle banao jo kaam kare, phir deep dive karo.', 'Build a simple design that works first, then go deep.')}</li>
          <li>{tr('End me khud bolo ki kya fail ho sakta hai aur isko aur better kaise karte.', 'At the end, say what can fail and how you would make it better.')}</li>
          <li>{tr('Interview se ek raat pehle Revision mode me saare 2-minute recaps padho.', 'The night before, read all 2-minute recaps in Revision mode.')}</li>
        </ul>
      </section>
    </div>
  )
}
