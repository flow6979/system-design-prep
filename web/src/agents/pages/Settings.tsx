// Settings: asli app state (useApp) se judi. Keys sessionStorage mein, baaki localStorage mein.
import { useState, type ReactNode } from 'react'
import { LabError } from '../components/LabError'
import { Icon, Seg } from '../components/ui'
import { Tip, useGuide } from '../guide/guide'
import { useT, type Lang } from '../i18n'
import { settingsDict } from '../i18n/pages/settings'
import { PROVIDERS, maskKey, providerById, type ProviderId } from '../lib/providers'
import { local } from '../lib/storage'
import { bridge, type LabError as LabErr } from '../lib/worker'
import { useApp } from '../state/app'
import '../styles/pages/settings.css'

const ROLES = ['supervisor', 'researcher', 'writer', 'critic']
const KEYED = PROVIDERS.filter((p) => p.id !== 'offline')

export default function Settings() {
  const app = useApp()
  const t = useT(settingsDict)
  const g = useGuide('settings', ['fallback', 'role'])
  const [testing, setTesting] = useState(false)
  const [testInfo, setTestInfo] = useState('')
  const [err, setErr] = useState<LabErr | null>(null)
  const [addChoice, setAddChoice] = useState<ProviderId | ''>('')

  const primary = app.provider
  const chain = app.fallback.filter((f) => f !== primary && f !== 'offline')
  const addable = KEYED.filter((p) => p.id !== primary && !chain.includes(p.id))
  const req = app.llmRequest()
  const spec = req.offline ? t.offlineSpec : req.llm?.spec ?? ''

  const move = (i: number, d: -1 | 1) => {
    const next = [...chain]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    app.setFallback(next)
  }

  const add = () => {
    const id = (addChoice || addable[0]?.id) as ProviderId | undefined
    if (!id) return
    const next = [...chain, id]
    app.setFallback(next)
    setAddChoice('')
    const p = providerById(primary)
    const specStr = [p && p.id !== 'offline' ? app.specFor(p.id) : null, ...next.map((n) => app.specFor(n))].filter(Boolean).join(',')
    g.done('fallback', t.explain.fallback(specStr))
  }

  const test = async () => {
    if (testing) return
    setTesting(true)
    setErr(null)
    setTestInfo('')
    app.setConnection('testing')
    const out = await bridge.run({ lab: 'ping', ...app.llmRequest() })
    setTesting(false)
    if (out.ok) {
      const r = out.result as { reply: string; ms: number }
      app.setConnection('ok')
      setTestInfo(t.testOk(r.reply || 'pong', r.ms))
      g.explain(t.explain.test(r.reply || 'pong', r.ms))
    } else {
      app.setConnection('error')
      setErr(out.error)
    }
  }

  const resetProgress = () => {
    if (!window.confirm(t.confirmReset)) return
    local.remove('guide')
    local.remove('history')
    window.location.reload()
  }

  const prim = providerById(primary)

  return (
    <div id="main" className="page col" style={{ gap: 20 }}>
      <div className="col" style={{ gap: 4 }}>
        <h1 className="h1">{t.title}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
      </div>

      <div className="settings-grid">
        <div className="col" style={{ gap: 16 }}>
          <section className="panel col" style={{ gap: 12 }} aria-labelledby="llm-h">
            <h2 id="llm-h" className="h2">{t.llmTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.llmSub}</p>
            <label htmlFor="primary" className="label">{t.primary}</label>
            <select id="primary" className="input" value={primary ?? ''} onChange={(e) => app.setProvider((e.target.value || null) as ProviderId | null)}>
              {primary === null && <option value="">-</option>}
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.id !== 'offline' ? ` (${app.modelFor(p.id)})` : ''}
                </option>
              ))}
            </select>

            {prim && prim.id !== 'offline' && (
              <>
                <label htmlFor="model" className="label">{t.modelLabel}</label>
                <input id="model" className="input mono" spellCheck={false} value={app.modelFor(prim.id)} onChange={(e) => app.setModel(prim.id, e.target.value)} />
                <span className="muted" style={{ fontSize: 12 }}>{t.modelHelp(prim.model)}</span>
              </>
            )}
            <h3 style={{ fontSize: 16, marginTop: 6 }}>{t.chainTitle}</h3>
            <ol className="chain-list">
              {prim && prim.id !== 'offline' && <ChainRow name={prim.name} spec={app.specFor(prim.id)} badge={t.primaryBadge} primary hasKey={!!app.keys[prim.id]} noKey={t.noKey} />}
              {chain.map((id, i) => {
                const p = providerById(id)!
                return (
                  <ChainRow key={id} name={p.name} spec={app.specFor(id)} badge={`${t.fallbackBadge} ${i + 1}`} hasKey={!!app.keys[id]} noKey={t.noKey}>
                    <button type="button" className="btn btn-sm al-icon-btn" aria-label={`${t.up}: ${p.name}`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <Icon name="up" size={16} />
                    </button>
                    <button type="button" className="btn btn-sm al-icon-btn" aria-label={`${t.down}: ${p.name}`} disabled={i === chain.length - 1} onClick={() => move(i, 1)}>
                      <Icon name="down" size={16} />
                    </button>
                    <button type="button" className="btn btn-sm al-icon-btn" aria-label={`${t.remove}: ${p.name}`} onClick={() => app.setFallback(chain.filter((c) => c !== id))}>
                      <Icon name="close" size={16} />
                    </button>
                  </ChainRow>
                )
              })}
            </ol>
            {!chain.length && <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.chainEmpty}</p>}
            <Tip show={g.is('fallback')}>{t.tipFallback}</Tip>
            {addable.length ? (
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label htmlFor="add-fb" className="visually-hidden">{t.addFallback}</label>
                <select id="add-fb" className="input" style={{ width: 'auto', minWidth: 180 }} value={addChoice || addable[0].id} onChange={(e) => setAddChoice(e.target.value as ProviderId)}>
                  {addable.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button type="button" className={`btn ${g.pulse('fallback')}`} onClick={add}>{t.addFallback}</button>
              </div>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>{t.noMore}</span>
            )}
            <div className="col" style={{ gap: 4 }}>
              <span className="label">{t.specLabel}</span>
              <code className="spec-box">{spec}</code>
            </div>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-outline" disabled={testing || !primary} onClick={test}>
                {testing && <span className="spinner" />}
                {testing ? t.testing : t.test}
              </button>
              <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{testInfo}</span>
            </div>
            {err && (
              <LabError
                error={err}
                onOffline={() => {
                  app.setProvider('offline')
                  app.setConnection('ok')
                  setErr(null)
                }}
              />
            )}
          </section>

          <section className="panel col" style={{ gap: 10 }} aria-labelledby="keys-h">
            <h2 id="keys-h" className="h2">{t.keysTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.keysSub}</p>
            {app.presenterMask && <span style={{ fontSize: 12, color: 'var(--amber)' }}>{t.maskedByPresenter}</span>}
            {KEYED.map((p) => (
              <KeyRow key={p.id} id={p.id} label={`${p.name} API key`} placeholder={`${p.name} API key`} keyUrl={p.keyUrl} />
            ))}
          </section>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <section className="panel col" style={{ gap: 10 }} aria-labelledby="tav-h">
            <h2 id="tav-h" className="h2">{t.tavilyTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.tavilySub}</p>
            <KeyRow id="tavily" label="Tavily API key" placeholder="tvly-..." keyUrl="https://app.tavily.com/" />
          </section>

          <section className="panel col" style={{ gap: 10 }} aria-labelledby="lang-h">
            <h2 id="lang-h" className="h2">{t.langTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.langSub}</p>
            <Seg<Lang> label={t.langTitle} value={app.lang} onChange={app.setLang} options={[{ value: 'hi', label: 'Hinglish' }, { value: 'en', label: 'English' }]} />
          </section>

          <section className="panel col" style={{ gap: 10 }} aria-labelledby="roles-h">
            <h2 id="roles-h" className="h2">{t.rolesTitle}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.rolesSub}</p>
            <Tip show={g.is('role')}>{t.tipRole}</Tip>
            {ROLES.map((role) => (
              <div key={role} className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <label htmlFor={`role-${role}`} style={{ width: 110, fontSize: 14, fontWeight: 600 }}>{t.roles[role]}</label>
                <select
                  id={`role-${role}`}
                  className={`input mono ${role === 'writer' ? g.pulse('role') : ''}`}
                  style={{ flex: 1, minWidth: 200, fontSize: 13 }}
                  value={app.roleModels[role] ?? ''}
                  onChange={(e) => {
                    app.setRoleModel(role, e.target.value)
                    if (e.target.value) g.done('role', t.explain.role(t.roles[role], e.target.value))
                  }}
                >
                  <option value="">{t.usePrimary}</option>
                  {KEYED.map((p) => (
                    <option key={p.id} value={app.specFor(p.id)}>{app.specFor(p.id)}</option>
                  ))}
                </select>
              </div>
            ))}
          </section>

          <section className="panel col" style={{ gap: 8 }} aria-labelledby="priv-h">
            <h2 id="priv-h" className="h2">{t.privacyTitle}</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3)' }}>
              {t.privacy.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>

          <section className="panel col" style={{ gap: 10 }} aria-labelledby="reset-h">
            <h2 id="reset-h" className="h2">{t.dangerTitle}</h2>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  app.clearKeys()
                  g.explain(t.explain.cleared)
                }}
              >
                {t.clearKeys}
              </button>
              <button type="button" className="btn" onClick={resetProgress}>{t.resetProgress}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ChainRow({ name, spec, badge, hasKey, noKey, primary, children }: { name: string; spec: string; badge: string; hasKey: boolean; noKey: string; primary?: boolean; children?: ReactNode }) {
  return (
    <li className="chain-row">
      <span className={`badge ${primary ? 'badge-teal' : 'badge-gray'}`}>{badge}</span>
      <span style={{ fontWeight: 600 }}>{name}</span>
      <span className="mono chain-spec">{spec}</span>
      {!hasKey && <span className="badge badge-amber">{noKey}</span>}
      {children}
    </li>
  )
}

