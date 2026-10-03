import { useState } from 'react'
import { useTr } from '../i18n'
import { href } from '../router'
import { readLocal, writeLocal } from '../store'
import { Icon, type IconName } from './Icon'

/** "How to use Viewinter": what each feature is for, and a suggested flow */
export function Guide() {
  const tr = useTr()
  const [open, setOpen] = useState<boolean>(() => readLocal('hld.guide.open', true))
  const toggle = () => {
    setOpen(!open)
    writeLocal('hld.guide.open', !open)
  }

  const cards: [IconName, string, string, string?][] = [
    ['book', tr('Padho', 'Study'), tr('Sidebar me saare subjects. Har page interview ke liye likha hai.', 'Every subject is in the sidebar, each page written for interviews.')],
    ['bolt', tr('3 reading modes', '3 reading modes'), tr('Full page pehli baar, Revision sirf zaroori, Quick look 1 minute me.', 'Full page first, Revision for the key parts, Quick look in a minute.')],
    ['check', 'Checklist', tr('Page ke end me tick karo. Progress aur plan isi se chalte hain.', 'Tick it at the end of a page. Progress and your plan run on it.')],
    ['sparkle', tr('Ask AI', 'Ask AI'), tr('Right panel me notes, page pe sawal, aur HLD mock interview.', 'Right panel: notes, questions on the page, and HLD mock interviews.')],
    ['target', 'Quiz', tr('Endless MCQs. ☆ se star karo, galat wale dobara karo.', 'Endless MCQs. Star with ☆, retry the ones you missed.'), href('quiz')],
    ['plan', tr('Mera plan', 'My plan'), tr('Din aur ghante batao, day-by-day plan lo. Must-do pehle.', 'Give days and hours, get a day-by-day plan. Must-do first.'), href('plan')],
    ['list', tr('Meri lists', 'My lists'), tr('Apni revise-list banao, ek click me sabka Quick look.', 'Build your own revise lists, Quick look all of it in one go.'), href('lists')],
    ['file', tr('Resume prep', 'Resume prep'), tr('Resume pe sawal, common sawal, aur har jawab ka score.', 'Questions on your resume, common ones, and a score for every answer.'), href('resume')],
    ['flask', tr('Agent labs', 'Agent labs'), tr('ReAct, RAG, multi-agent: browser me chalao.', 'ReAct, RAG, multi-agent: run them in the browser.'), href('agents')],
  ]

  const flow = [
    tr('Profile me interview date, phir plan banao', 'Set the interview date, then make your plan'),
    tr('Roz: plan ke pages, checklist, quiz', 'Daily: plan pages, checklist, quiz'),
    tr('Weak topics ko list me daalo, ek mock do', 'Put weak topics in a list, take a mock'),
    tr('Ek din pehle: Revision + starred quiz', 'Day before: Revision + starred quiz'),
    tr('30 min pehle: list ka Quick look', '30 min before: Quick look of your list'),
  ]

  return (
    <section className="guide">
      <button className="guide-head" aria-expanded={open} onClick={toggle}>
        <span className="eyebrow">{tr('Shuru kaise karein', 'Getting started')}</span>
        <span className="muted small">{open ? tr('Chhupao', 'Hide') : tr('Dikhao', 'Show')}</span>
      </button>
      {open && (
        <>
          <ol className="guide-flow">
            {flow.map((f, i) => (
              <li key={f}>
                <span className="guide-step mono">{String(i + 1).padStart(2, '0')}</span>
                <span>{f}</span>
              </li>
            ))}
          </ol>
          <div className="guide-grid">
            {cards.map(([icon, title, text, link]) => {
              const body = (
                <>
                  <span className="guide-icon">
                    <Icon name={icon} size={18} />
                  </span>
                  <span className="guide-text">
                    <b>{title}</b>
                    <span>{text}</span>
                  </span>
                </>
              )
              return link ? (
                <a key={title} className="guide-card" href={link}>
                  {body}
                </a>
              ) : (
                <div key={title} className="guide-card">
                  {body}
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
