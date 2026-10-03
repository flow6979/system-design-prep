import { useState } from 'react'
import { useTr } from '../i18n'
import { href } from '../router'
import { readLocal, writeLocal } from '../store'

/** "How to use Viewinter": what each feature is for, and a suggested week */
export function Guide() {
  const tr = useTr()
  const [open, setOpen] = useState<boolean>(() => readLocal('hld.guide.open', true))
  const toggle = () => {
    setOpen(!open)
    writeLocal('hld.guide.open', !open)
  }

  const cards: [string, string, string, string?][] = [
    ['📚', tr('Padho', 'Study'), tr('Left sidebar me subjects: HLD, LLD, Java, Databases, CS, Behavioral, RAG, Agentic AI. Har page interview ke hisaab se likha hai: example, diagram, "interview me bolo" aur common galtiyan.', 'Subjects live in the left sidebar: HLD, LLD, Java, Databases, CS, Behavioral, RAG, Agentic AI. Every page is written for interviews: examples, diagrams, lines to say and common mistakes.')],
    ['📖⭐⚡', tr('3 tarah se padho', '3 ways to read'), tr('Har page ke upar switch: 📖 Poora page (pehli baar), ⭐ Revision (sirf sabse zaroori sections ya recap), ⚡ Quick look (1 minute ka cheat sheet, interview se theek pehle).', 'A switch on top of every page: 📖 Full page (first read), ⭐ Revision (only the key sections or the recap), ⚡ Quick look (a 1-minute cheat sheet, right before the interview).')],
    ['✅', 'Checklist', tr('Page ke end me checklist tick karo. Sab tick = page poora; dashboard ka % aur plan isi se chalte hain.', 'Tick the checklist at the end of a page. All ticked = page done; the dashboard % and your plan use it.')],
    ['✦', tr('Gemini se poochho', 'Ask Gemini'), tr('Right panel (top bar ka panel icon) me Notes, "Ask Gemini" jo usi page ke context se jawab deta hai, aur HLD problems pe 45-min Mock interview with scorecard. Upar 🔑 me apni free Gemini key daalo.', 'The right panel (panel icon in the top bar) has Notes, "Ask Gemini" that answers from the page itself, and a 45-min Mock interview with a scorecard on HLD problems. Add your free Gemini key under 🔑 in the top bar.'), 'https://aistudio.google.com/apikey'],
    ['🎯', 'Quiz', tr('Har subject ke MCQs; khatam hone pe naye apne aap bante hain. ☆ se sawal Starred bucket me rakho, "Galat wale dobara" se weak points. Samajh na aaye to "Gemini se poochho".', 'MCQs for every subject; new ones appear when you run out. ☆ saves a question to Starred, "Retry wrong" drills weak spots. Stuck? "Ask Gemini" under the question.'), href('quiz')],
    ['📅', tr('Mera plan', 'My plan'), tr('Din, ghante, experience aur subjects batao: din-ba-din plan ban jaata hai, must-do pehle. Ya apni list se plan banao.', 'Give days, hours, experience and subjects and get a day-by-day plan, must-do first. Or plan from one of your lists.'), href('plan')],
    ['📋', tr('Meri lists', 'My lists'), tr('Apni lists banao (jaise "Amazon round", "weak topics") aur baar baar revise karo. "Quick look: sab ek saath" se poori list 10 minute me.', 'Make your own lists ("Amazon round", "weak topics") and revise them again and again. "Quick look: all at once" covers a whole list in 10 minutes.'), href('lists')],
    ['📄', tr('Resume se sawal', 'Resume questions'), tr('Resume upload karo; Gemini tumhare projects aur skills pe interviewer jaise sawal banata hai aur tumhare jawab pe feedback deta hai.', 'Upload your resume; Gemini asks interviewer-style questions on your projects and skills and grades your answers.'), href('resume')],
    ['🧪', tr('Agentic AI labs', 'Agentic AI labs'), tr('ReAct, RAG, multi-agent jaise labs browser me hi chalao (Python bhi). AI/ML roles ke interviews ke liye.', 'Run ReAct, RAG and multi-agent labs right in the browser (Python included). For AI/ML role interviews.'), href('agents')],
  ]

  const week = [
    tr('Profile me interview date daalo, phir "Mera plan" banao.', 'Set your interview date in the profile, then make "My plan".'),
    tr('Roz: plan ke pages 📖 Poora page me padho, checklist tick karo, phir us subject ka quiz.', 'Daily: read the plan pages in 📖 Full page, tick the checklist, then do that subject’s quiz.'),
    tr('Jo topic kamzor lage use ＋ List me daalo; HLD problems pe ek Mock interview do.', 'Add weak topics to a ＋ List; take a Mock interview on an HLD problem.'),
    tr('Interview se ek din pehle: ⭐ Revision + ⭐ Starred quiz.', 'The day before: ⭐ Revision + the ⭐ Starred quiz.'),
    tr('Interview se 30 min pehle: apni list ka ⚡ Quick look.', '30 minutes before: ⚡ Quick look of your list.'),
  ]

  return (
    <section className="guide">
      <button className="guide-head" aria-expanded={open} onClick={toggle}>
        <h2>{tr('Viewinter kaise use karein', 'How to use Viewinter')}</h2>
        <span className="muted small">{open ? tr('Chhupao ▾', 'Hide ▾') : tr('Dikhao ▸', 'Show ▸')}</span>
      </button>
      {open && (
        <>
          <div className="guide-grid">
            {cards.map(([icon, title, text, link]) => {
              const body = (
                <>
                  <span className="guide-icon" aria-hidden="true">
                    {icon}
                  </span>
                  <b>{title}</b>
                  <span className="small">{text}</span>
                </>
              )
              return link ? (
                <a key={title} className="guide-card" href={link} {...(link.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                  {body}
                </a>
              ) : (
                <div key={title} className="guide-card">
                  {body}
                </div>
              )
            })}
          </div>
          <div className="guide-week">
            <b>{tr('Suggested flow', 'Suggested flow')}</b>
            <ol>
              {week.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  )
}