function KeyRow({ id, label, placeholder, keyUrl }: { id: string; label: string; placeholder: string; keyUrl?: string }) {
  const app = useApp()
  const t = useT(settingsDict)
  const current = app.keys[id] ?? ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [shown, setShown] = useState(false)
  const inputId = `key-${id}`
  const visible = shown && !app.presenterMask
  return (
    <div className="col key-row">
      <label htmlFor={inputId} className="label" style={{ fontWeight: 600, color: 'var(--ink)' }}>{label}</label>
      {editing ? (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input id={inputId} className="input mono" type="password" autoComplete="off" spellCheck={false} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={draft.trim().length < 8}
            onClick={() => {
              app.setKey(id, draft)
              setEditing(false)
              setDraft('')
            }}
          >
            {t.save}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setEditing(false)
              setDraft('')
            }}
          >
            {t.cancel}
          </button>
        </div>
      ) : (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <output id={inputId} className="mono" style={{ flex: 1, minWidth: 160, fontSize: 13, color: current ? 'var(--ink)' : 'var(--muted)', wordBreak: 'break-all' }}>
            {current ? (visible ? current : maskKey(current)) : t.noKey}
          </output>
          {current && !app.presenterMask && (
            <button type="button" className="btn btn-sm" aria-pressed={shown} onClick={() => setShown((v) => !v)}>
              {shown ? t.hide : t.show}
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={() => setEditing(true)}>{t.edit}</button>
          {current && (
            <button type="button" className="btn btn-sm" onClick={() => app.setKey(id, '')}>{t.remove}</button>
          )}
          {keyUrl && (
            <a href={keyUrl} target="_blank" rel="noopener noreferrer" className="row" style={{ gap: 4, fontSize: 13 }}>
              {t.getKey} <Icon name="external" size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
