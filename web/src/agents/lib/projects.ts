// Runner manifest (handbook ke lab-api/labapi/projects.json + projects.d/*.json, build time pe merge).
// Har project jiska main.py hai, woh generic runner (/run/<id>) se chalta hai.
import type { Dict } from '../i18n'

export type RunnerInput = {
  name: string
  kind: 'text' | 'textarea' | 'choice' | 'number' | 'flag'
  arg?: string
  default?: string | number | boolean
  choices?: (string | number)[]
  multi?: boolean
  label?: Dict<string>
  help?: Dict<string>
}

export type ProjectInfo = {
  main: string
  browser?: 'replay'
  replay_reason?: Dict<string>
  pip?: string[]
  inputs?: RunnerInput[]
  summary?: Dict<string>
  watch?: Dict<string[]>
  explain?: Dict<{ title: string; flow?: string[]; lines: string[] }>
  files?: string[]
  live_note?: Dict<string>
  stdin?: Dict<string>
  lab_route?: string
}

let promise: Promise<Record<string, ProjectInfo>> | null = null

export function loadProjects(): Promise<Record<string, ProjectInfo>> {
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}handbook/projects.json`).then((r) => (r.ok ? r.json() : {}))
    promise.catch(() => (promise = null))
  }
  return promise
}

export const runnerRoute = (id: string) => `/run/${id}`
