// Run fail hua to kya dikhana hai. Kind handbook ke labapi.registry.classify_error se aata hai.
import { getGeminiSettings, openSettings, saveGeminiSettings } from '../../gemini'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { common } from '../i18n/common'
import type { LabError as LabErr } from '../lib/worker'
import { Icon } from './ui'

/** Provider 404 mein aksar naya model batata hai ("... use models/gemini-3.8-flash"). Use nikaalo. */
export function suggestedModel(error: LabErr): { provider: string; model: string } | null {
  if (error.kind !== 'not_found') return null
  const provider = /^(\w+)\s+HTTP/.exec(error.message)?.[1]
  const model = /use (?:models\/)?([a-z0-9][\w.-]*[a-z0-9])/i.exec(error.message)?.[1]
  return provider && model ? { provider: provider.toLowerCase(), model } : null
}

export function LabError({ error, onOffline }: { error: LabErr; onOffline?: () => void }) {
  const t = useT(common)
  const [switched, setSwitched] = useState<string | null>(null)
  const e = t.errors[error.kind] ?? t.errors.internal
  const suggestion = suggestedModel(error)
  return (
    <div role="alert" style={{ padding: 16, borderRadius: 12, background: 'var(--red-soft)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="row" style={{ gap: 8, color: 'var(--red)', fontWeight: 600 }}>
        <Icon name="warn" /> {e.title}
      </div>
      <div style={{ fontSize: 14 }}>{e.fix}</div>
      <code style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error.message}</code>
      {suggestion && suggestion.provider === 'gemini' && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => { saveGeminiSettings({ ...getGeminiSettings(), model: suggestion.model }); setSwitched(suggestion.model) }}>
            {t.useModel(suggestion.model)}
          </button>
          {switched && <span style={{ fontSize: 13 }}>{t.modelSwitched(switched)}</span>}
        </div>
      )}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" onClick={openSettings}>
          {t.settings}
        </button>
        {onOffline && (
          <button type="button" className="btn btn-sm" onClick={onOffline}>
            {t.offlineChip}
          </button>
        )}
        <Link className="btn btn-sm" to={`/agents/errors#${error.kind}`}>
          {t.errors.help}
        </Link>
      </div>
    </div>
  )
}
