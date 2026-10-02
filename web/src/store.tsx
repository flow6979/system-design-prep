import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseEnabled } from './firebase'

type Progress = Record<string, boolean>

interface Store {
  user: User | null
  authReady: boolean
  progress: Progress
  toggle: (id: string, done: boolean) => void
  loadNote: (slug: string) => Promise<string>
  saveNote: (slug: string, text: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)

const LOCAL_PROGRESS = 'hld.progress'
const localNoteKey = (slug: string) => `hld.note.${slug}`

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage blocked: data stays in memory for this session */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!firebaseEnabled)
  const [progress, setProgress] = useState<Progress>(() => readLocal(LOCAL_PROGRESS, {}))

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
  }, [])

  // Signed in: progress lives in users/{uid}. Ticks made while logged out are merged in once.
  useEffect(() => {
    if (!user || !db) {
      setProgress(readLocal(LOCAL_PROGRESS, {}))
      return
    }
    const ref = doc(db, 'users', user.uid)
    const local = readLocal<Progress>(LOCAL_PROGRESS, {})
    const pending = Object.fromEntries(Object.entries(local).filter(([, v]) => v))
    if (Object.keys(pending).length) {
      setDoc(ref, { progress: pending }, { merge: true })
        .then(() => writeLocal(LOCAL_PROGRESS, {}))
        .catch(() => {})
    }
    return onSnapshot(ref, (snap) => setProgress((snap.data()?.progress as Progress) ?? {}))
  }, [user])

  const toggle = useCallback(
    (id: string, done: boolean) => {
      setProgress((p) => {
        const next = { ...p, [id]: done }
        if (!user) writeLocal(LOCAL_PROGRESS, next)
        return next
      })
      if (user && db) setDoc(doc(db, 'users', user.uid), { progress: { [id]: done } }, { merge: true })
    },
    [user],
  )

  const loadNote = useCallback(
    async (slug: string) => {
      if (user && db) {
        const snap = await getDoc(doc(db, 'users', user.uid, 'notes', slug))
        return (snap.data()?.text as string) ?? ''
      }
      return readLocal(localNoteKey(slug), '')
    },
    [user],
  )

  const saveNote = useCallback(
    async (slug: string, text: string) => {
      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'notes', slug), { text, updatedAt: serverTimestamp() })
      } else {
        writeLocal(localNoteKey(slug), text)
      }
    },
    [user],
  )

  const logout = useCallback(async () => {
    if (auth) await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, authReady, progress, toggle, loadNote, saveNote, logout }),
    [user, authReady, progress, toggle, loadNote, saveNote, logout],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
