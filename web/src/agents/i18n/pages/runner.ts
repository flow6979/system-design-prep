import type { Explain } from '../../guide/guide'

export const runnerDict = {
  hi: {
    back: 'Section pe wapas',
    live: 'Browser mein asli code', replay: 'Replay (asli local run)',
    dedicatedLab: 'Interactive lab kholo', learn: 'Samjho (docs)', github: 'GitHub',
    inputs: 'Inputs', noInputs: 'Is demo ke koi inputs nahi: seedha Run dabao.',
    replayBanner: 'Replay of a real local run',
    replayWhy: 'Yeh project browser mein nahi chal sakta, isliye iske asli offline run ki recording line by line chalti hai.',
    recorded: 'Record hua', command: 'Command', reproduce: 'Khud chalana ho to terminal mein yahi command chalao.',
    offlineNote: 'Offline demo: project ka apna scripted (fake) LLM chalega. Inputs badalne se kuch jawab waise hi rahenge, kyunki script fixed hai.',
    liveNote: 'Live: tumhari LLM ({model}) pe asli calls hongi. Tokens lagenge.',
    stdinNote: 'Yeh demo input() se padhta hai; neeche diye text ki har line ek jawab ki tarah jaati hai.',
    output: 'Terminal output', outputEmpty: 'Run dabaoge to yahan wahi output aayega jo terminal mein `python main.py` chalane pe aata hai, line by line.',
    watch: 'Kya dekhna hai', files: 'Mukhya files', shims: 'Browser adjustments',
    shimText: { threads: 'Threads browser mein nahi hote: parallel kaam yahan ek ke baad ek chala (result wahi).', asyncio: 'asyncio ko browser-safe loop pe chalaya.', httpx: 'HTTP calls browser (XHR) se gayi: sirf CORS allow karne wali sites chalti hain.', subprocess: 'Subprocess ki jagah code isolated namespace mein chala.' } as Record<string, string>,
    stats: { calls: 'LLM calls', tokens: 'Tokens', time: 'Time', lines: 'Lines' },
    exit: 'exit code',
    tipRun: 'Run dabao: project ka asli main.py tumhare browser mein chalega aur output live aayega.',
    tipWatch: 'Output padhte hue right side ke "Kya dekhna hai" points match karo.',
    notFound: 'Is project ka runner nahi mila.',
    genericExplain: (title: string, calls: number, lines: number, replay: boolean): Explain => ({
      title: replay ? `${title}: recording chali` : `${title}: main.py chal gaya`,
      flow: replay ? ['recording', 'line by line', 'UI'] : ['sys.argv', 'runpy main.py', 'stdout lines', 'UI'],
      lines: replay
        ? ['Yeh project ka asli offline run tha jo local machine pe record hua.', `${lines} lines replay hui.`]
        : ['Tumhare browser ke andar Python (Pyodide) ne project ka asli main.py chalaya, bina ek line badle.', `${calls} LLM calls hui aur ${lines} output lines aayi.`, 'Runner: lab-api/labapi/project_lab.py'],
      file: 'lab-api/labapi/project_lab.py',
    }),
    viewCode: 'Code dekho', hideCode: 'Code band karo',
  },
  en: {
    back: 'Back to section',
    live: 'Real code in your browser', replay: 'Replay (real local run)',
    dedicatedLab: 'Open the interactive lab', learn: 'Learn (docs)', github: 'GitHub',
    inputs: 'Inputs', noInputs: 'This demo has no inputs: just click Run.',
    replayBanner: 'Replay of a real local run',
    replayWhy: 'This project cannot run in a browser, so a recording of its real offline run plays line by line.',
    recorded: 'Recorded', command: 'Command', reproduce: 'To run it yourself, use this command in a terminal.',
    offlineNote: 'Offline demo: the project’s own scripted (fake) LLM runs. Some answers stay the same when you change inputs, because the script is fixed.',
    liveNote: 'Live: real calls go to your LLM ({model}). This uses tokens.',
    stdinNote: 'This demo reads input(); each line of the text below is sent as one reply.',
    output: 'Terminal output', outputEmpty: 'Click Run and the same output you would see from `python main.py` in a terminal appears here, line by line.',
    watch: 'What to watch', files: 'Key files', shims: 'Browser adjustments',
    shimText: { threads: 'Browsers have no threads: parallel work ran one after another here (same result).', asyncio: 'asyncio ran on a browser-safe loop.', httpx: 'HTTP calls went through the browser (XHR): only CORS-enabled sites work.', subprocess: 'Instead of a subprocess, the code ran in an isolated namespace.' } as Record<string, string>,
    stats: { calls: 'LLM calls', tokens: 'Tokens', time: 'Time', lines: 'Lines' },
    exit: 'exit code',
    tipRun: 'Click Run: the project’s real main.py runs in your browser and the output streams live.',
    tipWatch: 'While reading the output, match it against the "What to watch" points on the right.',
    notFound: 'No runner found for this project.',
    genericExplain: (title: string, calls: number, lines: number, replay: boolean): Explain => ({
      title: replay ? `${title}: the recording played` : `${title}: main.py ran`,
      flow: replay ? ['recording', 'line by line', 'UI'] : ['sys.argv', 'runpy main.py', 'stdout lines', 'UI'],
      lines: replay
        ? ['This was the project’s real offline run, recorded on a local machine.', `${lines} lines were replayed.`]
        : ['Python inside your browser (Pyodide) ran the project’s real main.py, without changing a line.', `${calls} LLM calls and ${lines} output lines.`, 'Runner: lab-api/labapi/project_lab.py'],
      file: 'lab-api/labapi/project_lab.py',
    }),
    viewCode: 'View code', hideCode: 'Hide code',
  },
}
