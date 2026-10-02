import { useState, type FormEvent } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase'

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email ya password galat hai.',
  'auth/user-not-found': 'Is email se koi account nahi hai. Pehle account banao.',
  'auth/wrong-password': 'Password galat hai.',
  'auth/email-already-in-use': 'Is email se account pehle se hai. Login karo.',
  'auth/weak-password': 'Password kam se kam 6 characters ka hona chahiye.',
  'auth/invalid-email': 'Email sahi format me nahi hai.',
  'auth/popup-closed-by-user': 'Google login window band ho gayi. Dobara try karo.',
  'auth/unauthorized-domain': 'Ye domain Firebase me allowed nahi hai. Firebase console → Authentication → Settings → Authorized domains me add karo.',
}

const friendly = (e: unknown) => {
  const code = (e as { code?: string })?.code ?? ''
  return MESSAGES[code] ?? `Login nahi hua (${code || String(e)}).`
}

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await fn()
      onClose()
    } catch (e) {
      setError(friendly(e))
    } finally {
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!auth) return
    const a = auth
    run(() =>
      mode === 'login'
        ? signInWithEmailAndPassword(a, email, password)
        : createUserWithEmailAndPassword(a, email, password),
    )
  }

  async function reset() {
    if (!auth || !email) {
      setError('Pehle apna email upar daalo.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setInfo('Password reset link email pe bhej diya.')
      setError('')
    } catch (e) {
      setError(friendly(e))
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-head">
          <h2 id="auth-title">{mode === 'login' ? 'Login' : 'Account banao'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="muted">Login karne se aapke notes aur progress har device pe sync honge.</p>
        <button className="btn wide" disabled={busy} onClick={() => auth && run(() => signInWithPopup(auth!, new GoogleAuthProvider()))}>
          Google se continue karo
        </button>
        <div className="or">ya email se</div>
        <form onSubmit={submit} className="form">
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          {info && <p className="ok-text">{info}</p>}
          <button className="btn primary wide" type="submit" disabled={busy}>
            {busy ? 'Ruko…' : mode === 'login' ? 'Login' : 'Account banao'}
          </button>
        </form>
        <div className="modal-foot">
          {mode === 'login' ? (
            <>
              <button className="link" onClick={() => setMode('signup')}>
                Naya account banao
              </button>
              <button className="link" onClick={reset}>
                Password bhool gaye?
              </button>
            </>
          ) : (
            <button className="link" onClick={() => setMode('login')}>
              Account hai? Login karo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
