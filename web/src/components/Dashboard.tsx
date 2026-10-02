import { pageBySlug, questions, route, topics } from '../content'
import { useStore } from '../store'
import { groupStats, pageStats } from '../progress'

const PLAN: { day: string; title: string; slugs: string[]; note?: string }[] = [
  {
    day: 'Day 1',
    title: 'Foundation',
    slugs: ['00-interview-framework', '21-numbers-cheatsheet', '01-scaling-basics', '02-sql-vs-nosql', '03-indexing-replication', '04-sharding-consistent-hashing', '05-caching', '06-cap-consistency'],
  },
  {
    day: 'Day 2',
    title: 'Patterns',
    slugs: ['07-message-queues-kafka', '08-real-time-communication', '09-locks-and-contention', '10-idempotency-retries', '11-rate-limiting', '12-blob-storage-cdn', '13-geospatial', '14-search-indexing', '15-counting-top-k', '16-distributed-transactions', '17-unique-id-generation', '18-fan-out', '19-api-design', '20-reliability-observability'],
  },
  { day: 'Day 3', title: 'Questions 1–4', slugs: ['t1-01-url-shortener', 't1-02-rate-limiter', 't1-03-news-feed', 't1-04-whatsapp-chat'] },
  { day: 'Day 4', title: 'Questions 5–8', slugs: ['t1-05-bookmyshow', 't1-06-uber', 't1-07-youtube', 't1-08-dropbox'] },
  { day: 'Day 5', title: 'Questions 9–12', slugs: ['t1-09-notification-system', 't1-10-typeahead', 't1-11-payment-system', 't1-12-web-crawler'] },
  {
    day: 'Day 6',
    title: 'Mock interviews',
    slugs: ['t1-05-bookmyshow', 't1-04-whatsapp-chat', 't1-06-uber'],
    note: 'Har question khol ke right panel me Mock tab se 45 min ka round do. Score ke weak points dobara padho.',
  },
  {
    day: 'Day 7',
    title: 'Tier 2 + revision',
    slugs: ['22-red-flags', ...questions.filter((q) => q.tier !== 1).map((q) => q.slug)],
    note: 'Revision mode on karke sirf decision tables aur recaps padho.',
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
  const all = groupStats([...topics, ...questions], progress)
  const t = groupStats(topics, progress)
  const q1 = groupStats(questions.filter((q) => q.tier === 1), progress)
  const q2 = groupStats(questions.filter((q) => q.tier !== 1), progress)
  const next = [...topics, ...questions].find((p) => !pageStats(p, progress).complete)

  return (
    <div className="dashboard">
      <header className="dash-head">
        <span className="eyebrow">1 hafte ka HLD plan</span>
        <h1>System design, ek din ek block</h1>
        <p className="muted">
          Topics se patterns samjho, questions se pura interview flow practice karo. Har page ke end ki checklist tick karo. Jo bina dekhe bol
          sakte ho, wahi tick karna.
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
        {[
          ['Topics', t],
          ['Tier 1 questions', q1],
          ['Tier 2 questions', q2],
        ].map(([label, s]) => {
          const st = s as ReturnType<typeof groupStats>
          return (
            <div className="stat" key={label as string}>
              <span className="stat-label">{label as string}</span>
              <span className="stat-value mono">{st.percent}%</span>
              <Bar value={st.percent} />
              <span className="muted small">
                {st.complete}/{st.pages} pages complete
              </span>
            </div>
          )
        })}
      </section>

      {next && (
        <a className="continue" href={route(next)}>
          <span className="muted small">Agla padho</span>
          <span className="continue-title">{next.title}</span>
          <span className="mono small">{next.time} min →</span>
        </a>
      )}

      <section className="plan">
        <h2>7 din ka plan</h2>
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
                <h3>{d.title}</h3>
                <Bar value={s.percent} />
                {d.note && <p className="muted small">{d.note}</p>}
                <ul>
                  {pages.map((p) => (
                    <li key={p.slug} className={pageStats(p, progress).complete ? 'done' : ''}>
                      <a href={route(p)}>{p.title.replace(/^Design (an? )?/, '')}</a>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      <section className="tips">
        <h2>Interview me full marks ke liye</h2>
        <ul>
          <li>Pehle 5 min sirf sawal poochho. Bina requirements ke design shuru mat karo.</li>
          <li>Har tech choice ke saath "kyun" aur "kya nahi liya, kyun" bolo. Isi pe sabse zyada marks milte hain.</li>
          <li>Simple design pehle banao jo kaam kare, phir deep dive karo.</li>
          <li>End me khud bolo ki kya fail ho sakta hai aur isko aur better kaise karte.</li>
          <li>Interview se ek raat pehle Revision mode me saare 2-minute recaps padho.</li>
        </ul>
      </section>
    </div>
  )
}
