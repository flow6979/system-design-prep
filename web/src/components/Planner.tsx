import { Icon } from './Icon'
import { href } from '../router'
import { useMemo, useState } from 'react'
import { localize, route } from '../content'
import { useStore } from '../store'
import { useLang, useTr } from '../i18n'
import { pageStats } from '../progress'
import { buildPlan, daysUntil, TRACKS, type Level, type PlanInput, type PlanItem, type Track } from '../plan'
import { shortTitle } from './Sidebar'
import { useLists, withListPages } from '../lists'

const HOURS = [1, 2, 3, 4, 6]
const DEFAULT_INPUT: PlanInput = { tracks: ['hld'], hours: 2, level: 'mid', days: 14 }

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)

export function Planner() {
  const { progress, profile, saveProfile } = useStore()
  const { lang } = useLang()
  const tr = useTr()
  const saved = profile.plan ?? DEFAULT_INPUT
  const [input, setInput] = useState<PlanInput>(saved)
  const [showHow, setShowHow] = useState(false)
  const { lists } = useLists()
  const fromList = input.list ? lists.find((l) => l.id === input.list) : undefined
  const fromDate = daysUntil(profile.interviewDate)
  const days = fromDate ?? input.days ?? 14

  const update = (next: PlanInput) => {
    setInput(next)
    saveProfile({ ...profile, plan: next }).catch(() => {})
  }
  const toggleTrack = (t: Track) => {
    const has = input.tracks.includes(t)
    const tracks = has ? input.tracks.filter((x) => x !== t) : [...input.tracks, t]
    if (tracks.length) update({ ...input, tracks })
  }

  const plan = useMemo(() => buildPlan(withListPages(input, lists), days + 1, (p) => pageStats(p, progress).complete), [input, lists, days, progress])
  const total = plan.days.reduce((n, d) => n + d.items.length, 0)
  const dayLabel = (date: Date, i: number) =>
    i === 0 ? tr('Aaj', 'Today') : i === 1 ? tr('Kal', 'Tomorrow') : date.toLocaleDateString(lang === 'en' ? 'en-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="planner">
      <div className="plan-title-row">
        <h1>{tr('Mera plan', 'My plan')}</h1>
        <button type="button" className={`chip ${showHow ? 'on' : ''}`} aria-expanded={showHow} onClick={() => setShowHow((s) => !s)}>
          <Icon name="info" size={15} /> {tr('Plan kaise banta hai?', 'How is the plan made?')}
        </button>
      </div>
      {showHow && <PlanHowTo />}

      <section className="plan-form" aria-label={tr('Plan ke inputs', 'Plan inputs')}>
        <div className="field">
          <span className="field-label">{tr('Kitne din baaki', 'Days left')}</span>
          {fromDate !== null ? (
            <span className="field-value">
              <b className="mono">{fromDate}</b> <span className="muted small">({tr('profile ki interview date se', 'from your interview date')})</span>
            </span>
          ) : (
            <input
              id="plan-days"
              type="number"
              min={1}
              max={120}
              value={input.days ?? 14}
              onChange={(e) => update({ ...input, days: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })}
            />
          )}
        </div>

        <div className="field">
          <span className="field-label">{tr('Kya prepare karna hai', 'What are you preparing')}</span>
          <div className={`row wrap ${fromList ? 'dimmed' : ''}`}>
            {TRACKS.map((t) => (
              <button key={t.id} type="button" className={`chip ${input.tracks.includes(t.id) ? 'on' : ''}`} aria-pressed={input.tracks.includes(t.id)} onClick={() => toggleTrack(t.id)}>
                {t.label[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">{tr('Ya sirf apni list se', 'Or only from your list')}</span>
          {lists.length ? (
            <select id="plan-list" value={fromList?.id ?? ''} onChange={(e) => update({ ...input, list: e.target.value || undefined })}>
              <option value="">{tr('— Subjects se (upar wale) —', '— From the subjects above —')}</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.slugs.length}
                </option>
              ))}
            </select>
          ) : (
            <span className="muted small">
              {tr('Koi list nahi hai.', 'No lists yet.')} <a href={href('lists')}>{tr('List banao →', 'Make a list →')}</a>
            </span>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <span className="field-label">{tr('Roz kitne ghante', 'Hours per day')}</span>
            <div className="seg small" role="radiogroup" aria-label={tr('Roz kitne ghante', 'Hours per day')}>
              {HOURS.map((h) => (
                <button key={h} role="radio" aria-checked={input.hours === h} className={input.hours === h ? 'on' : ''} onClick={() => update({ ...input, hours: h })}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">{tr('Experience', 'Experience')}</span>
            <div className="seg small" role="radiogroup" aria-label="Experience">
              {(
                [
                  ['junior', '0–2 yr'],
                  ['mid', '2–5 yr'],
                  ['senior', '5+ yr'],
                ] as [Level, string][]
              ).map(([id, label]) => (
                <button key={id} role="radio" aria-checked={input.level === id} className={input.level === id ? 'on' : ''} onClick={() => update({ ...input, level: id })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <p className="plan-summary muted">
        {tr(
          `${days + 1} din · ${input.hours}h roz · ${total} pages plan me${plan.doneCount ? ` · ${plan.doneCount} ho chuke` : ''}`,
          `${days + 1} days · ${input.hours}h a day · ${total} pages planned${plan.doneCount ? ` · ${plan.doneCount} done` : ''}`,
        )}
      </p>
      {plan.mustDoMissing > 0 && (
        <p className="plan-warn">
          {tr(
            `Time kam hai: ${plan.mustDoMissing} must-do pages fit nahi hue. Ghante badhao ya kam subjects chuno.`,
            `Not enough time: ${plan.mustDoMissing} must-do pages do not fit. Add hours or pick fewer subjects.`,
          )}
        </p>
      )}

      <ol className="plan-days">
        {plan.days.map((d, i) => (
          <li key={d.date.toISOString()} className={`plan-day ${i === 0 ? 'today' : ''}`}>
            <div className="plan-day-head">
              <span className="plan-day-label">{dayLabel(d.date, Math.round((d.date.getTime() - plan.days[0].date.getTime()) / 86400000))}</span>
              {!d.revision && <span className="muted small mono">{fmtMin(d.minutes)}</span>}
            </div>
            {d.revision ? (
              <div className="plan-revision">
                <p>
                  {tr(
                    'Revision day: pages ka Quick look ya Revision padho, starred quiz dohrao, aur ek mock interview do.',
                    'Revision day: read the Quick look or Revision of your pages, redo starred quiz questions and take one mock interview.',
                  )}
                </p>
                <div className="row wrap">
                  <a className="chip" href={href('quiz')}>
                    ★ Quiz
                  </a>
                  {input.tracks.includes('hld') && (
                    <a className="chip" href={href('q/t1-05-bookmyshow')}>
                      Mock: BookMyShow
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <ul className="plan-items">
                {d.items.map((it) => (
                  <PlanRow key={it.page.slug} item={it} />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {plan.later.length > 0 && (
        <details className="plan-later">
          <summary>
            {tr('Time mile to', 'If you have time')} · {plan.later.length}
          </summary>
          <ul className="plan-items">
            {plan.later.map((it) => (
              <PlanRow key={it.page.slug} item={it} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )

  function PlanRow({ item }: { item: PlanItem }) {
    const s = pageStats(item.page, progress)
    return (
      <li>
        <a href={route(item.page)} className="plan-item">
          <span className={`plan-track t-${item.track}`}>{item.track.toUpperCase()}</span>
          <span className="plan-title">{shortTitle(localize(item.page, lang).title)}</span>
          {item.priority === 1 && <span className="plan-must" title={tr('Must-do', 'Must-do')}>●</span>}
          <span className="muted small mono">{s.done > 0 ? `${s.done}/${s.total}` : fmtMin(item.minutes)}</span>
        </a>
      </li>
    )
  }
}

/** Plain-language explanation of how buildPlan() decides the days */
function PlanHowTo() {
  const tr = useTr()
  return (
    <section className="plan-howto">
      <ol>
        <li>
          <b>{tr('Tum batao:', 'You tell us:')}</b>{' '}
          {tr(
            'kitne din baaki (profile me interview date ho to wahi se), roz kitne ghante, experience, aur kaunse subjects. Ya seedha apni ek list chuno.',
            'days left (taken from the interview date in your profile if set), hours per day, experience and subjects. Or pick one of your lists.',
          )}
        </li>
        <li>
          <b>{tr('Priority:', 'Priority:')}</b>{' '}
          {tr(
            'har subject ke pages 3 hisson me hain: ● must-do (sabse zyada pooche jaate), important, aur time mile to. Pehle saare must-do aate hain.',
            'each subject has 3 tiers: ● must-do (asked most), important, and if you have time. All must-do pages come first.',
          )}
        </li>
        <li>
          <b>{tr('Mix:', 'Mix:')}</b>{' '}
          {tr('ek din me ek hi subject nahi; subjects baari baari (round-robin) aate hain taaki sab saath badhe.', 'subjects take turns (round-robin), so one subject never eats a whole day.')}
        </li>
        <li>
          <b>{tr('Time:', 'Time:')}</b>{' '}
          {tr(
            'har page ka reading time × practice factor (HLD topic ×3, HLD problem ×2.5, LLD ×2, Java/DB/CS ×1.5). Din bhar jaata hai to agla din shuru.',
            'each page = reading time × a practice factor (HLD topic ×3, HLD problem ×2.5, LLD ×2, Java/DB/CS ×1.5). When a day is full, the next one starts.',
          )}
        </li>
        <li>
          <b>{tr('Experience:', 'Experience:')}</b>{' '}
          {tr('senior ko tier-2 designs jaldi milte hain; junior pehle fundamentals aur aasaan designs karta hai.', 'seniors get the deeper tier-2 designs earlier; juniors start with fundamentals and easier designs.')}
        </li>
        <li>
          <b>{tr('Aakhri din:', 'Last day:')}</b>{' '}
          {tr('revision day: Quick look, starred quiz aur ek mock interview.', 'revision day: Quick look, starred quiz and one mock interview.')}
        </li>
        <li>
          <b>{tr('Roz update:', 'Updates daily:')}</b>{' '}
          {tr(
            'jo page ka checklist poora tick ho gaya wo plan se hat jaata hai, aur plan aaj se dobara bant jaata hai. Time kam pade to bachi cheezein "Time mile to" me dikhti hain.',
            'a page whose checklist is fully ticked drops out, and the plan re-balances from today. If time runs short, the rest shows under "If you have time".',
          )}
        </li>
      </ol>
    </section>
  )
}
