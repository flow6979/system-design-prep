import { useState } from 'react'
import { useTr } from '../i18n'
import { DEFAULT_MODEL, getGeminiSettings, listModels, saveGeminiSettings } from '../gemini'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const tr = useTr()
  const initial = getGeminiSettings()
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [model, setModel] = useState(initial.model || DEFAULT_MODEL)
  const [show, setShow] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [modelMsg, setModelMsg] = useState('')

  async function loadModels() {
    if (!apiKey.trim()) {
      setModelMsg(tr('Pehle key daalo.', 'Add a key first.'))
      return
    }
    setModelMsg(tr('Models load ho rahe hain…', 'Loading models…'))
    try {
      const list = await listModels(apiKey.trim())
      setModels(list)
      setModelMsg(
        list.length
          ? tr(`${list.length} models mile. Neeche list se chuno.`, `Found ${list.length} models. Pick one below.`)
          : tr('Is key pe koi text model nahi mila.', 'No text models found for this key.'),
      )
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
          <button className="icon-btn" onClick={onClose} aria-label={tr('Band karo', 'Close')}>
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
              {show ? tr('Chhupao', 'Hide') : tr('Dikhao', 'Show')}
            </button>
          </div>
          <p className="muted small">
            {tr(
              'Key sirf is browser me save hoti hai. Ye kisi server, Firestore ya repo me nahi jaati. Free key yahan milegi:',
              'The key is saved only in this browser. It never goes to any server, Firestore or the repo. Get a free key at',
            )}{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>
          </p>
          <label htmlFor="gemini-model">Model</label>
          <div className="row">
            <input id="gemini-model" list="gemini-models" value={model} onChange={(e) => setModel(e.target.value)} />
            <button className="btn" type="button" onClick={loadModels}>
              {tr('Models dikhao', 'Show models')}
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
              tr(
                `Default: ${DEFAULT_MODEL}. Ye hamesha Google ke latest Flash model pe chalta hai. Model na mile to site khud koi available model chun leti hai.`,
                `Default: ${DEFAULT_MODEL}. It always points to Google's latest Flash model. If a model is unavailable, the site picks one your key can use.`,
              )}
          </p>
          <div className="row end">
            {apiKey && (
              <button className="btn" type="button" onClick={() => setApiKey('')}>
                {tr('Key hatao', 'Remove key')}
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
