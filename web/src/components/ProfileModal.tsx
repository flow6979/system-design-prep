import { useState, type FormEvent } from 'react'
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useStore } from '../store'
import { useTr } from '../i18n'

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._@-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

const MESSAGES: Record<string, [string, string]> = {
  'auth/wrong-password': ['Purana password galat hai.', 'Current password is wrong.'],
  'auth/invalid-credential': ['Purana password galat hai.', 'Current password is wrong.'],
  'auth/weak-password': ['Naya password kam se kam 6 characters ka ho.', 'New password must be at least 6 characters.'],
  'auth/requires-recent-login': ['Security ke liye logout karke dobara login karo, phir try karo.', 'For security, log out and back in, then try again.'],
  'auth/too-many-requests': ['Bahut zyada try ho gaye. Thodi der baad try karo.', 'Too many attempts. Try again later.'],
}

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, profile, saveProfile, logout } = useStore()
  const tr = useTr()
  const [name, setName] = useState(user?.displayName ?? '')
  const [date, setDate] = useState(profile.interviewDate ?? '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  if (!user) return null
  const hasPassword = user.providerData.some((p) => p.providerId === 'password')
  const deleteWord = tr('DELETE', 'DELETE')

  const fail = (e: unknown) => {
    const code = (e as { code?: string })?.code ?? ''
    const m = MESSAGES[code]
    setMsg({ ok: false, text: m ? tr(m[0], m[1]) : tr(`Nahi hua (${code || String(e)}).`, `Something went wrong (${code || String(e)}).`) })
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault()
    setBusy('details')
    setMsg(null)
    try {
      if (name.trim() !== (user!.displayName ?? '')) await updateProfile(user!, { displayName: name.trim() || null })
      await saveProfile({ ...profile, interviewDate: date || undefined })
      setMsg({ ok: true, text: tr('Profile save ho gaya.', 'Profile saved.') })
    } catch (err) {
      fail(err)
    } finally {
      setBusy('')
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setBusy('password')
    setMsg(null)
    try {
      await reauthenticateWithCredential(user!, EmailAuthProvider.credential(user!.email ?? '', current))
      await updatePassword(user!, next)
      setCurrent('')
      setNext('')
      setMsg({ ok: true, text: tr('Password badal gaya.', 'Password changed.') })
    } catch (err) {
      fail(err)
    } finally {
      setBusy('')
    }
  }

  async function removeAccount() {
    setBusy('delete')
    setMsg(null)
    try {
      if (db) {
        const notes = await getDocs(collection(db, 'users', user!.uid, 'notes'))
        await Promise.all(notes.docs.map((d) => deleteDoc(d.ref)))
        await deleteDoc(doc(db, 'users', user!.uid))
      }
      await deleteUser(user!)
      onClose()
    } catch (err) {
      fail(err)
      setBusy('')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal profile" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="modal-head">
          <div className="row">
            <Avatar name={user.displayName || user.email || '?'} size={40} />
            <div className="profile-id">
              <h2 id="profile-title">{user.displayName || tr('Profile', 'Profile')}</h2>
              <span className="muted small">{user.email}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={tr('Band karo', 'Close')}>
            ×
          </button>
        </div>

        {msg && <p className={msg.ok ? 'ok-text small' : 'error small'}>{msg.text}</p>}

        <form className="form" onSubmit={saveDetails}>
          <label htmlFor="profile-name">{tr('Naam', 'Name')}</label>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} />
          <label htmlFor="profile-date">{tr('Interview kab hai?', 'Interview date')}</label>
          <input id="profile-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn primary" type="submit" disabled={busy === 'details'}>
            {busy === 'details' ? tr('Save ho raha hai…', 'Saving…') : 'Save'}
          </button>
        </form>

        {hasPassword && (
          <details className="profile-section">
            <summary>{tr('Password badlo', 'Change password')}</summary>
            <form className="form" onSubmit={changePassword}>
              <label htmlFor="profile-current">{tr('Purana password', 'Current password')}</label>
              <input id="profile-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
              <label htmlFor="profile-new">{tr('Naya password', 'New password')}</label>
              <input id="profile-new" type="password" autoComplete="new-password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} />
              <button className="btn" type="submit" disabled={busy === 'password'}>
                {tr('Password badlo', 'Change password')}
              </button>
            </form>
          </details>
        )}

        <details className="profile-section danger">
          <summary>{tr('Account delete karo', 'Delete account')}</summary>
          <p className="muted small">
            {tr('Saari progress aur notes hamesha ke liye mit jayenge.', 'All progress and notes are removed for good.')}{' '}
            {tr(`Confirm karne ke liye ${deleteWord} likho.`, `Type ${deleteWord} to confirm.`)}
          </p>
          <div className="row">
            <input id="profile-delete" className="grow" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} aria-label={deleteWord} />
            <button className="btn bad" onClick={removeAccount} disabled={confirmDelete !== deleteWord || busy === 'delete'}>
              {tr('Delete', 'Delete')}
            </button>
          </div>
        </details>

        <button
          className="btn wide"
          onClick={() => {
            logout()
            onClose()
          }}
        >
          {tr('Logout', 'Log out')}
        </button>
      </div>
    </div>
  )
}
