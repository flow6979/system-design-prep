import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { allItems, pageBySlug } from './content'
import { useStore, readLocal, writeLocal } from './store'
import { OPEN_SETTINGS_EVENT, useGemini } from './gemini'
import { pct } from './progress'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { PageView } from './components/PageView'
import { Quiz } from './components/Quiz'
import { Planner } from './components/Planner'
import { NotesPanel } from './components/NotesPanel'
import { ChatPanel } from './components/ChatPanel'
import { AuthModal } from './components/AuthModal'
import { SettingsModal } from './components/SettingsModal'
import { Resizer, useMedia } from './components/Resizer'
import { CodeLangContext, type CodeLang } from './components/CodeBlock'
import { LangSwitch, useLang, useTr } from './i18n'
import { agentPageFor, localize } from './content'
import { lazy, Suspense } from 'react'
import { Checklist } from './components/Checklist'
import { Icon } from './components/Icon'
import { Avatar, ProfileModal } from './components/ProfileModal'

const AgentSection = lazy(() => import('./agents/AgentSection').then((m) => ({ default: m.AgentSection })))

const NAV = { min: 200, max: 440, fallback: 248 }
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
  if (parts[0] === 'plan') return { view: 'plan' as const, slug: 'plan' }
  if (parts[0] === 'agents') {
    const path = `/${parts.join('/')}`
    return { view: 'agents' as const, slug: agentPageFor(path).slug, path }
  }
  if ((parts[0] === 'topic' || parts[0] === 'q' || parts[0] === 'lld' || parts[0] === 'java') && parts[1]) return { view: 'page' as const, slug: parts[1] }
  return { view: 'home' as const, slug: '' }
}

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export function App() {
  const { user, authReady, progress } = useStore()
  const route = useHashRoute()
  const { view, slug } = route
  const { lang } = useLang()
  const tr = useTr()
  const page = view === 'page' ? pageBySlug.get(slug) : view === 'agents' ? agentPageFor(route.path ?? '/agents') : undefined
  const [tab, setTab] = useState<Tab>(() => readLocal('hld.tab', 'notes'))
  const [revision, setRevision] = useState<boolean>(() => readLocal('hld.revision', false))
  const [theme, setTheme] = useState<Theme>(() => readLocal('hld.theme', systemTheme()))
  const [showAuth, setShowAuth] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const gemini = useGemini()
  const hasKey = !!gemini.settings.apiKey
  // Key icon dot: orange = no key, red = last test failed
  const keyState = !hasKey ? 'attn' : gemini.status?.state === 'error' ? 'bad' : ''
  useEffect(() => {
    const open = () => setShowSettings(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open)
  }, [])
  const [navOpen, setNavOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [codeLang, setCodeLang] = useState<CodeLang>(() => readLocal('hld.codeLang', 'java'))
  useEffect(() => writeLocal('hld.codeLang', codeLang), [codeLang])
  const langCtx = useMemo(() => ({ lang: codeLang, setLang: setCodeLang }), [codeLang])
  // Desktop: both side columns can be dragged wider/narrower or hidden. Below 1024px they become overlays.
  const desktop = useMedia('(min-width: 1024px)')
  const [navW, setNavW] = useState<number>(() => readLocal('hld.navW', NAV.fallback))
  const [panelW, setPanelW] = useState<number>(() => readLocal('hld.panelW', PANEL.fallback))
  const [navHidden, setNavHidden] = useState<boolean>(() => readLocal('hld.navHidden', false))
  const [panelHidden, setPanelHidden] = useState<boolean>(() => readLocal('hld.panelHidden', true))

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
    document.title = page ? `${localize(page, lang).title} · Viewinter` : view === 'quiz' ? 'Quiz · Viewinter' : view === 'plan' ? 'Plan · Viewinter' : 'Viewinter'
    document.querySelector('.main')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [page, view, lang])

  const done = allItems.filter((i) => progress[i.id]).length
  const overall = pct(done, allItems.length)
  const effectiveTab: Tab = tab === 'mock' && page?.kind !== 'question' ? 'ask' : tab
  const showNav = desktop ? !navHidden : true
  const showPanel = !!page && (desktop ? !panelHidden : true)
  const gridStyle = desktop
    ? ({
        gridTemplateColumns: `${showNav ? navW : 0}px minmax(0, 1fr) ${showPanel ? panelW : 0}px`,
        '--panel-offset': `${showPanel ? panelW : 0}px`,
      } as React.CSSProperties)
    : undefined
  const toggleNav = () => (desktop ? setNavHidden((h) => !h) : setNavOpen((o) => !o))
  const togglePanel = () => (desktop ? setPanelHidden((h) => !h) : setPanelOpen((o) => !o))
  const panelVisible = desktop ? showPanel : panelOpen

  return (
    <CodeLangContext.Provider value={langCtx}>
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          onClick={toggleNav}
          aria-label={desktop ? (navHidden ? tr('Sidebar dikhao', 'Show sidebar') : tr('Sidebar chhupao', 'Hide sidebar')) : 'Menu'}
          title={desktop ? (navHidden ? tr('Sidebar dikhao', 'Show sidebar') : tr('Sidebar chhupao', 'Hide sidebar')) : 'Menu'}
          aria-expanded={desktop ? !navHidden : navOpen}
        >
          <Icon name="menu" />
        </button>
        <a href="#/" className="logo" aria-label="Viewinter">
          <svg className="logo-mark" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M7 8l5 9 5-9" />
          </svg>
          <span>Viewinter</span>
        </a>
        <div className="spacer" />
        <LangSwitch />
        <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={tr('Theme badlo', 'Toggle theme')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button
          className={`icon-btn ${keyState}`}
          onClick={() => setShowSettings(true)}
          aria-label={tr('Gemini key', 'Gemini key')}
          title={!hasKey ? tr('Gemini key daalo', 'Add Gemini key') : gemini.status?.state === 'ok' ? `Gemini · ${gemini.status.model}` : 'Gemini'}
        >
          <Icon name="key" />
        </button>
        {page && (
          <button
            className={`icon-btn panel-toggle ${panelVisible ? 'on' : ''}`}
            onClick={togglePanel}
            aria-expanded={panelVisible}
            aria-label="Notes · Gemini"
            title="Notes · Gemini"
          >
            <Icon name="panel" />
          </button>
        )}
        {authReady &&
          (user ? (
            <button className="avatar-btn" onClick={() => setShowProfile(true)} aria-label={tr('Profile', 'Profile')} title={user.email ?? ''}>
              <Avatar name={user.displayName || user.email || '?'} />
            </button>
          ) : (
            <button className="btn primary small" onClick={() => setShowAuth(true)}>
              {tr('Login', 'Log in')}
            </button>
          ))}
      </header>


      <div className={`layout ${desktop ? 'desktop' : 'compact'}`} style={gridStyle}>
        {showNav && (
          <aside className={`nav ${navOpen ? 'open' : ''}`} aria-hidden={!desktop && !navOpen}>
            <Sidebar current={slug} onNavigate={() => setNavOpen(false)} />
            {desktop && (
              <Resizer side="right" width={navW} {...NAV} onChange={setNavW} label={tr('Sidebar ki width', 'Sidebar width')} />
            )}
          </aside>
        )}
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

        <main className="main">
          {view === 'home' && <Dashboard />}
          {view === 'plan' && <Planner />}
          {view === 'quiz' && <Quiz hasKey={hasKey} onOpenSettings={() => setShowSettings(true)} />}
          {view === 'page' && !page && (
            <div className="empty-state">
              <h1>{tr('Page nahi mila', 'Page not found')}</h1>
              <a href="#/">{tr('Dashboard pe jao', 'Go to dashboard')}</a>
            </div>
          )}
          {view === 'agents' && (
            <Suspense fallback={<p className="muted">Loading…</p>}>
              <AgentSection />
              {page && page.checklist.length > 0 && (
                <div className="agent-extra">
                  <Checklist page={localize(page, lang)} />
                </div>
              )}
            </Suspense>
          )}
          {view === 'page' && page && (
            <PageView
              page={page}
              revision={revision}
              onToggleRevision={() => setRevision((r) => !r)}
              codeLang={codeLang}
              onCodeLang={setCodeLang}
            />
          )}
        </main>

        {showPanel && page && (
          <aside className={`side-panel ${panelOpen ? 'open' : ''}`}>
            {desktop && <Resizer side="left" width={panelW} {...PANEL} onChange={setPanelW} label={tr('Panel ki width', 'Panel width')} />}
            <div className="tabs" role="tablist">
              {(['notes', 'ask', ...(page.kind === 'question' ? ['mock'] : [])] as Tab[]).map((t) => (
                <button key={t} role="tab" aria-selected={effectiveTab === t} className={effectiveTab === t ? 'on' : ''} onClick={() => setTab(t)}>
                  {{ notes: 'Notes', ask: 'Ask Gemini', mock: 'Mock' }[t]}
                </button>
              ))}
              <button
                className="icon-btn panel-close"
                onClick={() => (desktop ? setPanelHidden(true) : setPanelOpen(false))}
                aria-label={tr('Panel band karo', 'Close panel')}
                title={tr('Panel band karo', 'Close panel')}
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
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false)
          }}
        />
      )}
    </div>
    </CodeLangContext.Provider>
  )
}
