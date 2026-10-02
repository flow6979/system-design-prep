// ReAct lab, Code tab: asli handbook source (fetchRaw) + "concept -> code" map.
// Highlight lines runtime pe regex search se nikalte hain, taaki handbook badle to bhi sahi rahein.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../components/ui'
import { Tip, useGuide } from '../../guide/guide'
import { useT } from '../../i18n'
import { githubFile } from '../../i18n/common'
import { reactCodeDict } from '../../i18n/pages/reactCode'
import { fetchRaw, findNode, loadTree } from '../../lib/handbook'
import '../../styles/pages/react-code.css'

const PROJECT = '02-agentic-architectures/04-react'
const AGENT_PY = 'common/agentkit/agent.py'
const TEXTLOOP = `${PROJECT}/react_textloop.py`

/** Ek highlight range: `start` line se `end` line tak (ya `len` lines). */
type Range = { start: RegExp; end?: RegExp; len?: number }
const CONCEPT_CODE: Record<string, { file: string; ranges: Range[] }> = {
  prompt: { file: TEXTLOOP, ranges: [{ start: /^REACT_SYSTEM\s*=/, end: /^"""\s*$/ }] },
  parse: { file: TEXTLOOP, ranges: [{ start: /^_FINAL\s*=/, len: 2 }, { start: /^def parse_step/, end: /return \("action"/ }] },
  tool: { file: TEXTLOOP, ranges: [{ start: /_, name, args, thought = parsed/, end: /Message\.user\(f"Observation/ }] },
  guard: { file: TEXTLOOP, ranges: [{ start: /for _ in range\(max_steps\)/, len: 1 }, { start: /result\.answer = "Stopped/, end: /stopped_reason = "max_steps"/ }] },
  native: { file: AGENT_PY, ranges: [{ start: /def run\(self, user_input/, end: /return AgentResult\("I could not finish/ }] },
  errors: { file: AGENT_PY, ranges: [{ start: /def _run_tool/, end: /return f"ERROR: \{type\(e\)/ }] },
}

function findLines(text: string, ranges: Range[]): Set<number> {
  const lines = text.split('\n')
  const out = new Set<number>()
  for (const r of ranges) {
    const s = lines.findIndex((l) => r.start.test(l))
    if (s === -1) continue
    let e = s + (r.len ?? 1) - 1
    if (r.end) {
      const rel = lines.slice(s + 1).findIndex((l) => r.end!.test(l))
      e = rel === -1 ? s : s + 1 + rel
    }
    for (let i = s; i <= Math.min(e, lines.length - 1); i++) out.add(i)
  }
  return out
}

// ---- chhota Python highlighter (keywords, strings, comments; triple quotes lines ke across) ----
const KW = new Set('def class return if elif else for while in not and or import from as try except finally raise with lambda None True False is pass break continue yield async await'.split(' '))
const TOKEN = /(#.*$)|("""|''')|(f?"(?:[^"\\]|\\.)*"|f?'(?:[^'\\]|\\.)*')|\b([A-Za-z_]\w*)\b/g

function highlight(text: string): ReactNode[][] {
  let inTriple: string | null = null
  return text.split('\n').map((line, li) => {
    const parts: ReactNode[] = []
    let pos = 0
    let key = 0
    const push = (s: string, cls?: string) => {
      if (!s) return
      parts.push(cls ? <span key={`${li}-${key++}`} className={cls}>{s}</span> : s)
    }
    if (inTriple) {
      const idx = line.indexOf(inTriple)
      if (idx === -1) {
        push(line, 'rc-str')
        return parts
      }
      push(line.slice(0, idx + 3), 'rc-str')
      pos = idx + 3
      inTriple = null
    }
    TOKEN.lastIndex = pos
    let m: RegExpExecArray | null
    while ((m = TOKEN.exec(line))) {
      push(line.slice(pos, m.index))
      if (m[1]) push(m[1], 'rc-com')
      else if (m[2]) {
        const close = line.indexOf(m[2], m.index + 3)
        if (close === -1) {
          push(line.slice(m.index), 'rc-str')
          inTriple = m[2]
          pos = line.length
          break
        }
        push(line.slice(m.index, close + 3), 'rc-str')
        TOKEN.lastIndex = close + 3
      } else if (m[3]) push(m[3], 'rc-str')
      else if (m[4]) push(m[4], KW.has(m[4]) ? 'rc-kw' : undefined)
      pos = TOKEN.lastIndex
    }
    push(line.slice(pos))
    return parts
  })
}

export default function ReactCode() {
  const t = useT(reactCodeDict)
  const g = useGuide('react-code', ['concept'])
  const [files, setFiles] = useState<string[]>([TEXTLOOP, AGENT_PY])
  const [file, setFile] = useState(TEXTLOOP)
  const [text, setText] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  const [concept, setConcept] = useState<string | null>(null)
  const viewer = useRef<HTMLDivElement>(null)
  const pendingExplain = useRef<string | null>(null)

  useEffect(() => {
    loadTree()
      .then((root) => {
        const node = findNode(root, PROJECT)
        if (node) setFiles(Array.from(new Set([...node.files, AGENT_PY])))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let live = true
    setText(null)
    setErr(false)
    fetchRaw(file)
      .then((s) => live && setText(s))
      .catch(() => live && setErr(true))
    return () => {
      live = false
    }
  }, [file])

  const hl = useMemo(() => {
    if (!text || !concept) return new Set<number>()
    const cc = CONCEPT_CODE[concept]
    return cc.file === file ? findLines(text, cc.ranges) : new Set<number>()
  }, [text, concept, file])
  const rendered = useMemo(() => (text ? highlight(text) : []), [text])

  // Pehli highlighted line tak scroll; concept click ke baad "Kya hua?" card.
  useEffect(() => {
    if (!viewer.current || !hl.size) return
    const first = Math.min(...hl)
    const el = viewer.current.querySelector<HTMLElement>(`[data-line="${first}"]`)
    if (el) viewer.current.scrollTop = el.offsetTop - 40
    if (pendingExplain.current && concept === pendingExplain.current) {
      const c = t.concepts.find((x) => x.id === concept)!
      g.done('concept', t.explain(c, file, first + 1, Math.max(...hl) + 1))
      pendingExplain.current = null
    }
  }, [hl]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id: string) => {
    setConcept(id)
    pendingExplain.current = id
    if (CONCEPT_CODE[id].file !== file) setFile(CONCEPT_CODE[id].file)
  }

  const missing = !!(text && concept && CONCEPT_CODE[concept].file === file && hl.size === 0)
  const lineCount = text ? text.split('\n').length : 0

  return (
    <div className="rc-grid">
      <nav className="panel col" aria-label={t.files} style={{ gap: 4, padding: 12 }}>
        <span className="eyebrow" style={{ padding: '4px 8px 8px' }}>{t.files}</span>
        {files.map((f) => (
          <button key={f} type="button" className="rc-file" aria-current={f === file} onClick={() => setFile(f)} title={f}>
            <Icon name="code" size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.split('/').pop()}</span>
          </button>
        ))}
      </nav>

      <section className="col" style={{ gap: 10, minWidth: 0 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, color: 'var(--teal)', wordBreak: 'break-all' }}>
            {file} {lineCount ? <span className="muted">· {lineCount} {t.lines}</span> : null}
          </span>
          <a href={githubFile(file)} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
            {t.github} <Icon name="external" size={14} />
          </a>
        </div>
        {missing && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber)' }}>{t.notFound}</p>}
        <div ref={viewer} className="rc-viewer" role="region" aria-label={t.viewerLabel} tabIndex={0} style={{ position: 'relative' }}>
          {err && <div style={{ padding: '0 16px', color: 'var(--explain)' }}>{t.loadFailed}</div>}
          {!text && !err && <div style={{ padding: '0 16px', color: 'var(--on-dark-muted)' }}>{t.loading}</div>}
          {rendered.map((parts, i) => (
            <div key={i} data-line={i} className={`rc-line${hl.has(i) ? ' hl' : ''}`}>
              <span className="rc-ln">{i + 1}</span>
              <span className="rc-code">{parts.length ? parts : ' '}</span>
            </div>
          ))}
        </div>
      </section>

      <aside className="panel col" style={{ gap: 10 }}>
        <h2 className="h2" style={{ fontSize: 18 }}>{t.conceptsTitle}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t.conceptsSub}</p>
        <Tip show={g.is('concept')}>{t.tipConcept}</Tip>
        {t.concepts.map((c) => (
          <button key={c.id} type="button" className={`rc-concept ${g.pulse('concept')}`} aria-pressed={concept === c.id} onClick={() => pick(c.id)}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
            <span className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{c.desc}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--teal)' }}>{CONCEPT_CODE[c.id].file.split('/').pop()}</span>
          </button>
        ))}
      </aside>
    </div>
  )
}
