// Path-based routing (no "#" in URLs): /viewinter/topic/caching instead of /viewinter/#/topic/caching.
// GitHub Pages serves 404.html (a copy of index.html) for unknown paths, so deep links still load the app.
import { useEffect, useState } from 'react'

/** "/viewinter/" in production; always ends with "/" */
export const BASE = import.meta.env.BASE_URL

const NAV_EVENT = 'viewinter:navigate'

/** App path for a route like "topic/caching" (no leading slash) */
export const href = (path: string) => `${BASE}${path.replace(/^\/+/, '')}`

/** Current route without the base, e.g. "topic/caching" ("" for the dashboard) */
export function currentPath(): string {
  const p = window.location.pathname
  return (p.startsWith(BASE) ? p.slice(BASE.length) : p.replace(/^\/+/, '')).replace(/\/+$/, '')
}

export function navigate(path: string, replace = false) {
  const url = href(path)
  if (replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
  window.scrollTo(0, 0)
}

let installed = false

/** Once at startup: upgrade old #/ links, announce history changes, and handle in-app link clicks */
export function installRouter() {
  if (installed) return
  installed = true

  // Old links like /viewinter/#/topic/x keep working
  if (window.location.hash.startsWith('#/')) {
    window.history.replaceState(null, '', href(window.location.hash.slice(2)))
  }

  // React Router (agent labs) and our own navigate() both use pushState; tell every listener
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method].bind(window.history)
    window.history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args)
      window.dispatchEvent(new Event(NAV_EVENT))
    }
  }

  // Plain <a href="/viewinter/..."> links (sidebar, markdown) navigate without a page reload
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as HTMLElement).closest('a')
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return
    const url = new URL(a.href, window.location.href)
    if (url.origin !== window.location.origin || !url.pathname.startsWith(BASE)) return
    // Static files (handbook docs, worker) are real files, not app routes
    if (/\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith('.html')) return
    e.preventDefault()
    if (url.pathname + url.search !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', url.pathname + url.search + url.hash)
      // React Router listens to popstate, so a synthetic one keeps the agent labs in sync
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo(0, 0)
    }
  })
}

/** Re-renders on any navigation */
export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const on = () => setPath(currentPath())
    window.addEventListener('popstate', on)
    window.addEventListener(NAV_EVENT, on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener(NAV_EVENT, on)
    }
  }, [])
  return path
}
