import type { Page } from './content'

export function pct(done: number, total: number): number {
  if (!total) return 0
  const p = (done / total) * 100
  // One decimal below 10% so the first few ticks visibly move the number
  return p > 0 && p < 10 ? Math.round(p * 10) / 10 : Math.round(p)
}

export function pageStats(page: Page, progress: Record<string, boolean>) {
  const done = page.checklist.filter((i) => progress[i.id]).length
  return { done, total: page.checklist.length, complete: page.checklist.length > 0 && done === page.checklist.length }
}

export function groupStats(pages: Page[], progress: Record<string, boolean>) {
  let done = 0
  let total = 0
  let complete = 0
  for (const p of pages) {
    const s = pageStats(p, progress)
    done += s.done
    total += s.total
    if (s.complete) complete++
  }
  return { done, total, complete, pages: pages.length, percent: pct(done, total) }
}
