// Guide system: user ka rule: "instruction dikhe, action lete hi gayab ho, phir batao kya hua".
//
// Har page apne steps declare karta hai:
//   const g = useGuide('react-lab', ['run', 'mode', 'rerun'])
//   <Tip show={g.is('run')}>Run dabao</Tip>
//   <button className={g.pulse('run')} onClick={() => { ...; g.done('run', explainCard) }}>
//
// done(id, explain): agar abhi yahi step chal raha tha to agla step, aur "Kya hua?" card khulta hai.
// Card khula ho tab koi tip nahi dikhta (ek waqt pe ek hi cheez).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { prettyFile } from '../lib/handbook'
import { local } from '../lib/storage'

export type Explain = { title: string; flow?: string[]; lines: string[]; file?: string; link?: { href: string; label: string } }

type GuideCtx = {
  explain: Explain | null
  showExplain: (e: Explain | null) => void
  progress: Record<string, number>
  setStep: (page: string, idx: number) => void
  activePage: { id: string; total: number } | null
  setActivePage: (p: { id: string; total: number } | null) => void
}

const Ctx = createContext<GuideCtx | null>(null)

export function GuideProvider({ children }: { children: ReactNode }) {
  const [explain, showExplain] = useState<Explain | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>(() => local.get('guide', {}))
  const [activePage, setActivePage] = useState<{ id: string; total: number } | null>(null)
  const setStep = useCallback((page: string, idx: number) => {
    setProgress((prev) => {
      const next = { ...prev, [page]: idx }
      local.set('guide', next)
      return next
    })
  }, [])
  const value = useMemo(() => ({ explain, showExplain, progress, setStep, activePage, setActivePage }), [explain, progress, setStep, activePage])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGuideCtx() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useGuideCtx outside GuideProvider')
  return v
}

export function useGuide(page: string, steps: string[]) {
  const { explain, showExplain, progress, setStep, setActivePage } = useGuideCtx()
  const idx = progress[page] ?? 0
  const current = idx < steps.length ? steps[idx] : null
  const key = steps.join('|')

  useEffect(() => {
    setActivePage({ id: page, total: steps.length })
    return () => setActivePage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, key])

  const is = useCallback((id: string) => current === id && !explain, [current, explain])
  const pulse = useCallback((id: string) => (current === id && !explain ? 'al-pulse' : ''), [current, explain])
  const done = useCallback(
    (id: string, e?: Explain) => {
      const i = steps.indexOf(id)
      if (i !== -1 && i >= idx) setStep(page, i + 1)
      if (e) showExplain(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx, page, key, setStep, showExplain],
  )
  const reset = useCallback(() => {
    setStep(page, 0)
    showExplain(null)
  }, [page, setStep, showExplain])
  return { current, is, pulse, done, reset, explain: showExplain, step: Math.min(idx, steps.length), total: steps.length }
}

export function Tip({ show, children, align = 'start' }: { show: boolean; children: ReactNode; align?: 'start' | 'end' | 'center' }) {
  if (!show) return null
  return (
    <div className="al-in" role="status" style={{ alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--al-dark)', color: '#fff', fontSize: 14, maxWidth: 560 }}>
      <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--teal)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Tip</span>
      <span>{children}</span>
    </div>
  )
}

export function ExplainCard({ labels }: { labels: { whatHappened: string; gotIt: string } }) {
  const { explain, showExplain } = useGuideCtx()
  const location = useLocation()
  const ref = useRef<HTMLElement>(null)
  const firstPath = useRef(location.pathname)
  const openedAt = useRef(0)
  useEffect(() => {
    if (explain) openedAt.current = Date.now()
  }, [explain])

  // Page / tab badla (route change) = card band, kyunki user ab kuch aur dekh raha hai.
  // Exception: jis click ne card khola usi ne navigate bhi kiya (e.g. "Lab mein chalo" -> Map ka card),
  // tab card naye page ke baare mein hai, use rehne do.
  useEffect(() => {
    if (location.pathname !== firstPath.current && Date.now() - openedAt.current > 600) showExplain(null)
    firstPath.current = location.pathname
  }, [location.pathname, showExplain])

  // Escape ya card ke bahar kahin bhi click = card band.
  useEffect(() => {
    if (!explain) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && showExplain(null)
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) showExplain(null)
    }
    window.addEventListener('keydown', onKey)
    // agle tick pe lagao, taaki jis click ne card khola wahi use turant band na kar de
    const id = window.setTimeout(() => document.addEventListener('pointerdown', onDown), 0)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [explain, showExplain])
  if (!explain) return null
  return (
    <aside ref={ref} className="al-in explain-card" aria-live="polite">
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--explain)', color: 'var(--ink)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{labels.whatHappened}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>{explain.title}</span>
      </div>
      {explain.flow && explain.flow.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {explain.flow.map((f, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span style={{ padding: '4px 9px', borderRadius: 6, background: 'var(--dark-2)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mint)' }}>{f}</span>
              {i < explain.flow!.length - 1 && <span style={{ color: 'var(--faint)', fontSize: 12 }} aria-hidden="true">→</span>}
            </span>
          ))}
        </div>
      )}
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, lineHeight: 1.5, color: 'var(--on-dark)' }}>
        {explain.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--on-dark-muted)', wordBreak: 'break-all' }}>{prettyFile(explain.file ?? '')}</span>
        <div className="row" style={{ gap: 8 }}>
          {explain.link && (
            <a href={explain.link.href} style={{ color: 'var(--mint)', fontSize: 14 }}>
              {explain.link.label}
            </a>
          )}
          <button type="button" onClick={() => showExplain(null)} style={{ height: 40, padding: '0 16px', border: 0, borderRadius: 8, background: 'var(--explain)', color: 'var(--ink)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {labels.gotIt}
          </button>
        </div>
      </div>
    </aside>
  )
}
