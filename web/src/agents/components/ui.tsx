// Chhote reusable UI pieces (prototype ke design se). Naye page banao to pehle yahan dekho.
import type { ReactNode } from 'react'

export function Seg<T extends string>({ value, options, onChange, label, className }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`seg ${className ?? ''}`}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StepBadge({ n, done, active }: { n: ReactNode; done: boolean; active: boolean }) {
  const bg = done ? 'var(--teal)' : active ? 'var(--ink)' : 'var(--line-2)'
  return (
    <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-ink)', background: bg, flexShrink: 0 }}>
      {done ? <Icon name="check" size={14} /> : n}
    </span>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, background: 'var(--chip)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export function Progress({ pct, label }: { pct: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label} style={{ height: 6, borderRadius: 999, background: 'var(--seg)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--teal)', transition: 'width .3s' }} />
    </div>
  )
}

const PATHS: Record<string, ReactNode> = {
  check: <path d="M3 8.5l3.2 3.2L13 5" />,
  arrow: <path d="M3 9h12M10 4l5 5-5 5" />,
  play: <path d="M5 3v12l9-6z" fill="currentColor" stroke="none" />,
  stop: <rect x="4" y="4" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />,
  settings: (
    <>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 1.5v2.2M9 14.3v2.2M1.5 9h2.2M14.3 9h2.2M3.7 3.7l1.5 1.5M12.8 12.8l1.5 1.5M3.7 14.3l1.5-1.5M12.8 5.2l1.5-1.5" />
    </>
  ),
  key: (
    <>
      <circle cx="6" cy="12" r="3.5" />
      <path d="M8.5 9.5L15 3M12.5 5.5l2 2" />
    </>
  ),
  external: <path d="M10 3h5v5M15 3L8 10M13 11v4H3V5h4" />,
  up: <path d="M9 14V4M4.5 8.5L9 4l4.5 4.5" />,
  down: <path d="M9 4v10M4.5 9.5L9 14l4.5-4.5" />,
  close: <path d="M4 4l10 10M14 4L4 14" />,
  doc: <path d="M5 2h6l3 3v11H5zM11 2v3h3M7 9h5M7 12h5" />,
  code: <path d="M6 5L2 9l4 4M12 5l4 4-4 4" />,
  upload: <path d="M9 12V3M5 7l4-4 4 4M3 13v2h12v-2" />,
  warn: <path d="M9 2l7.5 13h-15zM9 7v4M9 13.2v.1" />,
  menu: <path d="M3 5h12M3 9h12M3 13h12" />,
}

export function Icon({ name, size = 18, label }: { name: keyof typeof PATHS | string; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {PATHS[name]}
    </svg>
  )
}

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--teal)" strokeWidth="2" aria-hidden="true">
      <circle cx="14" cy="14" r="11" />
      <circle cx="14" cy="14" r="4" />
      <path d="M14 3v4M14 21v4M3 14h4M21 14h4" />
    </svg>
  )
}

/** Dark code/diagram block. */
export function CodeBlock({ children, maxHeight }: { children: string; maxHeight?: number }) {
  return (
    <pre style={{ margin: 0, padding: '14px 16px', borderRadius: 10, background: 'var(--al-dark)', color: 'var(--on-dark)', fontSize: 13, lineHeight: 1.5, overflow: 'auto', maxHeight }}>
      <code>{children}</code>
    </pre>
  )
}
