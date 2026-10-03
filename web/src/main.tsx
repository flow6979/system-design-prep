import { reloadForNewBuild } from './components/Mermaid'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './store'
import { App } from './App'
import { LangProvider } from './i18n'
import './styles.css'
import { installRouter } from './router'

installRouter()
// Lazy chunks from an older deploy are gone: load the new build once
window.addEventListener('vite:preloadError', (e) => {
  if (reloadForNewBuild()) e.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </LangProvider>
  </StrictMode>,
)
