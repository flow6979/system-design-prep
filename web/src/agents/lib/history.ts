// Run history: har lab run ka chhota record (localStorage). History page isse table + compare banata hai.
import { local } from './storage'
import type { LabEvent } from './worker'

export type RunRecord = {
  id: string
  lab: string
  title: string
  provider: string
  model: string
  offline: boolean
  ok: boolean
  startedAt: number
  ms: number
  llmCalls: number
  inputTokens: number
  outputTokens: number
  steps: number
  params: Record<string, unknown>
  answer: string
  stoppedReason?: string
  error?: string
  events: LabEvent[]
}

const KEY = 'history'
const MAX = 60

export function loadHistory(): RunRecord[] {
  return local.get<RunRecord[]>(KEY, [])
}

export function saveRun(r: RunRecord) {
  const all = [r, ...loadHistory()].slice(0, MAX)
  local.set(KEY, all)
  window.dispatchEvent(new CustomEvent('agentlab:history'))
}

export function clearHistory() {
  local.remove(KEY)
  window.dispatchEvent(new CustomEvent('agentlab:history'))
}

/** Bahut rough estimate (USD per 1M tokens). Sirf samajhne ke liye; asli price provider page pe dekho. */
const PRICE: Record<string, [number, number]> = {
  groq: [0.59, 0.79],
  gemini: [0.3, 2.5],
  openai: [0.15, 0.6],
  anthropic: [3, 15],
}
export function estimateCost(provider: string, inTok: number, outTok: number): number {
  const p = PRICE[provider]
  if (!p) return 0
  return (inTok * p[0] + outTok * p[1]) / 1_000_000
}
