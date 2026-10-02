import { useState, type FormEvent } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useTr } from '../i18n'

const MESSAGES: Record<string, [string, string]> = {
  'auth/invalid-credential': ['Email ya password galat hai.', 'Wrong email or password.'],
  'auth/user-not-found': ['Is email se koi account nahi hai. Pehle account banao.', 'No account with this email. Create one first.'],
  'auth/wrong-password': ['Password galat hai.', 'Wrong password.'],
  'auth/email-already-in-use': ['Is email se account pehle se hai. Login karo.', 'An account with this email already exists. Log in instead.'],
  'auth/weak-password': ['Password kam se kam 6 characters ka hona chahiye.', 'Password must be at least 6 characters.'],
  'auth/invalid-email': ['Email sahi format me nahi hai.', 'That email address is not valid.'],
  'auth/popup-closed-by-user': ['Google login window band ho gayi. Dobara try karo.', 'The Google sign-in window was closed. Try again.'],
  'auth/popup-blocked': ['Browser ne popup block kar diya. Popup allow karke dobara try karo.', 'Your browser blocked the popup. Allow popups and try again.'],
  'auth/operation-not-allowed': ['Ye login method abhi enable nahi hai.', 'This sign-in method is not enabled yet.'],
  'auth/too-many-requests': ['Bahut zyada try ho gaye. Thodi der baad try karo.', 'Too many attempts. Try again later.'],
  'auth/network-request-failed': ['Internet connection check karo.', 'Check your internet connection.'],
}

export function AuthModal({ onClose }: { onClose: () => void }) {
  const tr = useTr()
  const friendly = (e: unknown) => {
    const code = (e as { code?: string })?.code ?? ''
    const m = MESSAGES[code]
    return m ? tr(m[0], m[1]) : tr(`Login nahi hua (${code || String(e)}).`, `Login failed (${code || String(e)}).`)
  }
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
      setError(tr('Pehle apna email upar daalo.', 'Enter your email above first.'))
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setInfo(tr('Password reset link email pe bhej diya.', 'We sent a password reset link to your email.'))
      setError('')
    } catch (e) {
      setError(friendly(e))
    }
  }

  if (!auth) {
    return (
      <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="modal-head">
            <h2 id="auth-title">{tr('Login jaldi aa raha hai', 'Login is coming soon')}</h2>
            <button className="icon-btn" onClick={onClose} aria-label={tr('Band karo', 'Close')}>
              ×
            </button>
          </div>
          <p className="muted">
            {tr(
              'Login abhi setup ho raha hai. Tab tak site bina login ke poori chalti hai, aur progress aur notes is browser me save hote hain. Login aane ke baad ye apne aap account me chale jayenge.',
              'Login is being set up. Until then the whole site works without it, and progress and notes are saved in this browser. Once login is live, they move to your account automatically.',
            )}
          </p>
          <button className="btn primary wide" onClick={onClose}>
            {tr('Theek hai', 'OK')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-head">
          <h2 id="auth-title">{mode === 'login' ? tr('Login', 'Log in') : tr('Account banao', 'Create account')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={tr('Band karo', 'Close')}>
            ×
          </button>
        </div>
        <p className="muted">{tr('Login karne se aapke notes aur progress har device pe sync honge.', 'Log in to sync your notes and progress across devices.')}</p>
        <button className="btn wide" disabled={busy} onClick={() => auth && run(() => signInWithPopup(auth!, new GoogleAuthProvider()))}>
          {tr('Google se continue karo', 'Continue with Google')}
        </button>
        <div className="or">{tr('ya email se', 'or with email')}</div>
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
            {busy ? tr('Ruko…', 'Please wait…') : mode === 'login' ? tr('Login', 'Log in') : tr('Account banao', 'Create account')}
          </button>
        </form>
        <div className="modal-foot">
          {mode === 'login' ? (
            <>
              <button className="link" onClick={() => setMode('signup')}>
                {tr('Naya account banao', 'Create a new account')}
              </button>
              <button className="link" onClick={reset}>
                {tr('Password bhool gaye?', 'Forgot password?')}
              </button>
            </>
          ) : (
            <button className="link" onClick={() => setMode('login')}>
              {tr('Account hai? Login karo', 'Have an account? Log in')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
