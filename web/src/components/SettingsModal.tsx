import { useState } from 'react'
import { DEFAULT_MODEL, getGeminiSettings, saveGeminiSettings } from '../gemini'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const initial = getGeminiSettings()
  const [apiKey, setApiKey] = useState(initial.apiKey)
  const [model, setModel] = useState(initial.model || DEFAULT_MODEL)
  const [show, setShow] = useState(false)

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
          <input id="gemini-model" value={model} onChange={(e) => setModel(e.target.value)} />
          <p className="muted small">Default: {DEFAULT_MODEL}. Koi naya model use karna ho to uska naam yahan likho.</p>
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
