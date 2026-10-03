// Answers written on the Resume page (with AI feedback), kept so the user can come back and revise them.
// Signed in: users/{uid}/resume/answers in Firestore (every device). Signed out: this browser only.
// The resume text itself never leaves the browser except to the AI.
import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { readLocal, useStore, writeLocal } from './store'

export interface Feedback {
  score: number
  verdict: string
  good: string[]
  improve: string[]
  better: string
}

export interface AnswerRecord {
  /** question text and its group, so "My answers" works even after the resume questions are regenerated */
  q: string
  group: string
  answer: string
  feedback?: Feedback
  /** earlier scores, oldest first */
  scores?: number[]
  at: number
}

export type AnswerMap = Record<string, AnswerRecord>

const LOCAL = 'hld.resume.answers2'

// First version kept { answer, feedback-markdown } per question in another key; keep the answers, drop the old free-text feedback
function migrateOld() {
  const old = readLocal<Record<string, { answer?: string }> | null>('hld.resume.answers', null)
  if (!old) return
  const questions = readLocal<{ questions?: { id: string; q: string; cat: string }[] } | null>('hld.resume', null)?.questions ?? []
  const all = readLocal<AnswerMap>(LOCAL, {})
  for (const [id, v] of Object.entries(old)) {
    const q = questions.find((x) => x.id === id)
    if (v.answer?.trim() && q && !all[id]) all[id] = { q: q.q, group: q.cat, answer: v.answer, at: Date.now() }
  }
  writeLocal(LOCAL, all)
  localStorage.removeItem('hld.resume.answers')
}

export function useResumeAnswers() {
  const { user } = useStore()
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    try {
      migrateOld()
    } catch {
      /* storage blocked */
    }
    return readLocal(LOCAL, {})
  })
  const timers = useRef<Record<string, number>>({})
  const ref = user && db ? doc(db, 'users', user.uid, 'resume', 'answers') : null
  const refPath = ref?.path

  useEffect(() => {
    if (!user || !db) {
      setAnswers(readLocal(LOCAL, {}))
      return
    }
    const r = doc(db, 'users', user.uid, 'resume', 'answers')
    // Answers written while logged out move into the account once
    const local = readLocal<AnswerMap>(LOCAL, {})
    if (Object.keys(local).length) {
      setDoc(r, { a: local }, { merge: true })
        .then(() => writeLocal(LOCAL, {}))
        .catch(() => {})
    }
    return onSnapshot(r, (snap) => setAnswers((snap.data()?.a as AnswerMap) ?? {}))
  }, [user])

  const persist = useCallback(
    (id: string, rec: AnswerRecord | null, delay = 0) => {
      window.clearTimeout(timers.current[id])
      const run = () => {
        if (refPath && db) setDoc(doc(db, refPath), { a: { [id]: rec ?? deleteField() } }, { merge: true }).catch(() => {})
        else {
          const all = readLocal<AnswerMap>(LOCAL, {})
          if (rec) all[id] = rec
          else delete all[id]
          writeLocal(LOCAL, all)
        }
      }
      if (delay) timers.current[id] = window.setTimeout(run, delay)
      else run()
    },
    [refPath],
  )

  /** Typing: update the screen now, save after a short pause */
  const setAnswer = (id: string, q: string, group: string, answer: string) => {
    const prev = answers[id]
    const rec: AnswerRecord = { ...prev, q, group, answer, at: Date.now() }
    setAnswers((a) => ({ ...a, [id]: rec }))
    persist(id, rec, 800)
  }

  const setFeedback = (id: string, feedback: Feedback) => {
    const prev = answers[id]
    if (!prev) return
    const scores = prev.feedback ? [...(prev.scores ?? []), prev.feedback.score].slice(-9) : prev.scores
    const rec: AnswerRecord = { ...prev, feedback, scores, at: Date.now() }
    setAnswers((a) => ({ ...a, [id]: rec }))
    persist(id, rec)
  }

  const removeAnswer = (id: string) => {
    setAnswers((a) => {
      const next = { ...a }
      delete next[id]
      return next
    })
    persist(id, null)
  }

  return { answers, setAnswer, setFeedback, removeAnswer }
}
