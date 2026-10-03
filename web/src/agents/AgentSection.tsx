// Agentic AI section of Viewinter (formerly the standalone Agent Lab site).
// Lives under #/agents/...; the rest of Viewinter keeps its own hash routes.
import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ExplainCard, GuideProvider, useGuideCtx } from './guide/guide'
import { useT } from './i18n'
import { common } from './i18n/common'
import { bridge } from './lib/worker'
import { providerById } from './lib/providers'
import { AppProvider, useApp } from './state/app'
import Setup from './pages/Setup'
import './styles/global.css'

const Home = lazy(() => import('./pages/Home'))
const Section = lazy(() => import('./pages/Section'))
const Docs = lazy(() => import('./pages/Docs'))
const Settings = lazy(() => import('./pages/Settings'))
const SetupErrors = lazy(() => import('./pages/SetupErrors'))
const History = lazy(() => import('./pages/History'))
const Presenter = lazy(() => import('./pages/Presenter'))
const ReactLab = lazy(() => import('./pages/react/ReactLab'))
const RagLab = lazy(() => import('./pages/labs/RagLab'))
const WebLab = lazy(() => import('./pages/labs/WebLab'))
const MultiAgentLab = lazy(() => import('./pages/labs/MultiAgentLab'))
const CommLab = lazy(() => import('./pages/labs/CommLab'))
const ProdLab = lazy(() => import('./pages/labs/ProdLab'))
const Runner = lazy(() => import('./pages/Runner'))

/** Connection status, guide progress and tips reset (what agent-lab's header used to show) */
function Toolbar() {
  const app = useApp()
  const t = useT(common)
  const { activePage, progress, setStep, showExplain } = useGuideCtx()
  const prov = providerById(app.provider)
  const dot = app.connection === 'ok' || app.provider === 'offline' ? 'var(--green)' : app.connection === 'error' ? 'var(--red)' : 'var(--yellow)'
  return (
    <div className="agent-toolbar">
      <Link to="/agents/settings" className="provider-chip" title={t.settings}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />
        <span style={{ fontWeight: 600 }}>{prov ? prov.name : t.notConnected}</span>
        {prov && prov.id !== 'offline' && <span className="mono hide-sm" style={{ color: 'var(--muted)' }}>{app.modelFor(prov.id)}</span>}
      </Link>
      <span className="spacer" />
      {activePage && (
        <>
          <button
            type="button"
            className="btn btn-sm"
            title={`${t.guide} ${Math.min(progress[activePage.id] ?? 0, activePage.total)}/${activePage.total}`}
            onClick={() => {
              setStep(activePage.id, 0)
              showExplain(null)
            }}
          >
            {t.resetTips}
          </button>
        </>
      )}
      <Link to="/agents/settings" className="btn btn-sm">
        {t.settings}
      </Link>
    </div>
  )
}

function Shell() {
  const t = useT(common)
  useEffect(() => {
    // Start loading Python (Pyodide) in the background so the first Run is quick
    const start = () => bridge.init().catch(() => undefined)
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    if (w.requestIdleCallback) w.requestIdleCallback(start)
    else setTimeout(start, 1500)
  }, [])
  return (
    <>
      <div className="agents-container">
      <Toolbar />
      <Suspense fallback={<div className="page muted">...</div>}>
        <Routes>
          <Route path="/agents" element={<Setup />} />
          <Route path="/agents/errors" element={<SetupErrors />} />
          <Route path="/agents/settings" element={<Settings />} />
          <Route path="/agents/map" element={<Home />} />
          <Route path="/agents/section/:sectionId" element={<Section />} />
          <Route path="/agents/docs/*" element={<Docs />} />
          <Route path="/agents/lab/react/:tab?" element={<ReactLab />} />
          <Route path="/agents/labs/rag" element={<RagLab />} />
          <Route path="/agents/labs/web" element={<WebLab />} />
          <Route path="/agents/labs/multi" element={<MultiAgentLab />} />
          <Route path="/agents/labs/comm" element={<CommLab />} />
          <Route path="/agents/labs/prod" element={<ProdLab />} />
          <Route path="/agents/run/*" element={<Runner />} />
          <Route path="/agents/history" element={<History />} />
          <Route path="/agents/presenter" element={<Presenter />} />
          {/* Unknown agent URLs go to Setup; anything outside /agents belongs to Viewinter, so render nothing */}
          <Route path="/agents/*" element={<Navigate to="/agents" replace />} />
          <Route path="*" element={null} />
        </Routes>
      </Suspense>
      </div>
      <ExplainCard labels={{ whatHappened: t.whatHappened, gotIt: t.gotIt }} />
    </>
  )
}

export function AgentSection() {
  return (
    <div className="agents-root">
      <AppProvider>
        <GuideProvider>
          <HashRouter>
            <Shell />
          </HashRouter>
        </GuideProvider>
      </AppProvider>
    </div>
  )
}
