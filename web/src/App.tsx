import { useEffect, useState } from 'react'
import { allItems, pageBySlug } from './content'
import { useStore, readLocal, writeLocal } from './store'
import { firebaseEnabled } from './firebase'
import { getGeminiSettings } from './gemini'
import { pct } from './progress'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { PageView } from './components/PageView'
import { Quiz } from './components/Quiz'
import { NotesPanel } from './components/NotesPanel'
import { ChatPanel } from './components/ChatPanel'
import { AuthModal } from './components/AuthModal'
import { SettingsModal } from './components/SettingsModal'
import { Resizer, useMedia } from './components/Resizer'

const NAV = { min: 200, max: 440, fallback: 270 }
const PANEL = { min: 300, max: 720, fallback: 380 }

type Tab = 'notes' | 'ask' | 'mock'
type Theme = 'light' | 'dark'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const parts = hash.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'quiz') return { view: 'quiz' as const, slug: 'quiz' }
  if ((parts[0] === 'topic' || parts[0] === 'q') && parts[1]) return { view: 'page' as const, slug: parts[1] }
  return { view: 'home' as const, slug: '' }
}

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export function App() {
  const { user, authReady, progress, logout } = useStore()
  const { view, slug } = useHashRoute()
  const page = view === 'page' ? pageBySlug.get(slug) : undefined
  const [tab, setTab] = useState<Tab>(() => readLocal('hld.tab', 'notes'))
  const [revision, setRevision] = useState<boolean>(() => readLocal('hld.revision', false))
  const [theme, setTheme] = useState<Theme>(() => readLocal('hld.theme', systemTheme()))
  const [showAuth, setShowAuth] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [hasKey, setHasKey] = useState(() => !!getGeminiSettings().apiKey)
  const [navOpen, setNavOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bannerClosed, setBannerClosed] = useState<boolean>(() => readLocal('hld.bannerClosed', false))
  useEffect(() => writeLocal('hld.bannerClosed', bannerClosed), [bannerClosed])
  // Desktop: both side columns can be dragged wider/narrower or hidden. Below 1024px they become overlays.
  const desktop = useMedia('(min-width: 1024px)')
  const [navW, setNavW] = useState<number>(() => readLocal('hld.navW', NAV.fallback))
  const [panelW, setPanelW] = useState<number>(() => readLocal('hld.panelW', PANEL.fallback))
  const [navHidden, setNavHidden] = useState<boolean>(() => readLocal('hld.navHidden', false))
  const [panelHidden, setPanelHidden] = useState<boolean>(() => readLocal('hld.panelHidden', false))

  useEffect(() => writeLocal('hld.navW', navW), [navW])
  useEffect(() => writeLocal('hld.panelW', panelW), [panelW])
  useEffect(() => writeLocal('hld.navHidden', navHidden), [navHidden])
  useEffect(() => writeLocal('hld.panelHidden', panelHidden), [panelHidden])
  useEffect(() => {
    if (desktop) {
      setNavOpen(false)
      setPanelOpen(false)
    }
  }, [desktop])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeLocal('hld.theme', theme)
  }, [theme])

  useEffect(() => writeLocal('hld.tab', tab), [tab])
  useEffect(() => writeLocal('hld.revision', revision), [revision])

  useEffect(() => {
    document.title = page ? `${page.title} · HLD Prep` : view === 'quiz' ? 'Pattern quiz · HLD Prep' : 'HLD Prep'
    document.querySelector('.main')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [page, view])

  const done = allItems.filter((i) => progress[i.id]).length
  const overall = pct(done, allItems.length)
  const effectiveTab: Tab = tab === 'mock' && page?.kind !== 'question' ? 'ask' : tab
  const showNav = desktop ? !navHidden : true
  const showPanel = !!page && (desktop ? !panelHidden : true)
  const gridStyle = desktop
    ? { gridTemplateColumns: `${showNav ? navW : 0}px minmax(0, 1fr) ${showPanel ? panelW : 0}px` }
    : undefined
  const toggleNav = () => (desktop ? setNavHidden((h) => !h) : setNavOpen((o) => !o))
  const togglePanel = () => (desktop ? setPanelHidden((h) => !h) : setPanelOpen((o) => !o))
  const panelVisible = desktop ? showPanel : panelOpen

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          onClick={toggleNav}
          aria-label={desktop ? (navHidden ? 'Sidebar dikhao' : 'Sidebar chhupao') : 'Menu'}
          title={desktop ? (navHidden ? 'Sidebar dikhao' : 'Sidebar chhupao') : 'Menu'}
          aria-expanded={desktop ? !navHidden : navOpen}
        >
          ☰
        </button>
        <a href="#/" className="logo">
          HLD Prep
        </a>
        <div className="spacer" />
        <div className="overall" title={`${done} / ${allItems.length} checklist points`}>
          <span className="mono small">{overall}%</span>
          <div className="bar small">
            <i style={{ width: `${overall}%` }} />
          </div>
        </div>
        <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Theme badlo">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button className="btn small" onClick={() => setShowSettings(true)} aria-label="Gemini settings">
          <span className="hide-sm">Gemini key</span>
          <span className="show-sm">AI</span>
        </button>
        {page && (
          <button
            className={`btn small panel-toggle ${panelVisible ? 'on' : ''}`}
            onClick={togglePanel}
            aria-expanded={panelVisible}
            title={panelVisible ? 'Notes / Gemini panel chhupao' : 'Notes / Gemini panel dikhao'}
          >
            <span className="hide-sm">{panelVisible ? 'Panel chhupao' : 'Notes · Gemini'}</span>
            <span className="show-sm">✎</span>
          </button>
        )}
        {firebaseEnabled &&
          authReady &&
          (user ? (
            <div className="user-menu">
              <button className="btn small" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]} ▾
              </button>
              {menuOpen && (
                <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                  <span className="muted small">{user.email}</span>
                  <button
                    className="btn small wide"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn primary small" onClick={() => setShowAuth(true)}>
              Login
            </button>
          ))}
      </header>

      {!firebaseEnabled && !bannerClosed && (
        <div className="banner small">
          <span>Login abhi setup nahi hua, isliye progress aur notes sirf is browser me save ho rahe hain.</span>
          <button className="icon-btn" onClick={() => setBannerClosed(true)} aria-label="Banner band karo">
            ×
          </button>
        </div>
      )}

      <div className={`layout ${desktop ? 'desktop' : 'compact'}`} style={gridStyle}>
        {showNav && (
          <aside className={`nav ${navOpen ? 'open' : ''}`} aria-hidden={!desktop && !navOpen}>
            <Sidebar current={slug} onNavigate={() => setNavOpen(false)} />
            {desktop && (
              <Resizer side="right" width={navW} {...NAV} onChange={setNavW} label="Sidebar ki width" />
            )}
          </aside>
        )}
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

        <main className="main">
          {view === 'home' && <Dashboard />}
          {view === 'quiz' && <Quiz />}
          {view === 'page' && !page && (
            <div className="empty-state">
              <h1>Page nahi mila</h1>
              <a href="#/">Dashboard pe jao</a>
            </div>
          )}
          {page && <PageView page={page} revision={revision} onToggleRevision={() => setRevision((r) => !r)} />}
        </main>

        {showPanel && page && (
          <aside className={`side-panel ${panelOpen ? 'open' : ''}`}>
            {desktop && <Resizer side="left" width={panelW} {...PANEL} onChange={setPanelW} label="Panel ki width" />}
            <div className="tabs" role="tablist">
              {(['notes', 'ask', ...(page.kind === 'question' ? ['mock'] : [])] as Tab[]).map((t) => (
                <button key={t} role="tab" aria-selected={effectiveTab === t} className={effectiveTab === t ? 'on' : ''} onClick={() => setTab(t)}>
                  {{ notes: 'Notes', ask: 'Ask Gemini', mock: 'Mock' }[t]}
                </button>
              ))}
              <button
                className="icon-btn panel-close"
                onClick={() => (desktop ? setPanelHidden(true) : setPanelOpen(false))}
                aria-label="Panel band karo"
                title="Panel band karo"
              >
                ×
              </button>
            </div>
            {effectiveTab === 'notes' && <NotesPanel slug={page.slug} onLogin={() => setShowAuth(true)} />}
            {effectiveTab !== 'notes' && (
              <ChatPanel key={effectiveTab} page={page} mode={effectiveTab} hasKey={hasKey} onOpenSettings={() => setShowSettings(true)} />
            )}
          </aside>
        )}
      </div>

      {page && !desktop && !panelOpen && (
        <button className="fab" onClick={() => setPanelOpen(true)}>
          Notes · Gemini
        </button>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false)
            setHasKey(!!getGeminiSettings().apiKey)
          }}
        />
      )}
    </div>
  )
}
