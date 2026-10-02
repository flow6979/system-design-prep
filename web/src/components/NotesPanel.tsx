import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { firebaseEnabled } from '../firebase'
import { useTr } from '../i18n'

type Status = 'loading' | 'saved' | 'saving' | 'dirty' | 'error'

export function NotesPanel({ slug, onLogin }: { slug: string; onLogin: () => void }) {
  const { user, loadNote, saveNote } = useStore()
  const tr = useTr()
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
    loading: tr('Load ho raha hai…', 'Loading…'),
    dirty: tr('Likh rahe ho…', 'Typing…'),
    saving: tr('Save ho raha hai…', 'Saving…'),
    saved: user ? tr('Account me saved', 'Saved to your account') : tr('Is browser me saved', 'Saved in this browser'),
    error: tr('Save nahi hua. Internet check karo.', 'Could not save. Check your internet connection.'),
  }[status]

  return (
    <div className="panel-body notes">
      <textarea
        id={`notes-${slug}`}
        aria-label={tr('Is page ke notes', 'Notes for this page')}
        placeholder={tr(
          'Apne shabdon me likho: kya samjha, kya confusing hai, interview me kya bolna hai…',
          'Write in your own words: what you understood, what is confusing, what to say in the interview…',
        )}
        value={text}
        disabled={status === 'loading'}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="notes-foot">
        <span className={status === 'error' ? 'error small' : 'muted small'}>{label}</span>
        {!user && firebaseEnabled && (
          <button className="link small" onClick={onLogin}>
            {tr('Login karke sync karo', 'Log in to sync')}
          </button>
        )}
      </div>
    </div>
  )
}
