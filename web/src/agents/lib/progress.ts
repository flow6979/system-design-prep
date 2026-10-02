// Learning progress (localStorage). Koi bhi page project khulne pe markVisited() bulaye.
//
//   markVisited('02-agentic-architectures/04-react', '/lab/react/run')
//   getProgress().visited['04-rag/02-pdf-chat']   // timestamp ya undefined
//   getProgress().last                            // "Continue where you left off"
import { local } from './storage'

export type Progress = { visited: Record<string, number>; last: { id: string; route: string; at: number } | null }

const KEY = 'progress'
const EVT = 'agentlab:progress'

export function getProgress(): Progress {
  return local.get<Progress>(KEY, { visited: {}, last: null })
}

export function markVisited(id: string, route: string) {
  const p = getProgress()
  p.visited[id] = Date.now()
  p.last = { id, route, at: Date.now() }
  local.set(KEY, p)
  window.dispatchEvent(new CustomEvent(EVT))
}

export function resetProgress() {
  local.remove(KEY)
  window.dispatchEvent(new CustomEvent(EVT))
}

export function onProgress(cb: () => void): () => void {
  window.addEventListener(EVT, cb)
  return () => window.removeEventListener(EVT, cb)
}
