// Setup: language -> LLM -> key -> asli connection test (Pyodide mein labapi 'ping') -> Map.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LabError } from '../components/LabError'
import { Icon, StepBadge } from '../components/ui'
import { WorkerStatus } from '../components/WorkerStatus'
import { Tip, useGuide } from '../guide/guide'
import { useT, type Lang } from '../i18n'
import { setupDict } from '../i18n/pages/setup'
import { keyLooksLikeOther, PROVIDERS, providerById, type ProviderId } from '../lib/providers'
import { bridge, type LabError as LabErr } from '../lib/worker'
import { useApp } from '../state/app'

export default function Setup() {
  const app = useApp()
  const t = useT(setupDict)
  const navigate = useNavigate()
  const g = useGuide('setup', ['pick', 'key', 'test', 'enter'])
  const [showMore, setShowMore] = useState(false)
  const prov = providerById(app.provider)
  const [keyDraft, setKeyDraft] = useState(() => (app.provider ? app.keys[app.provider] ?? '' : ''))
  const [testing, setTesting] = useState(false)
  const [testInfo, setTestInfo] = useState<string>('')
  const [err, setErr] = useState<LabErr | null>(null)

  const isOffline = app.provider === 'offline'
  const keySaved = isOffline || (!!prov && !!app.keys[prov.id])
  const ready = app.connection === 'ok'

  const choose = (id: ProviderId) => {
    const p = providerById(id)!
    app.setProvider(id)
    setKeyDraft(app.keys[id] ?? '')
    setErr(null)
    setTestInfo('')
    g.done('pick', id === 'offline' ? t.explain.pickOffline : t.explain.pick(p.name, app.specFor(p.id)))
    if (id === 'offline') g.done('key')
  }

  const saveKey = () => {
    if (!prov || keyDraft.trim().length < 8) return
    app.setKey(prov.id, keyDraft)
    app.setConnection('none')
    g.done('key', t.explain.key)
  }

  const test = async () => {
    if (!keySaved || testing) return
    setTesting(true)
    setErr(null)
    setTestInfo('')
    app.setConnection('testing')
    const out = await bridge.run({ lab: 'ping', ...app.llmRequest() })
    setTesting(false)
    if (out.ok) {
      const r = out.result as { reply: string; ms: number; input_tokens: number; output_tokens: number }
      app.setConnection('ok')
      setTestInfo(isOffline ? 'ScriptedLLM ready' : t.pong(r.ms, r.input_tokens + r.output_tokens))
      g.done('test', t.explain.test(r.reply || 'pong', r.ms))
    } else {
      app.setConnection('error')
      setErr(out.error)
    }
  }

  const enter = () => {
    if (!ready) return
    g.done('enter', t.explain.enter)
    navigate('/agents/map')
  }

  const skipOffline = () => {
    app.setProvider('offline')
    app.setConnection('ok')
    navigate('/agents/map')
  }

  const otherProv = prov ? keyLooksLikeOther(prov.id, keyDraft) : null
  const cards = PROVIDERS.filter((p) => p.primary || showMore)

  return (
    <div id="main" className="page col" style={{ gap: 22, maxWidth: 1200 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h1">{t.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>{t.sub}</p>
        </div>
        <WorkerStatus />
      </div>


      <section className="col" style={{ gap: 10 }} aria-labelledby="s1">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <StepBadge n={1} done={!!prov} active={!prov} />
          <h2 id="s1" style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: 0 }}>{t.step1}</h2>
          <Tip show={g.is('pick')}>{t.tipPick}</Tip>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {cards.map((p) => {
            const sel = app.provider === p.id
            return (
              <button key={p.id} type="button" onClick={() => choose(p.id)} className={g.pulse('pick')} aria-pressed={sel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '18px 20px', minHeight: 150, borderRadius: 14, cursor: 'pointer', textAlign: 'left', background: sel ? 'var(--teal-bg)' : 'var(--panel)', border: `2px solid ${sel ? 'var(--teal)' : 'var(--line)'}` }}>
                <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{p.name}</span>
                  <span className={`badge ${sel ? '' : 'badge-gray'}`} style={sel ? { background: 'var(--teal)', color: 'var(--accent-ink)' } : undefined}>{sel ? t.chosen : t.choose}</span>
                </div>
                <span className="mono" style={{ fontSize: 13, color: 'var(--teal)' }}>{p.id === 'offline' ? 'ScriptedLLM' : app.specFor(p.id)}</span>
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.45 }}>{t.desc[p.id]}</span>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowMore((v) => !v)} aria-expanded={showMore}>
          {showMore ? t.less : t.more}
        </button>
      </section>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <section className="panel col" style={{ gap: 10, opacity: prov ? 1 : 0.55 }} aria-labelledby="s2">
          <div className="row" style={{ gap: 10 }}>
            <StepBadge n={2} done={keySaved} active={!!prov && !keySaved} />
            <h2 id="s2" style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: 0 }}>{t.step2}</h2>
          </div>
          <Tip show={g.is('key')}>{t.tipKey}</Tip>
          {isOffline ? (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.offlineNoKey}</p>
          ) : (
            <>
              <label htmlFor="api-key" className="label">
                {prov ? `${prov.name} API key` : t.pickFirst}
              </label>
              <div className="row" style={{ gap: 10 }}>
                <input id="api-key" className="input mono" type="password" autoComplete="off" spellCheck={false} disabled={!prov} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveKey()} placeholder={prov ? `${prov.name} API key` : ''} />
                <button type="button" className={`btn btn-primary ${g.pulse('key')}`} disabled={!prov || keyDraft.trim().length < 8} onClick={saveKey}>
                  {prov && app.keys[prov.id] === keyDraft.trim() && keyDraft ? t.saved : t.saveKey}
                </button>
              </div>
              {otherProv && <span style={{ fontSize: 12, color: 'var(--amber)' }}>{t.keyWarn(otherProv.name)}</span>}
              {prov && (
                <div className="col" style={{ gap: 4 }}>
                  <label htmlFor="model-name" className="label">{t.modelLabel}</label>
                  <input id="model-name" className="input mono" spellCheck={false} value={app.modelFor(prov.id)} onChange={(e) => app.setModel(prov.id, e.target.value)} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.modelHelp}</span>
                </div>
              )}
              {prov?.keyUrl && (
                <a href={prov.keyUrl} target="_blank" rel="noopener noreferrer" className="row" style={{ gap: 6, fontSize: 13 }}>
                  {t.getKey} <Icon name="external" size={14} />
                </a>
              )}
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.keyNote}</span>
            </>
          )}
        </section>

        <section className="panel col" style={{ gap: 10, opacity: keySaved ? 1 : 0.55 }} aria-labelledby="s3">
          <div className="row" style={{ gap: 10 }}>
            <StepBadge n={3} done={ready} active={keySaved && !ready} />
            <h2 id="s3" style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: 0 }}>{t.step3}</h2>
          </div>
          <Tip show={g.is('test')}>{t.tipTest}</Tip>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-outline ${g.pulse('test')}`} disabled={!keySaved || testing} onClick={test}>
              {testing && <span className="spinner" />}
              {testing ? t.testing : ready ? t.retest : t.test}
            </button>
            <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{testInfo}</span>
          </div>
          {err && <LabError error={err} onOffline={skipOffline} />}
          <Tip show={g.is('enter')}>{t.tipEnter}</Tip>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-primary btn-lg ${g.pulse('enter')}`} disabled={!ready} onClick={enter}>
              {t.enter} <Icon name="arrow" />
            </button>
            {!ready && (
              <button type="button" className="btn" onClick={skipOffline}>
                {t.skipOffline}
              </button>
            )}
          </div>
        </section>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.tavily}</p>
    </div>
  )
}

function optStyle(on: boolean): React.CSSProperties {
  return { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 16px', minWidth: 170, borderRadius: 10, cursor: 'pointer', fontSize: 15, background: on ? 'var(--teal-bg)' : 'var(--panel)', border: `2px solid ${on ? 'var(--teal)' : 'var(--line)'}` }
}
