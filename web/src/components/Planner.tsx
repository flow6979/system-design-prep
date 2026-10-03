import { useMemo, useState } from 'react'
import { localize, route } from '../content'
import { useStore } from '../store'
import { useLang, useTr } from '../i18n'
import { pageStats } from '../progress'
import { buildPlan, daysUntil, TRACKS, type Level, type PlanInput, type PlanItem, type Track } from '../plan'
import { shortTitle } from './Sidebar'

const HOURS = [1, 2, 3, 4, 6]
const DEFAULT_INPUT: PlanInput = { tracks: ['hld'], hours: 2, level: 'mid', days: 14 }

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)

export function Planner() {
  const { progress, profile, saveProfile } = useStore()
  const { lang } = useLang()
  const tr = useTr()
  const saved = profile.plan ?? DEFAULT_INPUT
  const [input, setInput] = useState<PlanInput>(saved)
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

  const plan = useMemo(() => buildPlan(input, days + 1, (p) => pageStats(p, progress).complete), [input, days, progress])
  const total = plan.days.reduce((n, d) => n + d.items.length, 0)
  const dayLabel = (date: Date, i: number) =>
    i === 0 ? tr('Aaj', 'Today') : i === 1 ? tr('Kal', 'Tomorrow') : date.toLocaleDateString(lang === 'en' ? 'en-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="planner">
      <h1>{tr('Mera plan', 'My plan')}</h1>

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
          <div className="row wrap">
            {TRACKS.map((t) => (
              <button key={t.id} type="button" className={`chip ${input.tracks.includes(t.id) ? 'on' : ''}`} aria-pressed={input.tracks.includes(t.id)} onClick={() => toggleTrack(t.id)}>
                {t.label[lang]}
              </button>
            ))}
          </div>
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
                    'Revision day: Revision mode me recaps padho, ⭐ quiz dohrao, aur ek mock interview do.',
                    'Revision day: read recaps in Revision mode, redo ⭐ quiz questions and take one mock interview.',
                  )}
                </p>
                <div className="row wrap">
                  <a className="chip" href="#/quiz">
                    ⭐ Quiz
                  </a>
                  {input.tracks.includes('hld') && (
                    <a className="chip" href="#/q/t1-05-bookmyshow">
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
