// Lab page khulte hi progress mein "visited" mark karo (Map ke progress bar + "Continue" strip ke liye).
import { useEffect } from 'react'
import { markVisited } from './progress'

export function useVisit(projectId: string, route: string) {
  useEffect(() => {
    markVisited(projectId, route)
  }, [projectId, route])
}
