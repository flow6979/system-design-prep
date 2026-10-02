// Errors gallery: har error kind jo app asli mein dikhata hai (labapi.registry.classify_error).
// LabError card "/errors#<kind>" pe link karta hai, isliye har card ka id = kind.
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LabError } from '../components/LabError'
import { Icon } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT } from '../i18n'
import { common } from '../i18n/common'
import { errorsDict } from '../i18n/pages/errors'
import type { LabError as LabErr } from '../lib/worker'
import { useApp } from '../state/app'
import '../styles/pages/errors.css'

const STATUS: Record<string, number | null> = { auth: 401, rate_limit: 429, not_found: 404, network: null, server: 529, internal: null }

export default function SetupErrors() {
  const app = useApp()
  const t = useT(errorsDict)
  const c = useT(common)
  const g = useGuide('errors', ['simulate'])
  const { hash } = useLocation()
  const [sim, setSim] = useState<string | null>(null)

  useEffect(() => {
    const id = hash.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.focus({ preventScroll: true })
    }
  }, [hash])

  const offline = () => {
    app.setProvider('offline')
    app.setConnection('ok')
  }

  return (
    <div id="main" className="page col" style={{ gap: 18 }}>
      <div className="col" style={{ gap: 4, maxWidth: 820 }}>
        <h1 className="h1">{t.title}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
      </div>

      <section className="panel col" style={{ gap: 10 }} aria-labelledby="flow-h">
        <h2 id="flow-h" className="h2">{t.flowTitle}</h2>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {t.flow.map((f, i) => (
            <span key={f} className="row" style={{ gap: 6 }}>
              <span className="chip mono" style={{ fontSize: 12 }}>{f}</span>
              {i < t.flow.length - 1 && <span aria-hidden="true" className="muted">→</span>}
            </span>
          ))}
        </div>
      </section>

      <Tip show={g.is('simulate')}>{t.tipSim}</Tip>

      <div className="errors-grid">
        {t.items.map((it) => {
          const title = c.errors[it.kind]?.title ?? it.kind
          const sample: LabErr = { kind: it.kind, status: STATUS[it.kind], message: it.sample }
          const open = sim === it.kind
          return (
            <section key={it.kind} id={it.kind} tabIndex={-1} className={`panel col err-card${hash === `#${it.kind}` ? ' target' : ''}`} aria-labelledby={`${it.kind}-h`}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <h2 id={`${it.kind}-h`} className="h2 row" style={{ gap: 8 }}>
                  <Icon name="warn" /> {title}
                </h2>
                <span className={`badge ${it.retry === 'yes' ? 'badge-teal' : 'badge-gray'}`}>
                  {t.retryLabel} {it.retry === 'yes' ? t.retryYes : t.retryNo}
                </span>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="eyebrow">{t.see}</span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{it.see}</p>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="eyebrow">{t.why}</span>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink-3)' }}>{it.why}</p>
                <span className="mono muted" style={{ fontSize: 12 }}>{it.explain.file}</span>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="eyebrow">{t.fixes}:</span>
                <Link to="/agents/settings" className="btn btn-sm">{t.settings}</Link>
                {(it.kind === 'rate_limit' || it.kind === 'server' || it.kind === 'auth') && (
                  <Link to="/agents/settings" className="btn btn-sm">{t.addFallback}</Link>
                )}
                <button type="button" className="btn btn-sm" onClick={offline} disabled={app.provider === 'offline'}>
                  {app.provider === 'offline' ? t.offlineDone : t.offline}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm btn-outline ${g.pulse('simulate')}`}
                  aria-expanded={open}
                  onClick={() => {
                    setSim(open ? null : it.kind)
                    if (!open) g.done('simulate', it.explain)
                  }}
                >
                  {open ? t.hideSim : t.simulate}
                </button>
              </div>
              {open && (
                <div className="al-in">
                  <LabError error={sample} onOffline={offline} />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
