import type { Explain } from '../../guide/guide'

type E = Explain
export const docsDict = {
  hi: {
    tree: 'Handbook', langLabel: 'Docs kis language mein padhne hain?',
    onPage: 'Is page pe', github: 'GitHub pe kholo', run: 'Yeh project chalao',
    loading: 'Load ho raha hai...', missing: 'Is node ke liye yeh doc file nahi mili.',
    toggle: 'Kholo / band karo', root: 'Handbook overview',
    fallback: (l: string) => `Is language ki file nahi hai, isliye ${l} version dikh raha hai.`,
    tipLang: 'Language badal ke dekho: same doc, dusri file (.md ya .en.md).',
    tipTab: 'Ab Testing tab kholo: project chalane aur tinker karne ke steps.',
    explainLang: (file: string): E => ({ title: 'Wahi doc, dusri file', flow: ['Hinglish doc', 'English doc', 'Markdown'], lines: [`Ab ${file} dikh raha hai.`, 'Handbook mein har doc ki do files saath rehti hain: .md (Hinglish) aur .en.md (English), dono ke top pe switcher line.', 'Yahan global language badli hai, isliye poori app bhi usi language mein aa gayi.'], file }),
    explainTab: (file: string): E => ({ title: 'Testing doc khula', flow: ['setup', 'offline tests', 'tinker'], lines: ['Testing doc batata hai project kaise chalayein, offline tests kaise chalayein, aur kya kya badal ke dekh sakte ho.', 'Jin projects ka "Live" lab hai, unhe yahin browser mein bhi chala sakte ho ("Yeh project chalao").'], file }),
  },
  en: {
    tree: 'Handbook', langLabel: 'Which language do you want the docs in?',
    onPage: 'On this page', github: 'Open on GitHub', run: 'Run this project',
    loading: 'Loading...', missing: 'This doc file was not found for this node.',
    toggle: 'Expand / collapse', root: 'Handbook overview',
    fallback: (l: string) => `No file in this language, showing the ${l} version.`,
    tipLang: 'Switch the language: same doc, different file (.md or .en.md).',
    tipTab: 'Now open the Testing tab: steps to run and tinker with the project.',
    explainLang: (file: string): E => ({ title: 'Same doc, different file', flow: ['Hinglish doc', 'English doc', 'Markdown'], lines: [`Now showing ${file}.`, 'Every handbook doc has two files side by side: .md (Hinglish) and .en.md (English), each with a switcher line at the top.', 'This switched the global language, so the whole app follows it too.'], file }),
    explainTab: (file: string): E => ({ title: 'Testing doc opened', flow: ['setup', 'offline tests', 'tinker'], lines: ['The Testing doc explains how to run the project, run its offline tests, and what to change to learn more.', 'Projects with a "Live" lab can also run right here in the browser ("Run this project").'], file }),
  },
}
