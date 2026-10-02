import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { firebaseEnabled } from '../firebase'

type Status = 'loading' | 'saved' | 'saving' | 'dirty' | 'error'

export function NotesPanel({ slug, onLogin }: { slug: string; onLogin: () => void }) {
  const { user, loadNote, saveNote } = useStore()
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('loading')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let alive = true
    setStatus('loading')
    loadNote(slug)
      .then((t) => alive && (setText(t), setStatus('saved')))
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [slug, loadNote])

  function onChange(value: string) {
    setText(value)
    setStatus('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      setStatus('saving')
      try {
        await saveNote(slug, value)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 800)
  }

  const label = {
    loading: 'Load ho raha hai…',
    dirty: 'Likh rahe ho…',
    saving: 'Save ho raha hai…',
    saved: user ? 'Account me saved' : 'Is browser me saved',
    error: 'Save nahi hua. Internet check karo.',
  }[status]

  return (
    <div className="panel-body notes">
      <textarea
        id={`notes-${slug}`}
        aria-label="Is page ke notes"
        placeholder="Apne shabdon me likho: kya samjha, kya confusing hai, interview me kya bolna hai…"
        value={text}
        disabled={status === 'loading'}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="notes-foot">
        <span className={status === 'error' ? 'error small' : 'muted small'}>{label}</span>
        {!user && firebaseEnabled && (
          <button className="link small" onClick={onLogin}>
            Login karke sync karo
          </button>
        )}
      </div>
    </div>
  )
}
