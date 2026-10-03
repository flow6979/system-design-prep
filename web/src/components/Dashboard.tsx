import { agentPages, db, java, lld, localize, questions, route, topics } from '../content'
import { useStore } from '../store'
import { useLang, useTr } from '../i18n'
import { groupStats, pageStats } from '../progress'
import { shortTitle } from './Sidebar'
import { buildPlan, daysUntil, type PlanInput } from '../plan'

function Bar({ value }: { value: number }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${value}%` }} />
    </div>
  )
}

export function Dashboard() {
  const { progress, profile, user } = useStore()
  const { lang } = useLang()
  const tr = useTr()
  const firstName = user?.displayName?.split(' ')[0]
  const daysLeft = daysUntil(profile.interviewDate)
  const everything = [...topics, ...questions, ...lld, ...java, ...db, ...agentPages]
  const all = groupStats(everything, progress)
  const groups: [string, ReturnType<typeof groupStats>, string][] = [
    ['HLD', groupStats([...topics, ...questions], progress), route(topics[0])],
    ['LLD', groupStats(lld, progress), lld[0] ? route(lld[0]) : '#/'],
    ['Java', groupStats(java, progress), java[0] ? route(java[0]) : '#/'],
    ['Databases', groupStats(db, progress), db[0] ? route(db[0]) : '#/'],
    ['Agentic AI', groupStats(agentPages, progress), '#/agents'],
  ]
  // Today's slice of the personal plan (defaults until the user sets one in the Plan tab)
  const input: PlanInput = profile.plan ?? { tracks: ['hld'], hours: 2, level: 'mid', days: 14 }
  const plan = buildPlan(input, (daysLeft ?? input.days ?? 14) + 1, (p) => pageStats(p, progress).complete)
  const today = plan.days[0]

  return (
    <div className="dashboard">
      <header className="greet">
        <h1>{firstName ? tr(`Namaste, ${firstName}`, `Hi, ${firstName}`) : tr('Namaste', 'Welcome')}</h1>
        {daysLeft !== null && (
          <p className="countdown">
            <span className="mono">{daysLeft}</span> {tr('din baaki interview me', daysLeft === 1 ? 'day to your interview' : 'days to your interview')}
          </p>
        )}
      </header>

      <section className="today">
        <div className="today-head">
          <h2>{tr('Aaj', 'Today')}</h2>
          <a href="#/plan" className="small">
            {profile.plan ? tr('Poora plan →', 'Full plan →') : tr('Apna plan banao →', 'Make your plan →')}
          </a>
        </div>
        {today?.revision ? (
          <p className="muted">{tr('Revision day: recaps, ⭐ quiz aur ek mock interview.', 'Revision day: recaps, ⭐ quiz and one mock interview.')}</p>
        ) : today && today.items.length ? (
          <ul className="plan-items">
            {today.items.map((it) => {
              const s = pageStats(it.page, progress)
              return (
                <li key={it.page.slug}>
                  <a href={route(it.page)} className="plan-item">
                    <span className={`plan-track t-${it.track}`}>{it.track.toUpperCase()}</span>
                    <span className="plan-title">{shortTitle(localize(it.page, lang).title)}</span>
                    <span className="muted small mono">{s.done > 0 ? `${s.done}/${s.total}` : `${it.minutes}m`}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted">{tr('Plan ke saare pages ho gaye. Quiz se revise karo.', 'Everything in your plan is done. Revise with the quiz.')}</p>
        )}
      </section>

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

      <section className="tips">
        <h2>{tr('Interview tips', 'Interview tips')}</h2>
        <ul>
          <li>{tr('Pehle 5 min sirf sawal poochho.', 'Spend the first 5 minutes asking questions.')}</li>
          <li>{tr('Har choice ke saath bolo: kyun, aur kya nahi liya.', 'For every choice, say why and what you did not pick.')}</li>
          <li>{tr('Pehle simple design, phir deep dive.', 'Simple design first, then go deep.')}</li>
          <li>{tr('End me failures aur improvements khud bolo.', 'End with failures and improvements.')}</li>
        </ul>
      </section>
    </div>
  )
}
