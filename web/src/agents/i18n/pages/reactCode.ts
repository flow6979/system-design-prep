import type { Explain } from '../../guide/guide'

type E = Explain
type Concept = { id: string; title: string; desc: string }

export const reactCodeDict = {
  hi: {
    files: 'Files',
    loading: 'File load ho rahi hai...',
    loadFailed: 'File load nahi hui',
    lines: 'lines',
    github: 'GitHub pe kholo',
    conceptsTitle: 'Concept se code',
    conceptsSub: 'Concept pe click karo: file khulegi aur matching lines highlight hongi.',
    notFound: 'Is file mein pattern nahi mila (handbook badal gaya hoga).',
    tipConcept: 'Kisi concept pe click karo aur dekho code mein woh kahan hai.',
    viewerLabel: 'Source code',
    concepts: [
      { id: 'prompt', title: 'Prompt format', desc: 'Model ko Thought / Action / Action Input format sikhaane wala system prompt.' },
      { id: 'parse', title: 'Action / Final Answer parsing', desc: 'Model ke text se tool naam aur JSON args nikaalna, ya Final Answer pakadna.' },
      { id: 'tool', title: 'Tool chalana + Observation', desc: 'Tool run karo, error ho to bhi text bana ke "Observation:" mein wapas bhejo.' },
      { id: 'guard', title: 'max_steps guard', desc: 'Loop ki limit: jawab na mile to ruk jao aur stopped_reason = max_steps.' },
      { id: 'native', title: 'Native tool loop', desc: 'agentkit Agent: provider ke tool_calls JSON se chalne wala same ReAct loop.' },
      { id: 'errors', title: 'Tool errors model ko', desc: 'Unknown tool, galat args, exception: sab ERROR text ban ke model tak jaate hain.' },
    ] as Concept[],
    explain: (c: Concept, file: string, from: number, to: number): E => ({
      title: `${c.title}: yeh raha code`,
      flow: ['concept', file.split('/').pop() ?? file, `lines ${from}-${to}`],
      lines: [
        c.desc,
        `Highlight ki gayi lines (${from}-${to}) asli handbook file se runtime pe dhoondh ke nikaali gayi hain, isliye handbook badle to bhi sahi rahengi.`,
        'Yahi code abhi "Chalao" tab mein tumhare browser ke andar Python mein chala tha.',
      ],
      file,
    }),
  },
  en: {
    files: 'Files',
    loading: 'Loading file...',
    loadFailed: 'Could not load the file',
    lines: 'lines',
    github: 'Open on GitHub',
    conceptsTitle: 'Concept to code',
    conceptsSub: 'Click a concept: its file opens and the matching lines light up.',
    notFound: 'Pattern not found in this file (the handbook may have changed).',
    tipConcept: 'Click a concept to see where it lives in the code.',
    viewerLabel: 'Source code',
    concepts: [
      { id: 'prompt', title: 'Prompt format', desc: 'The system prompt that teaches the model the Thought / Action / Action Input format.' },
      { id: 'parse', title: 'Action / Final Answer parsing', desc: 'Extracting the tool name and JSON args from the model text, or catching the Final Answer.' },
      { id: 'tool', title: 'Tool execution + Observation', desc: 'Run the tool; even an error becomes text sent back as "Observation:".' },
      { id: 'guard', title: 'max_steps guard', desc: 'The loop limit: with no answer, stop and set stopped_reason = max_steps.' },
      { id: 'native', title: 'Native tool loop', desc: 'agentkit Agent: the same ReAct loop driven by the provider’s tool_calls JSON.' },
      { id: 'errors', title: 'Tool errors go to the model', desc: 'Unknown tool, bad args, exceptions: all become ERROR text for the model.' },
    ] as Concept[],
    explain: (c: Concept, file: string, from: number, to: number): E => ({
      title: `${c.title}: here is the code`,
      flow: ['concept', file.split('/').pop() ?? file, `lines ${from}-${to}`],
      lines: [
        c.desc,
        `The highlighted lines (${from}-${to}) are found at runtime by searching the real handbook file, so they stay correct when the handbook changes.`,
        'This is the same code that just ran as Python inside your browser on the "Run" tab.',
      ],
      file,
    }),
  },
}
