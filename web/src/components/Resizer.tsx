import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'

/** Drag handle on a panel edge. `side` is which edge of the panel it sits on. */
export function Resizer({
  side,
  width,
  min,
  max,
  fallback,
  onChange,
  label,
}: {
  side: 'left' | 'right'
  width: number
  min: number
  max: number
  fallback: number
  onChange: (w: number) => void
  label: string
}) {
  const clamp = (w: number) => Math.round(Math.min(max, Math.max(min, w)))

  function start(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    const x0 = e.clientX
    const w0 = width
    const move = (ev: PointerEvent) => onChange(clamp(w0 + (side === 'right' ? ev.clientX - x0 : x0 - ev.clientX)))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.classList.remove('resizing')
    }
    document.body.classList.add('resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className={`resizer ${side}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag karke size badlo · double-click se reset"
      onPointerDown={start}
      onDoubleClick={() => onChange(fallback)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 40 : 16
        const grow = side === 'right' ? 'ArrowRight' : 'ArrowLeft'
        const shrink = side === 'right' ? 'ArrowLeft' : 'ArrowRight'
        if (e.key === grow) onChange(clamp(width + step))
        if (e.key === shrink) onChange(clamp(width - step))
      }}
    />
  )
}

export function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
