/* "BFF in the browser": yeh Web Worker Pyodide (Python in WebAssembly) chalata hai aur
 * handbook ka asli Python code (agentkit + labapi + projects) usme load karta hai.
 *
 * Main thread <-> worker messages:
 *   -> {id, type: "init"}                        <- {id, type: "progress", stage, pct} ... {id, type: "ready", meta}
 *   -> {id, type: "run", request: {...}}         <- {id, type: "event", event} (har step) ... {id, type: "result", result}
 *   -> {id, type: "pip", packages: [...]}        <- {id, type: "result", result: {ok}}
 *   <- {id, type: "fatal", message}              (kuch bhi toota)
 *
 * Python sync code hai; LLM calls ke liye agentkit worker ke andar synchronous XMLHttpRequest
 * use karta hai (common/agentkit/llm/http.py). Isliye yeh sab worker mein hi chalna chahiye.
 */
// Module worker (Pyodide 314+ ESM hai): new Worker(url, { type: 'module' })
const PYODIDE_VERSION = '314.0.7'
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const BASE = self.location.href.replace(/pyworker\.js.*$/, '')
const pyodideModule = import(`${CDN}pyodide.mjs`) // onmessage turant lage, isliye yahan await nahi

let pyodide = null
let readyPromise = null

function post(msg) {
  self.postMessage(msg)
}

async function init(id) {
  const progress = (stage, pct) => post({ id, type: 'progress', stage, pct })
  progress('pyodide', 5)
  const { loadPyodide } = await pyodideModule
  pyodide = await loadPyodide({ indexURL: CDN })
  progress('packages', 45)
  await pyodide.loadPackage(['pydantic', 'micropip', 'httpx'])
  progress('handbook', 75)
  const [zipRes, metaRes] = await Promise.all([fetch(`${BASE}handbook/handbook.zip`), fetch(`${BASE}handbook/meta.json`)])
  if (!zipRes.ok) throw new Error(`handbook.zip HTTP ${zipRes.status}`)
  pyodide.unpackArchive(await zipRes.arrayBuffer(), 'zip', { extractDir: '/handbook' })
  const meta = metaRes.ok ? await metaRes.json() : {}
  progress('python', 90)
  pyodide.runPython(`
import sys, os
sys.path[:0] = ["/handbook/common", "/handbook/lab-api"]
os.environ.setdefault("AGENT_VERBOSE", "0")
import labapi, json
`)
  progress('done', 100)
  return meta
}

function ensureReady(id) {
  if (!readyPromise) readyPromise = init(id)
  return readyPromise
}

async function run(id, request) {
  await ensureReady(id)
  const needs = request.pip || []
  if (needs.length) {
    const micropip = pyodide.pyimport('micropip')
    await micropip.install(needs)
  }
  pyodide.globals.set('_emit_js', (s) => post({ id, type: 'event', event: JSON.parse(s) }))
  pyodide.globals.set('_req_json', JSON.stringify(request))
  const out = pyodide.runPython(`
_res = labapi.run(json.loads(_req_json), lambda ev: _emit_js(json.dumps(ev, default=str)))
json.dumps(_res, default=str)
`)
  return JSON.parse(out)
}

self.onmessage = async (e) => {
  const { id, type } = e.data
  try {
    if (type === 'init') {
      const meta = await ensureReady(id)
      post({ id, type: 'ready', meta })
    } else if (type === 'run') {
      const result = await run(id, e.data.request)
      post({ id, type: 'result', result })
    } else if (type === 'pip') {
      await ensureReady(id)
      await pyodide.pyimport('micropip').install(e.data.packages)
      post({ id, type: 'result', result: { ok: true } })
    }
  } catch (err) {
    post({ id, type: 'fatal', message: String((err && err.message) || err) })
  }
}
