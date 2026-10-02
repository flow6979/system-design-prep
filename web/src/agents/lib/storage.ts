// Browser storage helpers. Private window / blocked storage mein bhi app crash na ho.
//   local   = baar baar kaam aane wali cheezein (language, progress, history)
//   session = API keys: tab band = gayab (kabhi localStorage mein mat daalna)
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const local = {
  get<T>(key: string, fallback: T): T {
    return safe(() => {
      const v = localStorage.getItem(`agentlab:${key}`)
      return v === null ? fallback : (JSON.parse(v) as T)
    }, fallback)
  },
  set(key: string, value: unknown) {
    safe(() => localStorage.setItem(`agentlab:${key}`, JSON.stringify(value)), undefined)
  },
  remove(key: string) {
    safe(() => localStorage.removeItem(`agentlab:${key}`), undefined)
  },
}

export const session = {
  get<T>(key: string, fallback: T): T {
    return safe(() => {
      const v = sessionStorage.getItem(`agentlab:${key}`)
      return v === null ? fallback : (JSON.parse(v) as T)
    }, fallback)
  },
  set(key: string, value: unknown) {
    safe(() => sessionStorage.setItem(`agentlab:${key}`, JSON.stringify(value)), undefined)
  },
  remove(key: string) {
    safe(() => sessionStorage.removeItem(`agentlab:${key}`), undefined)
  },
}
