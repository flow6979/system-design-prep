// App state: language, LLM connection, keys. Poori app isi context se padhti hai.
//
// Keys: sessionStorage mein (tab band = gayab). Baaki (language, provider choice, fallback order): localStorage.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Lang } from '../i18n'
import { useLang } from '../../i18n'
import { getGeminiSettings } from '../../gemini'
import { providerById, type ProviderId } from '../lib/providers'
import { local, session } from '../lib/storage'
import type { LabRequest } from '../lib/worker'

export type Connection = 'none' | 'testing' | 'ok' | 'error'

export type AppState = {
  lang: Lang
  setLang: (l: Lang) => void
  provider: ProviderId | null
  setProvider: (p: ProviderId | null) => void
  keys: Partial<Record<string, string>>
  setKey: (provider: string, key: string) => void
  clearKeys: () => void
  fallback: ProviderId[] // extra providers after primary, e.g. ['gemini']
  setFallback: (f: ProviderId[]) => void
  roleModels: Record<string, string> // multi-agent: role -> spec
  models: Record<string, string> // provider -> model override (e.g. gemini -> gemini-3.8-flash)
  setModel: (provider: string, model: string) => void
  modelFor: (provider: string | null | undefined) => string
  specFor: (provider: string | null | undefined) => string
  setRoleModel: (role: string, spec: string) => void
  connection: Connection
  setConnection: (c: Connection) => void
  offline: boolean
  /** Lab request ka `llm` + `offline` hissa, current settings se. */
  llmRequest: () => Pick<LabRequest, 'llm' | 'offline' | 'lang'>
  presenterMask: boolean
  setPresenterMask: (v: boolean) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  // Language is shared with the rest of Viewinter (top-bar switch)
  const { lang, setLang } = useLang()
  // The Gemini key saved in Viewinter settings is reused here, so labs work without entering it again
  const sharedGemini = getGeminiSettings().apiKey
  const [provider, setProviderS] = useState<ProviderId | null>(() =>
    local.get<ProviderId | null>('provider', sharedGemini ? 'gemini' : null),
  )
  const [keys, setKeys] = useState<Partial<Record<string, string>>>(() => {
    const saved = session.get<Partial<Record<string, string>>>('keys', {})
    return sharedGemini && !saved.gemini ? { ...saved, gemini: sharedGemini } : saved
  })
  const [fallback, setFallbackS] = useState<ProviderId[]>(() => local.get<ProviderId[]>('fallback', []))
  const [roleModels, setRoleModels] = useState<Record<string, string>>(() => local.get('roleModels', {}))
  const [models, setModels] = useState<Record<string, string>>(() => local.get('models', {}))
  const [connection, setConnection] = useState<Connection>(() => (session.get('connected', false) ? 'ok' : 'none'))
  const [presenterMask, setPresenterMask] = useState(true)

  const setProvider = useCallback((p: ProviderId | null) => {
    setProviderS(p)
    local.set('provider', p)
    setConnection('none')
    session.set('connected', false)
  }, [])
  const setKey = useCallback((p: string, k: string) => {
    setKeys((prev) => {
      const next = { ...prev, [p]: k.trim() }
      session.set('keys', next)
      return next
    })
  }, [])
  const clearKeys = useCallback(() => {
    setKeys({})
    session.remove('keys')
    setConnection('none')
    session.set('connected', false)
  }, [])
  const setFallback = useCallback((f: ProviderId[]) => {
    setFallbackS(f)
    local.set('fallback', f)
  }, [])
  const setRoleModel = useCallback((role: string, spec: string) => {
    setRoleModels((prev) => {
      const next = { ...prev, [role]: spec }
      if (!spec) delete next[role]
      local.set('roleModels', next)
      return next
    })
  }, [])
  const setModel = useCallback((prov: string, model: string) => {
    setModels((prev) => {
      const next = { ...prev, [prov]: model.trim() }
      if (!model.trim()) delete next[prov]
      local.set('models', next)
      return next
    })
    setConnection('none')
    session.set('connected', false)
  }, [])
  // Provider kabhi bhi purana model band kar sakta hai; user ka override default se upar
  const modelFor = useCallback((id: string | null | undefined) => (id && models[id]) || providerById(id)?.model || '', [models])
  const specFor = useCallback((id: string | null | undefined) => {
    const p = providerById(id)
    if (!p || p.id === 'offline') return ''
    return `${p.id}:${modelFor(p.id)}`
  }, [modelFor])
  const setConn = useCallback((c: Connection) => {
    setConnection(c)
    session.set('connected', c === 'ok')
  }, [])

  const offline = provider === 'offline' || provider === null
  const llmRequest = useCallback((): Pick<LabRequest, 'llm' | 'offline' | 'lang'> => {
    if (offline) return { offline: true, lang }
    const chain = [provider!, ...fallback.filter((f) => f !== provider && f !== 'offline')]
    const specs = chain.map((id) => specFor(id)).filter(Boolean)
    const primary = providerById(provider)
    const embedProvider = chain.map((id) => providerById(id)).find((p) => p?.embed && keys[p.id])
    // Saari saved keys bhejo: multi-agent mein koi role (e.g. Writer) chain se bahar ke provider pe ho sakta hai.
    // get_llm() har spec ke provider ki key hi uthata hai, isliye extra keys kahin aur nahi jaati.
    const k: Record<string, string> = {}
    for (const [id, v] of Object.entries(keys)) if (v && id !== 'tavily') k[id] = v
    return { offline: false, lang, llm: { spec: specs.join(','), keys: k, embed: embedProvider?.embed ?? (primary?.embed && keys[primary.id] ? primary.embed : 'local') } }
  }, [offline, provider, fallback, keys, lang, specFor])

  const value = useMemo<AppState>(
    () => ({ lang, setLang, provider, setProvider, keys, setKey, clearKeys, fallback, setFallback, roleModels, setRoleModel, models, setModel, modelFor, specFor, connection, setConnection: setConn, offline, llmRequest, presenterMask, setPresenterMask }),
    [lang, setLang, provider, setProvider, keys, setKey, clearKeys, fallback, setFallback, roleModels, setRoleModel, models, setModel, modelFor, specFor, connection, setConn, offline, llmRequest, presenterMask],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside AppProvider')
  return v
}
