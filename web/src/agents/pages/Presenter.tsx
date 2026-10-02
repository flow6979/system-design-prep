// Presenter mode: call pe demo ke liye script + timer + masked keys + offline backup.
import { prettyFile } from '../lib/handbook'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT } from '../i18n'
import { presenterDict } from '../i18n/pages/presenter'
import { local } from '../lib/storage'
import { useApp } from '../state/app'
import '../styles/pages/presenter.css'

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Presenter() {
  const app = useApp()
  const t = useT(presenterDict)
  const g = useGuide('presenter', ['start', 'offline'])
  const [idx, setIdx] = useState(() => Math.min(local.get('presenterStep', 0), t.steps.length - 1))
  const [running, setRunning] = useState(false)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const go = (i: number) => {
    const n = Math.max(0, Math.min(t.steps.length - 1, i))
    setIdx(n)
    local.set('presenterStep', n)
  }

  const start = () => {
    if (!running && secs === 0) g.done('start', t.explain.start)
    setRunning((r) => !r)
  }

  const offline = () => {
    app.setProvider('offline')
    app.setConnection('ok')
    g.done('offline', t.explain.offline)
  }

  const step = t.steps[idx]
  const isOffline = app.provider === 'offline'

  return (
    <div id="main" className="page col" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div className="col" style={{ gap: 4, maxWidth: 760 }}>
          <h1 className="h1">{t.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <span className="eyebrow">{t.timer}</span>
          <span className="mono presenter-timer" aria-live="off">{fmt(secs)}</span>
          <button type="button" className={`btn btn-primary ${g.pulse('start')}`} onClick={start}>
            <Icon name={running ? 'stop' : 'play'} size={14} />
            {running ? t.pause : secs ? t.resume : t.start}
          </button>
        </div>
      </div>
      <Tip show={g.is('start')} align="end">{t.tipStart}</Tip>

      <div className="presenter-grid">
        <aside className="col" style={{ gap: 14 }}>
          <section className="panel col" style={{ gap: 8 }} aria-labelledby="agenda-h">
            <h2 id="agenda-h" className="h2">{t.agenda}</h2>
            <ol className="agenda">
              {t.steps.map((s, i) => (
                <li key={s.title}>
                  <button type="button" className={`agenda-item${i === idx ? ' on' : ''}${i < idx ? ' done' : ''}`} aria-current={i === idx ? 'step' : undefined} onClick={() => go(i)}>
                    <span className="agenda-n">{i < idx ? <Icon name="check" size={14} /> : i + 1}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{s.title}</span>
                    <span className="mono" style={{ fontSize: 12, opacity: 0.8 }}>
                      {s.minutes} {t.min}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel col" style={{ gap: 10 }}>
            <label className="row" style={{ gap: 10, cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" className="presenter-switch" checked={app.presenterMask} onChange={(e) => app.setPresenterMask(e.target.checked)} />
              {t.mask}
            </label>
            <span style={{ fontSize: 13, color: app.presenterMask ? 'var(--muted)' : 'var(--red)' }}>{app.presenterMask ? t.maskOn : t.maskOff}</span>
          </section>

          <section className="panel col" style={{ gap: 10 }}>
            <Tip show={g.is('offline')}>{t.tipOffline}</Tip>
            <button type="button" className={`btn ${g.pulse('offline')}`} onClick={offline} disabled={isOffline} aria-pressed={isOffline}>
              {isOffline ? t.offlineOn : t.offline}
            </button>
            <span className="muted" style={{ fontSize: 13 }}>{t.offlineHint}</span>
          </section>
        </aside>

        <section className="stage col" aria-live="polite" aria-labelledby="stage-h">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span className="stage-eyebrow">
              {t.now} · {t.stepOf(idx + 1, t.steps.length)}
            </span>
            <Link to={step.route} className="btn stage-open">
              {t.open} <Icon name="arrow" />
            </Link>
          </div>
          <h2 id="stage-h" className="stage-title">{step.title}</h2>
          <div className="col" style={{ gap: 6 }}>
            <span className="stage-eyebrow">{t.onScreen}</span>
            <p className="stage-screen">{step.screen}</p>
          </div>
          <div className="col" style={{ gap: 6 }}>
            <span className="stage-eyebrow">{t.notes}</span>
            <ol className="stage-notes">
              {step.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ol>
          </div>
          <span className="mono" style={{ fontSize: 13, color: 'var(--mint)' }}>{prettyFile(step.file)}</span>
          <div style={{ flexGrow: 1 }} />
          <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
            <button type="button" className="btn stage-btn" onClick={() => go(idx - 1)} disabled={idx === 0}>
              {t.prev}
            </button>
            <button type="button" className="btn btn-primary stage-btn" onClick={() => go(idx + 1)} disabled={idx === t.steps.length - 1}>
              {t.next} <Icon name="arrow" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
