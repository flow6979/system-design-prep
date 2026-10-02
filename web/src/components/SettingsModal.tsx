import { useState } from 'react'
import { DEFAULT_MODEL, getGeminiSettings, listModels, saveGeminiSettings } from '../gemini'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const initial = getGeminiSettings()
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [model, setModel] = useState(initial.model || DEFAULT_MODEL)
  const [show, setShow] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [modelMsg, setModelMsg] = useState('')

  async function loadModels() {
    if (!apiKey.trim()) {
      setModelMsg('Pehle key daalo.')
      return
    }
    setModelMsg('Models load ho rahe hain…')
    try {
      const list = await listModels(apiKey.trim())
      setModels(list)
      setModelMsg(list.length ? `${list.length} models mile. Neeche list se chuno.` : 'Is key pe koi text model nahi mila.')
    } catch (e) {
      setModelMsg((e as Error).message)
    }
  }

  function save() {
    saveGeminiSettings({ apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL })
    onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-head">
          <h2 id="settings-title">Gemini settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="form">
          <label htmlFor="gemini-key">Gemini API key</label>
          <div className="row">
            <input
              id="gemini-key"
              type={show ? 'text' : 'password'}
              placeholder="AIza…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <button className="btn" type="button" onClick={() => setShow((s) => !s)}>
              {show ? 'Chhupao' : 'Dikhao'}
            </button>
          </div>
          <p className="muted small">
            Key sirf is browser me save hoti hai. Ye kisi server, Firestore ya repo me nahi jaati. Free key{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>{' '}
            se milegi.
          </p>
          <label htmlFor="gemini-model">Model</label>
          <div className="row">
            <input id="gemini-model" list="gemini-models" value={model} onChange={(e) => setModel(e.target.value)} />
            <button className="btn" type="button" onClick={loadModels}>
              Models dikhao
            </button>
          </div>
          <datalist id="gemini-models">
            {[DEFAULT_MODEL, ...models.filter((m) => m !== DEFAULT_MODEL)].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {models.length > 0 && (
            <div className="model-list">
              {[DEFAULT_MODEL, ...models.filter((m) => m !== DEFAULT_MODEL)].map((m) => (
                <button key={m} type="button" className={`chip ${m === model ? 'on' : ''}`} onClick={() => setModel(m)}>
                  {m}
                </button>
              ))}
            </div>
          )}
          <p className="muted small">
            {modelMsg ||
              `Default: ${DEFAULT_MODEL}. Ye hamesha Google ke latest Flash model pe chalta hai. Model na mile to site khud koi available model chun leti hai.`}
          </p>
          <div className="row end">
            {apiKey && (
              <button className="btn" type="button" onClick={() => setApiKey('')}>
                Key hatao
              </button>
            )}
            <button className="btn primary" type="button" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
