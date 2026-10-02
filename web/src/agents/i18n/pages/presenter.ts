import type { Explain } from '../../guide/guide'

type E = Explain
type Step = { title: string; route: string; minutes: number; screen: string; notes: string[]; file: string }

export const presenterDict = {
  hi: {
    title: 'Presenter mode',
    sub: 'Call pe demo ke liye: bada text, step-by-step script, keys chhupi hui, aur internet gaya to offline backup.',
    agenda: 'Agenda', now: 'Abhi', onScreen: 'Screen pe kya dikhega', notes: 'Kya bolna hai',
    open: 'Yeh step kholo', prev: 'Pichla', next: 'Agla', start: 'Demo shuru karo', pause: 'Timer roko', resume: 'Timer chalu karo',
    timer: 'Timer', mask: 'Keys aur personal info chhupao', maskOn: 'ON: har jagah keys masked (gsk_****3f9a)', maskOff: 'OFF: Settings mein "Dikhao" se poori key dikh sakti hai. Screen share pe dhyan rakho!',
    offline: 'Offline backup', offlineOn: 'Offline demo chalu hai', offlineHint: 'Internet ya API gaya? Ek click mein ScriptedLLM pe switch.',
    min: 'min', stepOf: (i: number, n: number) => `Step ${i} / ${n}`,
    tipStart: 'Call shuru hote hi "Demo shuru karo" dabao: timer chalega.',
    tipOffline: 'Backup yaad rakho: internet gaya to yeh button dabana.',
    steps: [
      { title: 'LLM connect karo', route: '/agents/agents', minutes: 2, screen: 'Setup page: language, provider card, key, Test connection.', notes: ['Batao: is site ka koi server nahi, Python browser ke andar Pyodide mein chalta hai.', 'Groq ya Gemini chuno, key paste karo, Test dabao: "pong" aana chahiye.', 'Key sirf browser se provider tak jaati hai; Presenter mode mein masked rehti hai.'], file: 'lab-api/labapi/ping_lab.py' },
      { title: 'ReAct chalao (text)', route: '/agents/lab/react/run', minutes: 4, screen: 'ReAct lab: left flow diagram, center question, right live trace.', notes: ['Sample sawaal: Everest Eiffel Tower se kitne guna ooncha hai?', 'Run dabao aur trace dikhao: Thought, Action, Observation, phir Final Answer.', 'Batao: LLM text likhta hai, hamara parser use tool call mein badalta hai.'], file: '02-agentic-architectures/04-react/react_textloop.py' },
      { title: 'Native tool calling se compare', route: '/agents/lab/react/run', minutes: 3, screen: 'Same lab, "Native tool calling" toggle, dobara Run.', notes: ['Toggle badlo aur same sawaal dobara chalao.', 'Fark dikhao: Thought text gayab, provider structured tool_calls deta hai.', 'History page pe dono runs compare karo: tokens aur LLM calls.'], file: 'common/agentkit/agent.py' },
      { title: 'RAG: PDF se jawab', route: '/agents/labs/rag', minutes: 4, screen: 'RAG lab: ingest pipeline, chunks with scores, citations.', notes: ['Sample PDF ingest karo: Load, Chunk, Embed, Store stages lighten up.', 'Sawaal poochho aur [p.N] citations dikhao.', 'Batao: LLM ko sirf relevant chunks milte hain, isliye jawab grounded hai.'], file: '04-rag/02-pdf-chat/pdfchat_core.py' },
      { title: 'Multi-agent team', route: '/agents/labs/multi', minutes: 4, screen: 'Supervisor graph: researcher, writer, critic, routing JSON.', notes: ['Run team dabao: supervisor har round mein agla worker chunta hai.', 'Routing JSON dikhao: {"next": "writer", "reason": ...}.', 'Batao: max_rounds aur repeat guard infinite ping-pong rokte hain.'], file: '06-multi-agent-systems/03-supervisor-team/supervisor_team.py' },
      { title: 'Docs dikhao', route: '/agents/docs', minutes: 2, screen: 'Docs reader: Hinglish / English switch, Concepts aur Testing.', notes: ['Ek project kholo aur language switch karke dikhao: same doc, .md vs .en.md.', 'Batao: sab code aur docs GitHub pe open hain, har project offline tests ke saath.'], file: 'README.md' },
    ] as Step[],
    explain: {
      start: { title: 'Presenter mode chalu', flow: ['timer', 'script', 'masked keys'], lines: ['Timer chal gaya; agenda har step ka time batata hai.', 'Keys har jagah masked hain (Settings, header). Screen share safe hai.', 'Kuch toota to "Offline backup" dabao: sab demos ScriptedLLM pe chal jayenge.'], file: 'src/pages/Presenter.tsx' } as E,
      offline: { title: 'Offline backup chalu', flow: ['UI', 'Web Worker', 'ScriptedLLM'], lines: ['Ab koi real LLM call nahi hogi; har lab ka scripted flow chalega.', 'Flow bilkul real jaisa dikhta hai: trace, tool calls, answer. Audience ko batao ki yeh offline replay hai.', 'Wapas real LLM ke liye Settings mein provider badlo.'], file: 'common/agentkit/llm/scripted.py' } as E,
    },
  },
  en: {
    title: 'Presenter mode',
    sub: 'For demoing on a call: large text, a step-by-step script, hidden keys, and an offline backup if the internet drops.',
    agenda: 'Agenda', now: 'Now', onScreen: 'What is on screen', notes: 'What to say',
    open: 'Open this step', prev: 'Previous', next: 'Next', start: 'Start demo', pause: 'Pause timer', resume: 'Resume timer',
    timer: 'Timer', mask: 'Hide keys and personal info', maskOn: 'ON: keys are masked everywhere (gsk_****3f9a)', maskOff: 'OFF: "Show" in Settings can reveal the full key. Careful when screen sharing!',
    offline: 'Offline backup', offlineOn: 'Offline demo is on', offlineHint: 'Internet or API down? Switch to ScriptedLLM in one click.',
    min: 'min', stepOf: (i: number, n: number) => `Step ${i} / ${n}`,
    tipStart: 'When the call starts, click "Start demo": the timer starts.',
    tipOffline: 'Remember the backup: click this if the internet drops.',
    steps: [
      { title: 'Connect the LLM', route: '/agents/agents', minutes: 2, screen: 'Setup page: language, provider card, key, Test connection.', notes: ['Say: this site has no server; Python runs inside the browser in Pyodide.', 'Pick Groq or Gemini, paste the key, click Test: you should see "pong".', 'The key only travels from the browser to the provider, and stays masked in Presenter mode.'], file: 'lab-api/labapi/ping_lab.py' },
      { title: 'Run ReAct (text)', route: '/agents/lab/react/run', minutes: 4, screen: 'ReAct lab: flow diagram left, question center, live trace right.', notes: ['Sample question: how many times taller is Everest than the Eiffel Tower?', 'Click Run and walk through the trace: Thought, Action, Observation, then Final Answer.', 'Say: the LLM writes text, and our parser turns it into a tool call.'], file: '02-agentic-architectures/04-react/react_textloop.py' },
      { title: 'Compare with native tool calling', route: '/agents/lab/react/run', minutes: 3, screen: 'Same lab, "Native tool calling" toggle, Run again.', notes: ['Flip the toggle and run the same question again.', 'Show the difference: no Thought text, the provider returns structured tool_calls.', 'Compare both runs on the History page: tokens and LLM calls.'], file: 'common/agentkit/agent.py' },
      { title: 'RAG: answers from a PDF', route: '/agents/labs/rag', minutes: 4, screen: 'RAG lab: ingest pipeline, chunks with scores, citations.', notes: ['Ingest the sample PDF: the Load, Chunk, Embed, Store stages light up.', 'Ask a question and point at the [p.N] citations.', 'Say: the LLM only sees the relevant chunks, so the answer is grounded.'], file: '04-rag/02-pdf-chat/pdfchat_core.py' },
      { title: 'Multi-agent team', route: '/agents/labs/multi', minutes: 4, screen: 'Supervisor graph: researcher, writer, critic, routing JSON.', notes: ['Click Run team: each round the supervisor picks the next worker.', 'Show the routing JSON: {"next": "writer", "reason": ...}.', 'Say: max_rounds and the repeat guard stop endless ping-pong.'], file: '06-multi-agent-systems/03-supervisor-team/supervisor_team.py' },
      { title: 'Show the docs', route: '/agents/docs', minutes: 2, screen: 'Docs reader: Hinglish / English switch, Concepts and Testing.', notes: ['Open a project and switch language: same doc, .md vs .en.md.', 'Say: all code and docs are open on GitHub, and every project has offline tests.'], file: 'README.md' },
    ] as Step[],
    explain: {
      start: { title: 'Presenter mode is on', flow: ['timer', 'script', 'masked keys'], lines: ['The timer is running; the agenda shows the time budget per step.', 'Keys are masked everywhere (Settings, header). Screen sharing is safe.', 'If anything breaks, click "Offline backup": every demo switches to ScriptedLLM.'], file: 'src/pages/Presenter.tsx' } as E,
      offline: { title: 'Offline backup is on', flow: ['UI', 'Web Worker', 'ScriptedLLM'], lines: ['No real LLM calls from now on; each lab plays its scripted flow.', 'It looks exactly like the real thing: trace, tool calls, answer. Tell the audience it is an offline replay.', 'To go back to a real LLM, change the provider in Settings.'], file: 'common/agentkit/llm/scripted.py' } as E,
    },
  },
}
