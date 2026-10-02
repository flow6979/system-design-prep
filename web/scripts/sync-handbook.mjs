// Handbook repo se website ke liye files bundle karo.
//
//   HANDBOOK_DIR=../agentic-ai-handbook node scripts/sync-handbook.mjs
//
// Output (public/handbook/):
//   handbook.zip   -> Web Worker isse Pyodide ke filesystem mein kholta hai (Python code + data)
//   raw/...        -> docs (.md) aur source files, jo UI seedha fetch karke dikhata hai
//   docs.json      -> sections -> projects -> doc files ka tree (Docs page + Map isse bante hain)
//   meta.json      -> handbook ka commit, build time
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { zipSync } from 'fflate'

const HANDBOOK = path.resolve(process.env.HANDBOOK_DIR || '../agentic-ai-handbook')
const OUT = path.resolve(process.env.OUT_DIR || 'public/handbook')
const SKIP_DIRS = new Set(['.venv', '.git', '__pycache__', '.pytest_cache', 'node_modules', '.hitl_runs', '.memory_store'])
const CODE_EXT = new Set(['.py', '.md', '.json', '.jsonl', '.txt', '.pdf', '.csv', '.toml'])

if (!fs.existsSync(path.join(HANDBOOK, 'common/agentkit'))) {
  console.error(`Handbook not found at ${HANDBOOK}. Set HANDBOOK_DIR.`)
  process.exit(1)
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (CODE_EXT.has(path.extname(e.name))) out.push(p)
  }
  return out
}

const rel = (p) => path.relative(HANDBOOK, p).split(path.sep).join('/')
const files = walk(HANDBOOK).filter((p) => {
  const r = rel(p)
  return !/(^|\/)test_[^/]*\.py$/.test(r) && !r.startsWith('pyproject')
})

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })

const zipEntries = {}
for (const p of files) {
  const r = rel(p)
  const data = fs.readFileSync(p)
  zipEntries[r] = new Uint8Array(data)
  const dest = path.join(OUT, 'raw', r)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, data)
}
fs.writeFileSync(path.join(OUT, 'handbook.zip'), zipSync(zipEntries, { level: 6 }))

// ---- docs tree ----------------------------------------------------------
const DOC_BASES = ['README', 'CONCEPTS', 'TESTING']
function docsIn(dir) {
  const docs = {}
  for (const b of DOC_BASES) {
    const hi = path.join(dir, `${b}.md`)
    const en = path.join(dir, `${b}.en.md`)
    if (fs.existsSync(hi) || fs.existsSync(en)) {
      docs[b] = { hi: fs.existsSync(hi) ? rel(hi) : null, en: fs.existsSync(en) ? rel(en) : null }
    }
  }
  return docs
}
function titleOf(file) {
  if (!file) return null
  const text = fs.readFileSync(path.join(HANDBOOK, file), 'utf8')
  const m = text.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}
function node(dir, depth) {
  const docs = docsIn(dir)
  const main = docs.README || docs.CONCEPTS
  const children = fs
    .readdirSync(dir, { withFileTypes: true })
    // numbered folders (01-...) + koi bhi folder jisme README/CONCEPTS ho (e.g. 01-production-agent/support-desk)
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.') &&
      (/^\d\d-/.test(e.name) || ['README.md', 'CONCEPTS.md'].some((f) => fs.existsSync(path.join(dir, e.name, f)))))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => node(path.join(dir, e.name), depth + 1))
    .filter((n) => Object.keys(n.docs).length || n.children.length)
  const pyFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.py') && !f.startsWith('test_'))
  return {
    id: rel(dir) || '.',
    name: path.basename(dir),
    title: { hi: titleOf(main?.hi), en: titleOf(main?.en) },
    docs,
    files: pyFiles.map((f) => rel(path.join(dir, f))),
    children,
  }
}
const sections = [path.join(HANDBOOK, 'common'), path.join(HANDBOOK, 'lab-api')]
  .filter((d) => fs.existsSync(d))
  .concat(
    fs
      .readdirSync(HANDBOOK, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d\d-/.test(e.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => path.join(HANDBOOK, e.name)),
  )
  .map((d) => node(d, 0))
const root = { ...node(HANDBOOK, -1), children: sections }
fs.writeFileSync(path.join(OUT, 'docs.json'), JSON.stringify(root, null, 1))

// ---- runner manifest (projects.json + projects.d/*.json merged, same as labapi.project_lab.manifest)
const labapiDir = path.join(HANDBOOK, 'lab-api/labapi')
const projects = fs.existsSync(path.join(labapiDir, 'projects.json')) ? JSON.parse(fs.readFileSync(path.join(labapiDir, 'projects.json'), 'utf8')) : {}
const extraDir = path.join(labapiDir, 'projects.d')
if (fs.existsSync(extraDir)) {
  for (const f of fs.readdirSync(extraDir).filter((x) => x.endsWith('.json')).sort()) {
    for (const [pid, extra] of Object.entries(JSON.parse(fs.readFileSync(path.join(extraDir, f), 'utf8')))) {
      projects[pid] = { main: `${pid}/main.py`, ...(projects[pid] || {}), ...extra }
    }
  }
}
for (const p of Object.values(projects)) delete p.record // recorder-only config (server commands), UI ko nahi chahiye
fs.writeFileSync(path.join(OUT, 'projects.json'), JSON.stringify(projects))

let commit = 'unknown'
try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: HANDBOOK }).toString().trim()
} catch {}
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ commit, builtAt: new Date().toISOString(), files: files.length }))
console.log(`synced ${files.length} files from ${HANDBOOK} @ ${commit}`)
