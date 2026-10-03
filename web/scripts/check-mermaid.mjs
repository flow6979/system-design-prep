// Parses every ```mermaid block in content/ so broken diagrams fail before deploy.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })

const { default: mermaid } = await import('mermaid')
mermaid.initialize({ startOnLoad: false })

const root = new URL('../../content/', import.meta.url).pathname
let blocks = 0
let failures = 0
for (const dir of ['01-topics', '02-questions', '03-lld', '04-java', '../content-en/01-topics', '../content-en/02-questions', '../content-en/03-lld', '../content-en/04-java']) {
  for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(join(root, dir, file), 'utf8')
    for (const m of text.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
      blocks++
      try {
        await mermaid.parse(m[1])
      } catch (e) {
        failures++
        const line = text.slice(0, m.index).split('\n').length
        console.log(`✗ ${dir}/${file}:${line}\n  ${String(e.message ?? e).split('\n').slice(0, 4).join('\n  ')}\n`)
      }
    }
  }
}
console.log(`${blocks} diagrams checked, ${failures} failed`)
process.exit(failures ? 1 : 0)
