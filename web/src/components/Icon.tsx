// Small stroke icons for the top bar; colour follows currentColor so both themes work.
const PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  check: 'M9 12l2 2 4-4M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  sparkle: 'M12 3c.6 4.2 2.2 5.8 6.5 6.5-4.3.7-5.9 2.3-6.5 6.5-.6-4.2-2.2-5.8-6.5-6.5C9.8 8.8 11.4 7.2 12 3zM19 15c.3 1.7.9 2.4 2.5 2.7-1.6.3-2.2 1-2.5 2.7-.3-1.7-.9-2.4-2.5-2.7 1.6-.3 2.2-1 2.5-2.7z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  pen: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  up: 'M12 19V5M5 12l7-7 7 7',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.01',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  folder: 'M3 6h6l2 2h10v11H3z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  panel: 'M4 5h16v14H4zM15 5v14',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.8M14.5 9.5L21 16v3h-3v-2h-2v-2h-2l-.8-.8',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  close: 'M6 6l12 12M18 6 6 18',
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5',
  hld: 'M3 5h6v5H3zM15 5h6v5h-6zM9 17h6v4H9zM6 10v3h12v-3M12 13v4',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  chat: 'M4 5h16v11H9l-5 4V5zM8 9h8M8 12h5',
  db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
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
