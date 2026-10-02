// i18n: har page apni dictionary rakhta hai (src/i18n/pages/<page>.ts) taaki files clash na karein.
//
//   const t = useT(dict)        // dict = { hi: {...}, en: {...} }
//   t.title                     // current language ka string
//
// Rule: Hinglish = Roman Hindi + English mix (jaise hum baat karte hain). English = saaf, simple.
// Dono mein em-dash mat use karo.
import { useApp } from '../state/app'

export type Lang = 'hi' | 'en'
export type Dict<T> = { hi: T; en: T }

export function useT<T>(dict: Dict<T>): T {
  const { lang } = useApp()
  return dict[lang]
}

/** Chhote inline strings ke liye: pick({hi: '...', en: '...'}) */
export function usePick() {
  const { lang } = useApp()
  return <T,>(v: Dict<T>): T => v[lang]
}
