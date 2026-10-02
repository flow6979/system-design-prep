// Live trace list: lab ke events ko ek-ek card ki tarah dikhao. Har lab isi ko use kar sakta hai,
// ya apna custom view bana sakta hai (e.g. RAG chunks, multi-agent graph).
import type { ReactNode } from 'react'
import type { LabEvent } from '../lib/worker'

export type TraceItem = { key: string; kind: string; text: ReactNode; meta?: string; mono?: boolean; tone?: 'teal' | 'amber' | 'violet' | 'solid' | 'gray' | 'red' }

const TONES: Record<string, [string, string]> = {
  teal: ['var(--teal-soft)', 'var(--teal-dark)'],
  amber: ['var(--amber-soft)', 'var(--amber-dark)'],
  violet: ['var(--violet-soft)', 'var(--violet)'],
  solid: ['var(--teal)', 'var(--accent-ink)'],
  gray: ['var(--chip)', 'var(--muted)'],
  red: ['var(--red-soft)', 'var(--red)'],
}

export function TraceList({ items, empty }: { items: TraceItem[]; empty?: ReactNode }) {
  if (!items.length) return <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{empty}</p>
  return (
    <ol aria-live="polite" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it) => {
        const [bg, fg] = TONES[it.tone ?? 'gray']
        return (
          <li key={it.key} className="al-in" style={{ display: 'flex', gap: 10, padding: '10px 12px', border: '1px solid var(--line-3)', borderRadius: 10, background: 'var(--panel-soft)' }}>
            <span style={{ flexShrink: 0, alignSelf: 'flex-start', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{it.kind}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word', fontFamily: it.mono ? 'var(--font-mono)' : undefined, whiteSpace: 'pre-wrap' }}>{it.text}</span>
              {it.meta && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{it.meta}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** llm_call events ko "LLM call #n · tokens · ms" meta string mein badlo (agla step inse joda jaata hai). */
export function llmMeta(ev: LabEvent): string {
  const tok = Number(ev.input_tokens ?? 0) + Number(ev.output_tokens ?? 0)
  return `LLM call #${ev.n} · ${tok} tok · ${ev.ms} ms${ev.role ? ` · ${ev.role}` : ''}`
}
