---
title: Story Bank & Questions to Ask
order: 5
time: 12
---

# Story Bank & Questions to Ask

**In one line:** 6–8 well-prepared stories cover 90% of behavioral questions. A story bank is a table that tells you which story works for which question or LP, so you don't have to think during the interview.

> **Example:** The interviewer asks "A time you went beyond your role". Without a story bank you think for 20 sec and grab a weak story. With one, you immediately say "the CI pipeline 35 → 9 min one", because it's written next to Ownership in your table.

## ⭐ Story bank template

Write your stories in this table (in Notion/a sheet). One row per story.

| # | Story (headline) | Questions / LPs it covers | Numbers | Ready for follow-ups |
|---|---|---|---|---|
| 1 | Order DB MySQL → Postgres migration, zero downtime | Proudest project, Deliver Results, Dive Deep, Think Big | p99 800 → 120 ms, 40 crore rows, 0 downtime | 4 phases, root cause of 0.02% mismatch, rollback plan |
| 2 | Diwali sale checkout incident | Production incident, Bias for Action, Customer Obsession, Earn Trust | 23 min impact, p99 6 s → normal in 4 min | Why the rollback didn't help, postmortem items |
| 3 | `CREATE INDEX` without CONCURRENTLY | Mistake, Earn Trust, Insist on Highest Standards | 4 min timeouts, 1,200 orders, linter caught 3 more | Linter rules, how I communicated |
| 4 | Feature flag service, adoption 1/4 | Biggest failure, Learn and Be Curious, Customer Obsession | 6 weeks late, 4/4 teams in 3 months | What I'd do differently |
| 5 | Disagreement with manager on Node → Go rewrite | Disagree with manager, Have Backbone, Frugality | CPU −55%, ₹1.5 lakh/month | The doc, what if the manager had said no |
| 6 | Conflict with teammate on retry logic | Conflict, Earn Trust, Dive Deep | Failures 0.3%, recovery 2 min | What the teammate's concern was |
| 7 | CI pipeline 35 → 9 min | Ownership beyond role, Invent and Simplify | 150 engineer-hours/week saved | How I got time from my manager |
| 8 | IPL contest in 2 weeks | Tight deadline, Deliver Results, Bias for Action | 3.2 lakh submits/min, 18 lakh users | What scope was cut, load test |

Extra columns (optional): **Which company/round I used it in**, **Which role (SDE-1/2)**, **How many seconds it takes**.

## ⭐ How to pick 6–8 stories

Think in categories so that every question is covered:

| Category | How many | Questions it covers |
|---|---|---|
| **Big technical win** (migration, scale, perf) | 1–2 | Proudest project, Deliver Results, Dive Deep, Think Big |
| **Production incident** | 1 | Incident, pressure, Bias for Action, Customer Obsession |
| **Failure / mistake** | 1–2 | Biggest failure, mistake, Earn Trust, growth mindset |
| **Conflict / disagreement** | 1–2 | Teammate conflict, manager disagreement, Backbone |
| **Ownership / initiative** | 1 | Beyond role, Ownership, Invent and Simplify |
| **Ambiguity / tight deadline** | 1 | Vague requirements, deadline, prioritisation |
| **Learning / mentoring** | 1 | Learning quickly, feedback, Hire and Develop |

**Steps:**
1. List the work from the last 2–3 years: projects, incidents, PRs, reviews, appraisal notes. 15–20 raw items.
2. Next to each, write: my role, one number, what was hard. Drop any item missing one of these three.
3. Pick 6–8 using the categories above. Cover every category at least once.
4. Write each story as STAR bullets. See [STAR Method](../08-behavioral/01-star-method.md).
5. Map 3–4 questions/LPs to each story. See [Amazon LPs](../08-behavioral/04-leadership-principles.md).
6. Gap check: go through the 12 questions in [Common Questions](../08-behavioral/03-common-questions.md). Is there a story for each? If not, find a new one.
7. Say every story out loud, 60–120 sec, and have a friend ask follow-ups.

