import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { Bytes, arrayRemove, arrayUnion, deleteDoc, deleteField, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseEnabled } from './firebase'

type Progress = Record<string, boolean>

/** Quiz results kept small: a = question id → 1 right / 0 wrong (last attempt), s = starred ids */
export interface QuizState {
  a: Record<string, 0 | 1>
  s: string[]
}
const LOCAL_QUIZ = 'hld.quiz.state'

export interface Profile {
  /** yyyy-mm-dd; shows a countdown on the dashboard */
  interviewDate?: string
  /** personal study plan inputs (Plan tab) */
  plan?: { tracks: ('hld' | 'lld' | 'java' | 'db' | 'cs' | 'beh' | 'agents')[]; hours: number; level: 'junior' | 'mid' | 'senior'; days?: number }
}

interface Store {
  user: User | null
  authReady: boolean
  progress: Progress
  profile: Profile
  saveProfile: (p: Profile) => Promise<void>
  quiz: QuizState
  answerQuiz: (id: string, correct: boolean) => void
  starQuiz: (id: string, starred: boolean) => void
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

// ---- Note storage: keep Firestore documents small ----------------------------------
// Long notes are deflate-compressed into a bytes field (about half the size); short ones stay
// plain text because compression would make them bigger. Empty notes delete the document.
const COMPRESS_FROM = 200

async function pack(text: string): Promise<{ text: string } | { z: Bytes }> {
  if (text.length < COMPRESS_FROM || typeof CompressionStream === 'undefined') return { text }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const packed = new Uint8Array(await new Response(stream).arrayBuffer())
  return packed.length < new TextEncoder().encode(text).length ? { z: Bytes.fromUint8Array(packed) } : { text }
}

async function unpack(data: { text?: string; z?: Bytes } | undefined): Promise<string> {
  if (!data) return ''
  if (data.z) {
    const stream = new Blob([data.z.toUint8Array() as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return new Response(stream).text()
  }
  return data.text ?? ''
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!firebaseEnabled)
  const [progress, setProgress] = useState<Progress>(() => readLocal(LOCAL_PROGRESS, {}))
  // Last text written per note, so unchanged notes are never written again
  const savedNotes = useRef(new Map<string, string>())
  const [profile, setProfile] = useState<Profile>(() => readLocal('hld.profile', {}))
  const [quiz, setQuiz] = useState<QuizState>(() => readLocal(LOCAL_QUIZ, { a: {}, s: [] }))

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
      setProfile(readLocal('hld.profile', {}))
      setQuiz(readLocal(LOCAL_QUIZ, { a: {}, s: [] }))
      return
    }
    savedNotes.current.clear()
    const ref = doc(db, 'users', user.uid)
    const local = readLocal<Progress>(LOCAL_PROGRESS, {})
    const pending = Object.fromEntries(Object.entries(local).filter(([, v]) => v))
    if (Object.keys(pending).length) {
      setDoc(ref, { progress: pending }, { merge: true })
        .then(() => writeLocal(LOCAL_PROGRESS, {}))
        .catch(() => {})
    }
    // Quiz answers and stars made while logged out move into the account once
    const localQuiz = readLocal<QuizState>(LOCAL_QUIZ, { a: {}, s: [] })
    if (Object.keys(localQuiz.a).length || localQuiz.s.length) {
      setDoc(ref, { quiz: { a: localQuiz.a, ...(localQuiz.s.length ? { s: arrayUnion(...localQuiz.s) } : {}) } }, { merge: true })
        .then(() => writeLocal(LOCAL_QUIZ, { a: {}, s: [] }))
        .catch(() => {})
    }
    return onSnapshot(ref, (snap) => {
      const stored = (snap.data()?.progress as Progress) ?? {}
      // Older saves kept unticked items as `false`; drop them once to shrink the document
      const stale = Object.keys(stored).filter((k) => !stored[k])
      if (stale.length) setDoc(ref, { progress: Object.fromEntries(stale.map((k) => [k, deleteField()])) }, { merge: true }).catch(() => {})
      setProgress(Object.fromEntries(Object.entries(stored).filter(([, v]) => v)))
      setProfile((snap.data()?.profile as Profile) ?? {})
      const q = snap.data()?.quiz as Partial<QuizState> | undefined
      setQuiz({ a: q?.a ?? {}, s: q?.s ?? [] })
    })
  }, [user])

  const toggle = useCallback(
    (id: string, done: boolean) => {
      // Only ticked items are stored; unticking removes the entry instead of saving `false`
      setProgress((p) => {
        const next = { ...p }
        if (done) next[id] = true
        else delete next[id]
        if (!user) writeLocal(LOCAL_PROGRESS, next)
        return next
      })
      if (user && db) setDoc(doc(db, 'users', user.uid), { progress: { [id]: done ? true : deleteField() } }, { merge: true })
    },
    [user],
  )

  const loadNote = useCallback(
    async (slug: string) => {
      const text = user && db ? await unpack(await getDoc(doc(db, 'users', user.uid, 'notes', slug)).then((s) => s.data())) : readLocal(localNoteKey(slug), '')
      savedNotes.current.set(slug, text)
      return text
    },
    [user],
  )

  const saveNote = useCallback(
    async (slug: string, text: string) => {
      if (savedNotes.current.get(slug) === text) return
      const empty = !text.trim()
      if (user && db) {
        const ref = doc(db, 'users', user.uid, 'notes', slug)
        if (empty) await deleteDoc(ref)
        else await setDoc(ref, { ...(await pack(text)), updatedAt: serverTimestamp() })
      } else if (empty) {
        try {
          localStorage.removeItem(localNoteKey(slug))
        } catch {
          /* storage blocked */
        }
      } else {
        writeLocal(localNoteKey(slug), text)
      }
      savedNotes.current.set(slug, text)
    },
    [user],
  )

  const saveProfile = useCallback(
    async (p: Profile) => {
      setProfile(p)
      if (user && db) await setDoc(doc(db, 'users', user.uid), { profile: p }, { merge: true })
      else writeLocal('hld.profile', p)
    },
    [user],
  )

  const answerQuiz = useCallback(
    (id: string, correct: boolean) => {
      const v: 0 | 1 = correct ? 1 : 0
      setQuiz((q) => {
        const next = { ...q, a: { ...q.a, [id]: v } }
        if (!user) writeLocal(LOCAL_QUIZ, next)
        return next
      })
      if (user && db) setDoc(doc(db, 'users', user.uid), { quiz: { a: { [id]: v } } }, { merge: true }).catch(() => {})
    },
    [user],
  )

  const starQuiz = useCallback(
    (id: string, starred: boolean) => {
      setQuiz((q) => {
        const next = { ...q, s: starred ? [...new Set([...q.s, id])] : q.s.filter((x) => x !== id) }
        if (!user) writeLocal(LOCAL_QUIZ, next)
        return next
      })
      if (user && db) setDoc(doc(db, 'users', user.uid), { quiz: { s: starred ? arrayUnion(id) : arrayRemove(id) } }, { merge: true }).catch(() => {})
    },
    [user],
  )

  const logout = useCallback(async () => {
    if (auth) await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({ user, authReady, progress, profile, saveProfile, quiz, answerQuiz, starQuiz, toggle, loadNote, saveNote, logout }),
    [user, authReady, progress, profile, saveProfile, quiz, answerQuiz, starQuiz, toggle, loadNote, saveNote, logout],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
