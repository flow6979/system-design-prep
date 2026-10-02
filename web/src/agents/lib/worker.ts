// Worker bridge: UI yahin se Python (Pyodide worker) ko kaam deta hai.
//
//   await bridge.init(p => setProgress(p))            // pehli baar ~10-20s (Pyodide + handbook download)
//   const out = await bridge.run(request, ev => ...)   // har step ka event live aata hai
//
// Ek waqt pe ek hi run chalta hai (Python single-threaded hai). "Stop" = worker restart.

export type LabEvent = { type: string; kind?: string; text?: string; [k: string]: unknown }
export type LabError = { kind: 'auth' | 'rate_limit' | 'not_found' | 'network' | 'bad_request' | 'server' | 'internal'; status: number | null; message: string }
export type LabResult<T = Record<string, unknown>> = { ok: true; result: T } | { ok: false; error: LabError }
export type LabRequest = {
  lab: string
  params?: Record<string, unknown>
  llm?: { spec?: string; keys?: Record<string, string>; embed?: string }
  offline?: boolean
  lang?: 'hi' | 'en'
  pip?: string[]
}
export type InitProgress = { stage: string; pct: number }

type Pending = { onEvent?: (e: LabEvent) => void; onProgress?: (p: InitProgress) => void; resolve: (v: any) => void; reject: (e: Error) => void }

class WorkerBridge {
  private worker: Worker | null = null
  private seq = 0
  private pending = new Map<number, Pending>()
  private readyPromise: Promise<{ commit?: string }> | null = null
  private queue: Promise<unknown> = Promise.resolve()
  ready = false

  private spawn() {
    this.worker = new Worker(`${import.meta.env.BASE_URL}pyworker.js`, { type: 'module' })
    this.worker.onmessage = (e: MessageEvent) => {
      const msg = e.data
      const p = this.pending.get(msg.id)
      if (!p) return
      if (msg.type === 'event') p.onEvent?.(msg.event)
      else if (msg.type === 'progress') p.onProgress?.({ stage: msg.stage, pct: msg.pct })
      else if (msg.type === 'ready' || msg.type === 'result') {
        this.pending.delete(msg.id)
        p.resolve(msg.type === 'ready' ? msg.meta : msg.result)
      } else if (msg.type === 'fatal') {
        this.pending.delete(msg.id)
        p.reject(new Error(msg.message))
      }
    }
    this.worker.onerror = (e) => {
      for (const p of this.pending.values()) p.reject(new Error(e.message || 'worker crashed'))
      this.pending.clear()
    }
  }

  private send<T>(msg: Record<string, unknown>, handlers: Omit<Pending, 'resolve' | 'reject'> = {}): Promise<T> {
    if (!this.worker) this.spawn()
    const id = ++this.seq
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { ...handlers, resolve, reject })
      this.worker!.postMessage({ id, ...msg })
    })
  }

  init(onProgress?: (p: InitProgress) => void): Promise<{ commit?: string }> {
    if (!this.readyPromise) {
      this.readyPromise = this.send<{ commit?: string }>({ type: 'init' }, { onProgress }).then((m) => {
        this.ready = true
        return m
      })
      this.readyPromise.catch(() => {
        this.readyPromise = null
      })
    }
    return this.readyPromise
  }

  /** Lab chalao. Runs queue mein lagte hain taaki ek ke baad ek chalein. */
  run<T = Record<string, unknown>>(request: LabRequest, onEvent?: (e: LabEvent) => void): Promise<LabResult<T>> {
    const job = this.queue.then(async () => {
      await this.init()
      return this.send<LabResult<T>>({ type: 'run', request }, { onEvent })
    })
    this.queue = job.catch(() => undefined)
    return job
  }

  /** Chalte run ko rokna: Python ko beech mein nahi rok sakte, isliye worker hi restart. */
  restart() {
    this.worker?.terminate()
    for (const p of this.pending.values()) p.reject(new Error('stopped'))
    this.pending.clear()
    this.worker = null
    this.readyPromise = null
    this.ready = false
    this.queue = Promise.resolve()
  }
}

export const bridge = new WorkerBridge()
