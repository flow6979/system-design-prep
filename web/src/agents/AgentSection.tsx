// Agentic AI section of Viewinter (formerly the standalone Agent Lab site).
// Lives under /agents/...; the rest of Viewinter routes on the same URL path.
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ExplainCard, GuideProvider, useGuideCtx } from './guide/guide'
import { useT } from './i18n'
import { common } from './i18n/common'
import { bridge } from './lib/worker'
import { openSettings } from '../gemini'
import { AppProvider, useApp } from './state/app'
import './styles/global.css'

const Home = lazy(() => import('./pages/Home'))
const Section = lazy(() => import('./pages/Section'))
const Docs = lazy(() => import('./pages/Docs'))
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
  // Which LLM the labs use comes from the central Gemini settings; the chip just reports it
  const dot = app.offline ? 'var(--warn)' : app.connection === 'error' ? 'var(--red)' : 'var(--green)'
  return (
    <div className="agent-toolbar">
      <button type="button" className="provider-chip" onClick={openSettings} title="AI">
        <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />
        <span style={{ fontWeight: 600 }}>{app.offline ? t.offlineChip : 'AI'}</span>
        {!app.offline && <span className="mono hide-sm" style={{ color: 'var(--muted)' }}>{app.modelFor('gemini')}</span>}
      </button>
      <nav className="agent-links" aria-label="Agentic AI">
        <Link to="/agents">Topics</Link>
        <Link to="/agents/docs">Docs</Link>
        <Link to="/agents/history">History</Link>
        <Link to="/agents/presenter">Presenter</Link>
      </nav>
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
          <Route path="/agents" element={<Home />} />
          <Route path="/agents/map" element={<Navigate to="/agents" replace />} />
          <Route path="/agents/errors" element={<SetupErrors />} />
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
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Shell />
          </BrowserRouter>
        </GuideProvider>
      </AppProvider>
    </div>
  )
}
