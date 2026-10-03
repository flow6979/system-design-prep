// Small stroke icons for the top bar; colour follows currentColor so both themes work.
const PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  panel: 'M4 5h16v14H4zM15 5v14',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.8M14.5 9.5L21 16v3h-3v-2h-2v-2h-2l-.8-.8',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  close: 'M6 6l12 12M18 6 6 18',
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5',
  cup: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M11.5 3c0 1.5 1 1.5 1 3',
  plan: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4M8 13h3M8 16h6',
  quiz: 'M9.2 9a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.1-1.5 2.1V15M12 18.5v.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  bot: 'M12 3v3M7 8h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3zM9 13h.01M15 13h.01M9.5 16.5h5',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