**Tips:**
- Prefer recent stories (last 2 years). Freshers: internship, college project, hackathon, open source.
- Variety: not only technical, but also people stories (conflict, feedback, mentoring).
- For SDE-2+, at least 2 stories where the scope was a team or multiple teams.
- Don't lean on one story too much. One story only once per round.

## ⭐ What to ask the interviewer (by round)

"Do you have any questions for me?" is also scored. "No, everything's clear" = a missed chance. Have 2–3 questions ready.

### Hiring manager round
- "What's the biggest problem the team is working on right now? What would you expect from me in the first 6 months?"
- "How is success measured in this role? What's the difference you see between a strong SDE-2 and an average one?"
- "What do the team's on-call and release processes look like?"
- "What did the team ship last year that you're proudest of?"

### Peer / technical round
- "What does a normal day look like? Ratio of coding vs meetings?"
- "What's the code review and design review process? Who writes design docs?"
- "How do you prioritise tech debt?"
- "What have you learned the most since joining here?"

### Bar raiser / senior leader round
- "Where is the company/org heading in the next 1–2 years?"
- "In your view, what do successful engineers here have in common?"
- "What part of the culture is invisible from outside but matters inside?"

**Avoid:** questions about salary/leave (those are for the recruiter), things already on the website, "How did my interview go?".

## Salary, notice period and "why should we hire you"

### Expected salary
- The recruiter will ask first. Research beforehand (levels.fyi, AmbitionBox, friends).
- Give a range, not a number: "Based on the market and the role, I'm looking at ₹X–Y LPA, but I'll decide looking at the full package and role."
- If asked for current CTC, tell the truth (it's checked in background verification). Keep the breakup (fixed, variable, ESOPs) clear.
- Negotiate after the offer, not in the middle of interviews.

### Notice period
- Be honest: "My notice period is 60 days. I can talk to my company about a buyout / try for an early release."
- On counter-offers: "I'm clear about my decision because my reason is the role and growth, not just money." (And it should be true.)

### "Why should we hire you?"
30–45 sec, 3 points: **what the role needs + your proof + motivation**.
> "You need an engineer for this role who can own high-scale backend systems. Over 3 years I owned a 30K RPS service and led a zero-downtime migration. I stay calm in production incidents; during the Diwali sale I mitigated one in 4 min. And a correctness-critical domain like payments genuinely excites me, so I'll be able to make an impact quickly."

## ⭐ Final-day checklist

**The day before:**
- Read the story bank once; remember each story's headline + number (not the words).
- Say "tell me about yourself" twice with a timer. See [Tell Me About Yourself](../08-behavioral/02-tell-me-about-yourself.md).
- Company research: product, recent launch/news, engineering blog, the team's work. 2 specific lines for "why this company".
- 2–3 questions for the interviewer for each round.
- Check you can talk for 2 min on every line of your resume.

**On the day:**
- If online: camera, mic, internet, charger, quiet room. Join 10 min early.
- Water, paper and pen (for notes, plus a short list of story headlines).
- Every answer 60–120 sec. If it's running long, stop with "I can go into more detail if useful".
- If a question is unclear, clarify: "Do you mean a conflict within the team or with a manager?"
- After each round, take 2 min to note which stories you used, so you don't repeat them in the next round.

## Say this in the interview

> "Let me give you a specific example of that..." (also works to buy 2 seconds to think)

> "Can I take a minute to think of the most relevant example?" (perfectly fine, and better than a random story)

## Common mistakes

- Thinking of stories on the interview day. Under pressure you remember the weakest story.
- All stories from the same project. The interviewer sees no range.
- Not remembering the numbers, or quoting different numbers in each round.
- Saying "no" to "Any questions?".
- Fighting over salary mid-interview, or misstating your current CTC.

## Checklist

- [ ] I can build my story bank table of 6–8 stories (story → LPs/questions → numbers)
- [ ] I can name one story for each category (win, incident, failure, conflict, ownership, ambiguity, learning)
- [ ] I can gap-check my stories against the 12 common questions
- [ ] I can ask 2 questions each in the HM, peer and bar raiser rounds
- [ ] I can give a crisp answer on expected salary, notice period and "why should we hire you"
- [ ] I can follow the final-day checklist and avoid repeating stories across rounds
