---
title: Tell Me About Yourself
order: 2
time: 8
---

# Tell Me About Yourself

**In one line:** this is the first question of the interview and it sets the tone for the whole round. It is not a resume reading; it is a 60–90 sec pitch on why you fit this role.

> **Example:** "I'm from Lucknow, did my B.Tech in 2019, then joined TCS, then..." is a biography. Instead: "For 3 years I've worked on Swiggy-scale backend systems; right now I own the order tracking service, which handles 50K RPS..." is a pitch. The first one bores the interviewer; with the second, they start writing down follow-up questions.

## ⭐ What the interviewer is checking

- **Communication:** can you speak in a structured, crisp way.
- **Relevance:** how your experience connects to this role.
- **Hooks:** which topics to ask about next. You decide where the conversation goes.
- **Motivation:** why you want this role, just a job or a genuine reason.

## ⭐ Structure: Present → Past → Why this role

| Part | What to say | Time |
|---|---|---|
| **Present** | What you do now: role, company, team, scale, 1 highlight | 20–30 sec |
| **Past** | 1–2 earlier experiences/projects relevant to this role, with a number | 20–30 sec |
| **Why this role** | Why this role/company, and what you will bring | 15–20 sec |

- Total **60–90 sec**. Never more than 2 min.
- End with a clear signal ("...which is why I'm excited about this role") so the interviewer knows you're done.
- Always add a **hook**: an interesting project or number the interviewer will want to ask about.

## ⭐ Template 1: Fresher / final year

**Structure:** Present (college + focus) → Past (1–2 projects/internship) → Why this role.

**Fill-in:**
> "I'm a final-year [branch] student at [college]. My focus has been [backend / DSA / ML]. During [internship/project] I built [what], which [number/impact]. I also [one more project/achievement]. [Company]'s [product/tech] interests me because [specific reason], and here I want to [what I want to learn/do]."

**Example:**
> "I'm a final-year Computer Science student at NIT Trichy. My main interest is backend and distributed systems. Last summer I did a 2-month internship at Razorpay, where I built an async export service for settlement reports. Earlier, a 1 lakh row report would time out after 4 minutes; I made it queue-based and now it's emailed in 40 seconds. In college I built a small key-value store in Go with Raft, which got to 200 stars on GitHub. Your team works on high-throughput payment APIs, and that's exactly the kind of scale and reliability problem I want to work on."

## ⭐ Template 2: 2–4 years of experience (SDE-1 → SDE-2)

**Structure:** Present (role + ownership + scale) → Past (one strong project, with numbers) → Why this role (growth, scope).

**Fill-in:**
> "I've been a [role] at [company] for [X] years, in the [team] team. Right now I own [service/area], which [scale]. My most impactful work was [project], where I [action] and [result number]. Before that, at [previous role/company], [1 line]. Now I want to move into [bigger scope / domain], and [specific reason] is why this role at [company] feels like the right fit."

**Example:**
> "I've been a backend engineer at Meesho for 3 years, in the catalog team. Right now I own the product listing service, which goes up to 30K RPS on sale days. My biggest piece of work was last year: our product search ran on MySQL LIKE queries and p99 was 2 seconds. I led the Elasticsearch migration with dual-write and shadow reads, with zero downtime, and p99 came down to 250 ms. Before that I spent a year at a startup doing full-stack work. Now I want to move into a domain like payments where both correctness and scale matter, and that's why Razorpay's scale and engineering culture attract me."

## ⭐ Template 3: 5+ years (Senior / SDE-3)

**Structure:** Present (scope, team, decisions) → Past (career theme, 1–2 big outcomes) → Why this role (the impact you'll bring).

**Fill-in:**
> "I have [X] years of experience, mostly in [theme: platform / payments / infra]. Right now I'm a [role] at [company], setting the technical direction for [area] with a team of [N] engineers. In the last 2 years [big outcome with number]. Before that, at [company], [another outcome]. I now want to solve [type of problem], and because of [specific] at [company], I can [what I will contribute]."

**Example:**
> "I have 7 years of experience, mostly in high-scale backend and platform work. Right now I'm a senior engineer at Flipkart and the technical lead for order management, with a team of 6. Last year, for Big Billion Days, I moved the order pipeline from a monolith to an event-driven design, so a peak of 1.2 lakh orders/min ran without an incident and on-call pages dropped 60%. Before that I spent 3 years at Paytm on the wallet ledger. I now want to join a team that is building a platform from zero, and your new lending platform is at exactly that stage, where my experience with scale and correctness applies directly."

## Adjust for the round

| Round | What to emphasise |
|---|---|
| Recruiter / HR | Short (45–60 sec), motivation, a hint about notice period |
| Hiring manager | Ownership, scope, team fit, why this team |
| Technical (DSA/HLD) | 30–45 sec, tech depth, then move to the problem quickly |
| Bar raiser / culture | One story that shows values (ownership, customer) |

## ⭐ What to avoid

- **Reading the resume:** "Class 10 in 2016, class 12 in 2018..." The interviewer already has your resume.
- **Personal life details:** marriage, family, hobbies (unless relevant or asked).
- **Negative reasons:** "No growth at my company, my manager isn't good..." Frame it positively: "I want more scope".
- **Generic, no numbers:** "I'm hard-working and passionate." Everyone says this.
- **Too long:** a 3-minute monologue. Attention drops after 60 sec.
- **Buzzword list:** "Java, Spring, Kafka, Redis, Kubernetes, AWS..." Mention tech only when tied to some work.
- **Knowing nothing about the company:** the "why this role" part becomes generic.
- **Memorised tone:** remember bullets, not sentences.

## Questions that come with it

These often come right after the intro. Have 30–60 sec answers ready for them too.

### "Walk me through your resume"
- Same Present → Past structure, but it can go **chronologically** (oldest to newest). One line per job: what you did + 1 number + why you moved on.
- Every switch should have a positive reason: "more scope", "a new domain", "bigger scale".

### "What are your strengths?"
- 2 strengths, each with **proof**: "Production debugging. In the last sale I mitigated a checkout incident in 4 min."
- Tie them to the role: for a backend role, ownership, debugging, system thinking.

### "What is your weakness?"
- Pick a real weakness that isn't fatal for the role, and say what you're doing about it: "I used to make big PRs that took 3 days to review. Now I make stacked PRs (~300 lines), and review time is down to 1 day."
- Avoid: "I'm a perfectionist / I work too hard." Interviewers see this as a dodge.

### "Where do you see yourself in 5 years?"
- Growth that aligns with the company: "I want to be an engineer who owns the design of a whole system and mentors juniors, on the senior/staff track."
- Avoid: "Starting my own startup", "doing an MBA", or "I don't know".

## Say this in the interview

> "In short: right now I'm a [role] working on [work at scale]. Before that, [one relevant highlight]. And I want this role because [specific reason]."

> At the end: "That's my background in short. Happy to go deeper into any part."

## Common mistakes

- Telling a different version in each round that doesn't match the resume.
- Forgetting the "why this role" part. It's what differentiates you most.
- Giving no hook, so the interviewer asks about something random.
- Not researching the company (product, recent launch, tech blog).

## Checklist

- [ ] I can explain the Present → Past → Why this role structure and its time split
- [ ] I can say my "tell me about yourself" in 60–90 sec with a timer
- [ ] I can include at least one number and one hook in my pitch
- [ ] I can adjust the version for recruiter, HM and technical rounds
- [ ] I can say a specific "why this role" line for my target company
- [ ] I can list 5 things to avoid in this answer
