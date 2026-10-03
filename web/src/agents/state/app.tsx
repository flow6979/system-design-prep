// App state for the Agentic AI labs.
//
// The LLM comes from Viewinter's central Gemini settings (top-bar key icon): with a key the labs run
// on Gemini, without one they use the offline demo (scripted answers). There is no separate setup here.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Lang } from '../i18n'
import { useLang } from '../../i18n'
import { useGemini } from '../../gemini'
import { providerById, type ProviderId } from '../lib/providers'
import { session } from '../lib/storage'
import type { LabRequest } from '../lib/worker'

export type Connection = 'none' | 'testing' | 'ok' | 'error'

export type AppState = {
  lang: Lang
  setLang: (l: Lang) => void
  provider: ProviderId | null
  /** Only 'offline' is a real choice now (presenter backup); anything else returns to the central key */
  setProvider: (p: ProviderId | null) => void
  keys: Partial<Record<string, string>>
  roleModels: Record<string, string>
  modelFor: (provider: string | null | undefined) => string
  specFor: (provider: string | null | undefined) => string
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
  const { lang, setLang } = useLang()
  const { settings, status } = useGemini()
  const [forceOffline, setForceOffline] = useState<boolean>(() => session.get('forceOffline', false))
  const [presenterMask, setPresenterMask] = useState(true)

  const hasKey = !!settings.apiKey
  const offline = forceOffline || !hasKey
  const provider: ProviderId = offline ? 'offline' : 'gemini'
  const keys = useMemo<Partial<Record<string, string>>>(() => (hasKey ? { gemini: settings.apiKey } : {}), [hasKey, settings.apiKey])
  const connection: Connection = offline || status?.state === 'ok' ? 'ok' : status?.state === 'error' ? 'error' : 'none'

  const setProvider = useCallback((p: ProviderId | null) => {
    const off = p === 'offline'
    setForceOffline(off)
    session.set('forceOffline', off)
  }, [])
  const setConnection = useCallback(() => {}, [])

  const modelFor = useCallback((id: string | null | undefined) => (id === 'gemini' ? settings.model : providerById(id)?.model ?? ''), [settings.model])
  const specFor = useCallback(
    (id: string | null | undefined) => {
      const p = providerById(id)
      if (!p || p.id === 'offline') return ''
      return `${p.id}:${modelFor(p.id)}`
    },
    [modelFor],
  )

  const llmRequest = useCallback((): Pick<LabRequest, 'llm' | 'offline' | 'lang'> => {
    if (offline) return { offline: true, lang }
    const gemini = providerById('gemini')
    return { offline: false, lang, llm: { spec: specFor('gemini'), keys: { gemini: settings.apiKey }, embed: gemini?.embed ?? 'local' } }
  }, [offline, lang, specFor, settings.apiKey])

  const value = useMemo<AppState>(
    () => ({ lang, setLang, provider, setProvider, keys, roleModels: {}, modelFor, specFor, connection, setConnection, offline, llmRequest, presenterMask, setPresenterMask }),
    [lang, setLang, provider, setProvider, keys, modelFor, specFor, connection, setConnection, offline, llmRequest, presenterMask],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside AppProvider')
  return v
}
