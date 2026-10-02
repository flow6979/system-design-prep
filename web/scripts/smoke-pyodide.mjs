// Pyodide smoke test (Node): handbook.zip ko wahi Pyodide version mein kholo jo browser use
// karta hai, aur har lab ko OFFLINE chala ke dekho. CI mein deploy se pehle chalta hai.
//
//   node scripts/smoke-pyodide.mjs            (pehle `npm run sync` chahiye)
import fs from 'node:fs'
import { loadPyodide } from 'pyodide'

const zip = new Uint8Array(fs.readFileSync(process.env.HANDBOOK_ZIP || 'public/handbook/handbook.zip'))
const py = await loadPyodide()
await py.loadPackage(['pydantic', 'micropip'])
py.unpackArchive(zip, 'zip', { extractDir: '/handbook' })
py.runPython(`
import sys, os
sys.path[:0] = ["/handbook/common", "/handbook/lab-api"]
os.environ["AGENT_VERBOSE"] = "0"
import labapi, json
`)

const catalog = JSON.parse(py.runPython('json.dumps(labapi.catalog())'))
const only = process.argv.slice(2)
let failed = 0
for (const lab of catalog) {
  if (only.length && !only.includes(lab.id)) continue
  const cases = lab.smoke_cases || [{}]
  for (const params of cases) {
    const events = []
    py.globals.set('_emit_js', (s) => events.push(JSON.parse(s)))
    const pip = lab.pip || []
    if (pip.length) await py.pyimport('micropip').install(pip)
    py.globals.set('_req_json', JSON.stringify({ lab: lab.id, params, offline: true }))
    const res = JSON.parse(py.runPython(`json.dumps(labapi.run(json.loads(_req_json), lambda ev: _emit_js(json.dumps(ev, default=str))), default=str)`))
    const tag = `${lab.id} ${JSON.stringify(params)}`
    if (res.ok) console.log(`ok   ${tag}  events=${events.length}`)
    else {
      failed++
      console.log(`FAIL ${tag}\n     ${JSON.stringify(res.error).slice(0, 600)}`)
    }
  }
}
process.exit(failed ? 1 : 0)
