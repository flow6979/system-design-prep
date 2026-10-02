import { useEffect, useState } from 'react'
import { loadProjects, type ProjectInfo } from './projects'

/** Runner manifest ek hook ki tarah: {} jab tak load na ho. */
export function useProjects(): Record<string, ProjectInfo> {
  const [projects, setProjects] = useState<Record<string, ProjectInfo>>({})
  useEffect(() => {
    let live = true
    loadProjects().then((p) => live && setProjects(p))
    return () => {
      live = false
    }
  }, [])
  return projects
}
