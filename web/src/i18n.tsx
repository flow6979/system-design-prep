import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readLocal, writeLocal } from './store'

export type Lang = 'hi' | 'en'
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hinglish' },
]

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'hi', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readLocal('hld.lang', 'hi'))
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writeLocal('hld.lang', l)
    document.documentElement.lang = l === 'en' ? 'en' : 'hi-Latn'
  }, [])
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** Inline bilingual strings: tr('Hinglish text', 'English text') */
export function useTr() {
  const { lang } = useContext(Ctx)
  return useCallback((hi: string, en: string) => (lang === 'en' ? en : hi), [lang])
}

export function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="seg small lang-switch" role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>
          <span className="hide-sm">{l.label}</span>
          <span className="show-sm">{l.id === 'en' ? 'EN' : 'HI'}</span>
        </button>
      ))}
    </div>
  )
}
