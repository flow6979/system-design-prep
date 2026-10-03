import { createContext, useContext, useMemo, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'
import http from 'highlight.js/lib/languages/http'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('http', http)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('cql', sql)
hljs.registerLanguage('promql', sql)
hljs.registerLanguage('cypher', sql)

export type CodeLang = 'java' | 'cpp'
export const CODE_LANGS: { id: CodeLang; label: string }[] = [
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

/** Which of the paired java/cpp blocks to show (and how to switch). Other languages always show. */
export const CodeLangContext = createContext<{ lang: CodeLang; setLang: (l: CodeLang) => void }>({ lang: 'java', setLang: () => {} })

/** Set in chat replies: Gemini may answer in one language only, so never hide its code */
export const ShowAllCodeContext = createContext(false)

export const isPairedLang = (lang?: string): lang is CodeLang => lang === 'java' || lang === 'cpp'

export function useVisibleCode(lang?: string): boolean {
  const selected = useContext(CodeLangContext).lang
  const showAll = useContext(ShowAllCodeContext)
  return showAll || !isPairedLang(lang) || lang === selected
}

export function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const { lang: selected, setLang } = useContext(CodeLangContext)
  const showAll = useContext(ShowAllCodeContext)
  const html = useMemo(() => {
    // hljs escapes the source, so this HTML only contains its own spans
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
    return null
  }, [code, lang])
  const label = CODE_LANGS.find((l) => l.id === lang)?.label ?? lang

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: user can still select the text */
    }
  }

  return (
    <div className="code-block">
      {lang && (
        <div className="code-head">
          {isPairedLang(lang) && !showAll ? <LangToggle value={selected} onChange={setLang} small /> : <span className="mono">{label}</span>}
          <button className="link small" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre>
        {html ? <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </div>
  )
}

export function LangToggle({ value, onChange, small }: { value: CodeLang; onChange: (l: CodeLang) => void; small?: boolean }) {
  return (
    <div className={`seg ${small ? 'small' : ''}`} role="radiogroup" aria-label="Code language">
      {CODE_LANGS.map((l) => (
        <button key={l.id} role="radio" aria-checked={value === l.id} className={value === l.id ? 'on' : ''} onClick={() => onChange(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}
