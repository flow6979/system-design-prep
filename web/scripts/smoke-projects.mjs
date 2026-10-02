// Har handbook project ka asli main.py OFFLINE, Pyodide ke andar (generic "project" lab se).
//   node scripts/smoke-projects.mjs                 # saare projects (labapi/projects.json se)
//   node scripts/smoke-projects.mjs 04-rag          # sirf matching ids
// CI deploy se pehle chalta hai: koi project browser mein toota to deploy ruk jata hai.
import fs from 'node:fs'
import { loadPyodide } from 'pyodide'

const zip = new Uint8Array(fs.readFileSync(process.env.HANDBOOK_ZIP || 'public/handbook/handbook.zip'))
const py = await loadPyodide()
await py.loadPackage(['pydantic', 'micropip', 'httpx'])
py.unpackArchive(zip, 'zip', { extractDir: '/handbook' })
py.runPython(`
import sys, os
sys.path[:0] = ["/handbook/common", "/handbook/lab-api"]
import labapi, json
from labapi.project_lab import manifest
`)
const man = JSON.parse(py.runPython('json.dumps(manifest())'))
const filters = process.argv.slice(2)
let failed = 0
for (const [id, info] of Object.entries(man)) {
  if (filters.length && !filters.some((f) => id.includes(f))) continue
  if (info.pip?.length) await py.pyimport('micropip').install(info.pip)
  const events = []
  py.globals.set('_emit_js', (s) => events.push(JSON.parse(s)))
  py.globals.set('_req_json', JSON.stringify({ lab: 'project', params: { project: id }, offline: true }))
  const t0 = Date.now()
  const res = JSON.parse(py.runPython(`json.dumps(labapi.run(json.loads(_req_json), lambda ev: _emit_js(json.dumps(ev, default=str))), default=str)`))
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  if (res.ok) {
    const r = res.result
    console.log(`ok   ${id}  lines=${r.lines} llm=${r.llm_calls} ${secs}s${r.replay ? '  (replay)' : ''}${r.shims.length ? '  shims=' + r.shims.join(',') : ''}`)
  } else {
    failed++
    console.log(`FAIL ${id}  ${secs}s\n     ${(res.error.message || '').split('\n').slice(-6).join('\n     ')}`)
  }
}
console.log(failed ? `${failed} project(s) failed` : 'all projects ok')
process.exit(failed ? 1 : 0)
