// Small stroke icons for the top bar; colour follows currentColor so both themes work.
const PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  panel: 'M4 5h16v14H4zM15 5v14',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.8M14.5 9.5L21 16v3h-3v-2h-2v-2h-2l-.8-.8',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  close: 'M6 6l12 12M18 6 6 18',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
