---
title: Common Behavioral Questions
order: 3
time: 20
---

# Common Behavioral Questions

**In one line:** 80% of behavioral questions in SDE interviews are a variant of one of these 12. Have one real story ready for each, and understand what signal the interviewer is looking for with each question.

> **Example:** "Tell me about a time you disagreed with your manager" and "Tell me about a time you pushed back on a decision" are the same question. Amazon calls it "Have Backbone", Google "collaboration", Flipkart "ownership". One story, different labels.

Format for each question: **What they are checking** → **Sample answer (STAR)** → **Template** → **Red flags**. Sample answers are 60–120 sec. Don't copy them; put your own story in the same shape. For STAR basics see [STAR Method](../08-behavioral/01-star-method.md).

## ⭐ Conflict and disagreement

### Conflict with a teammate

**What they are checking:** do you resolve conflict with data and empathy, or with ego. Did the relationship stay good afterwards.

**Sample answer:**
> **S:** "We were adding retry logic to the order service. My teammate Arjun wanted every failed call retried 5 times, immediately."
> **T:** "I was the reviewer on that PR and also on-call for the downstream inventory service."
> **A:** "I was worried that during an outage, 5x retries would knock inventory down further. Instead of a long PR comment thread, I set up a 15 min call and first understood his concern: he didn't want user orders to fail. Then I showed him the graph from last month's incident, where a retry storm delayed recovery by 20 min. Together we agreed on exponential backoff with jitter and max 3 retries, and I helped him add a circuit breaker."
> **R:** "In the next inventory blip, order failures stayed at 0.3% and inventory recovered in 2 min. Arjun later applied the same pattern to the payment client. Learning: turn a disagreement from 'mine vs yours' into 'data vs assumption'."

**Template:** "[Teammate] wanted [X]; I thought [Y] because of [risk]. I first understood their concern: [concern]. Then I showed [data/experiment]. We agreed on [middle path]. Result: [number], and the relationship [how it went]."

**Red flags:** making the teammate look bad. Ending on "I was right". Escalating to the manager as the first step.

### Disagreement with manager

**What they are checking:** backbone (the courage to say the right thing) and disagree-and-commit (full support after the decision). Pushing back with respect.

**Sample answer:**
> **S:** "My manager wanted to rewrite the notification service from Node to Go in 1 month, because CPU cost was rising."
> **T:** "I owned that service and would lead the rewrite."
> **A:** "First I profiled it. 70% of CPU was going into a single JSON template rendering function. I wrote a 1-page doc: option A full rewrite (4–6 weeks, high risk), option B fix the hot path (1 week). I showed the data in a 1:1 and said I might be wrong, so let's try B for a week, and if it doesn't work, do A. He agreed."
> **R:** "Template caching and one library change cut CPU by 55% and saved ₹1.5 lakh/month. The rewrite wasn't needed. If he had stayed with A, I would have done A with full effort. Learning: bring data and a cheap experiment along with your opinion."

**Template:** "[Manager] wanted [X]. I was concerned about [concern]. I made a [data/doc] with options and trade-offs. Discussed it [in a 1:1]. The decision was [outcome]. I committed by [how]. Result: [number]."

**Red flags:** "I quietly went along" (no backbone). "I still did it my way" (no commit). Badmouthing the manager.

## ⭐ Failures and mistakes

### Biggest failure

**What they are checking:** self-awareness, ownership, and whether you learn from failure. They want a real failure, not "I'm too much of a perfectionist".

**Sample answer:**
> **S:** "My first big project was an internal feature flag service for 4 teams."
> **T:** "I owned it from design to launch, on a 2-month timeline."
> **A:** "I polished the design for 3 weeks, multi-tenant, UI, audit logs, everything, but never talked to a consumer team in between. At launch I found out 2 teams needed the SDK in Python; I had only built Java. Adoption: 1 team out of 4. I took ownership: in the retro I said myself that the mistake was not validating requirements. Then I built a Python SDK in 2 weeks and did a 30 min onboarding with each team."
> **R:** "Within 3 months all 4 teams were on it, but the project was 6 weeks late. Now for any platform work I do a design review with 2–3 consumers in week one and ship a thin end-to-end slice first."

**Template:** "On [project/goal] I was [owner/role]. I made [wrong decision] because [reason]. Result: [what went wrong, number]. I [took ownership + fixed it]. Now I [changed behaviour]."

**Red flags:** a "failure" that is actually a success. Blaming the team. No learning, or a learning you never applied.

### A mistake you made

**What they are checking:** honesty, how quickly you admitted and fixed it, and whether you made a system-level fix so it doesn't happen again.

**Sample answer:**
> **S:** "One Friday evening I ran a DB migration that created a new index on the `orders` table."
> **T:** "The migration and deploy were mine."
> **A:** "I ran `CREATE INDEX` without `CONCURRENTLY`. On a 30 lakh row table it took a write lock and the checkout API timed out for 4 min. As soon as the alert fired I said in the team channel 'this is my migration', cancelled the query, and things were normal in 6 min. I wrote the incident doc that night. Then I added a migration linter in CI that blocks non-concurrent indexes and column defaults on large tables."
> **R:** "~1,200 orders had to retry, no data loss. In the next year there was no incident of that class, and the linter caught 3 more risky migrations. Learning: put the fix for an individual mistake into the process."

**Template:** "I made [mistake]. Impact: [number]. I immediately [admitted + contained] it. Root cause [X]. Then I made a [process/automation fix] so it can't repeat. Result: [number]."

**Red flags:** picking a tiny mistake (a typo). Hiding the mistake or reporting it late. A fix that is just "I'll be more careful".

## ⭐ Delivery and ownership

### Tight deadline

**What they are checking:** prioritisation, negotiating scope, communication. Not just "I worked all night".

**Sample answer:**
> **S:** "Two weeks before the IPL season, product asked for a 'predict & win' contest on the live match page. The normal estimate was 5 weeks."
> **T:** "I was the backend lead, with 2 other engineers."
> **A:** "With the PM I split the feature list into must-have and nice-to-have. Leaderboard refreshed every 5 min instead of real-time, rewards manual. I split the work into 3 parallel tracks with a daily 15 min standup. I took the riskiest part myself, 2 lakh concurrent submits: write to Redis, then async to the DB via Kafka. I load-tested on day 8 so there was time to fix things."
> **R:** "Launched one day before the first match. Peak 3.2 lakh submits/min, zero downtime. 18 lakh users took part. The real-time leaderboard shipped in the next 2 weeks."

**Template:** "The deadline was [X], the normal estimate [Y]. With [PM/lead] I [cut/phased] scope. I split the work [how]. The biggest risk was [Z], and I de-risked it by [how]. Result: [date + number]. Later [deferred scope]."

**Red flags:** skipping quality or testing and presenting it as good. Overtime as the only solution. Surprising stakeholders.

### Ownership beyond your role

**What they are checking:** do you say "not my job", or do you see a problem and pick it up. Amazon's Ownership; a favourite at Flipkart/Swiggy.

**Sample answer:**
> **S:** "Our team's CI pipeline took 35 min. Everyone complained, but nobody owned it, and the devops team was busy."
> **T:** "It officially wasn't my job. I was on feature work."
> **A:** "I asked my manager for 2 days per sprint, with a doc showing how much time 12 engineers × 6 builds/day × 35 min wastes. Profiling showed 60% of the time was integration tests running serially, and Docker layers weren't cached. I parallelised the tests into 4 shards and turned on layer caching. I had the devops team review the PR so they could maintain it."
> **R:** "Builds went from 35 min to 9 min. The team saved ~150 engineer-hours a week. 3 other teams later copied the setup."

**Template:** "[Problem] was affecting everyone, but had no owner. I got [time/permission from manager] with [data]. Root cause [X]. I [action] and [handover/doc]. Result: [number], [who adopted it]."

**Red flags:** dropping your main work to play hero. Changing another team's system without telling them. A credit-grabbing tone.

### Handling ambiguous requirements

**What they are checking:** do you create clarity yourself (questions, written assumptions, prototype) or wait.

**Sample answer:**
> **S:** "The PM gave me a ticket: 'Give merchants better visibility into refunds.' That was it."
> **T:** "I had to design it and ship something in 1 sprint."
> **A:** "First I got data on last month's 200 refund tickets from the support team. 70% of questions were 'when will the refund arrive'. I wrote 3 assumptions in a 1-page doc and locked them with the PM in 30 min: a status timeline, the expected date, and the bank reference number. A bigger dashboard went to v2. I made a rough mock and API contract, showed it to 2 merchants, and added 1 field from their feedback."
> **R:** "Shipped in 1 sprint. Refund-status support tickets dropped 45% the next month. The doc template later became the team standard."

**Template:** "The requirement was [vague line]. From [data/users] I found the real problem was [X]. I wrote down [assumptions] and locked them with [PM]. I shipped a [thin v1]. Result: [number]."

**Red flags:** "The PM wasn't clear, so it was late." Building anything without asking questions. Waiting for every detail.

## Feedback

### Giving / receiving tough feedback

**What they are checking:** can you take feedback without getting defensive, and can you give someone direct but respectful feedback.

**Sample answer (receiving):**
> **S:** "In my first half-year review, my lead said my PRs were too big (1,500+ lines) and took 3–4 days to review."
> **T:** "I had to accept it and change how I worked."
> **A:** "My first reaction was that my work is complex. But I looked at my last 10 PRs: average 1,200 lines, average review time 3.5 days. I asked my lead for 2 good examples. Then I started splitting every feature into stacked PRs, max ~300 lines, with a design-note PR first. I checked in with my lead every month on whether the difference showed."
> **R:** "Average review time went from 3.5 days to 1 day. In the next cycle I was rated a 'strong collaborator'. Now I teach new joiners the same thing."

**Template (giving):** "[Teammate]'s [behaviour] was [impact] on the team. I told them in private, with a specific example: [SBI: situation, behaviour, impact]. I heard their side. We agreed on [agreement]. Result: [change]."

**Red flags:** "I've never had tough feedback." Saying the feedback was wrong. Giving feedback in public.

## ⭐ Production and technical stories

### A production incident you handled

**What they are checking:** calm under pressure, structured debugging, communication, and a permanent fix after the RCA. See [Reliability](../01-topics/20-reliability-observability.md).

**Sample answer:**
> **S:** "At 9 pm on the Diwali sale night, our checkout p99 went from 400 ms to 6 sec and payment success dropped from 97% to 82%."
> **T:** "I was on-call and also the incident commander."
> **A:** "First I posted an update in the status channel and pulled in the payments team. The dashboard showed DB connections at max. The last deploy was 2 hours earlier; I rolled it back, but nothing changed, so the deploy wasn't the cause. The slow query log showed a coupon validation query doing a full table scan because of a new 'festive' coupon. I used a feature flag to put the coupon check into cache-only mode temporarily, and p99 was normal in 4 min. Then I added the index and removed the flag. I updated stakeholders every 10 min."
> **R:** "Total impact 23 min, ~₹18 lakh GMV in failed attempts, of which 70% of users retried and paid. The postmortem had 3 action items: query review in coupon creation, DB connection alerts at 80%, and real coupon data in load tests. Zero incidents at the next sale."

**Template:** "At [time/context], [symptom + metric] happened. I was [role]. First I [communicated + mitigated]. I checked hypothesis [X] and ruled it out. Root cause [Y]. Mitigation [Z] brought it back in [time]. Permanent fix [A]. Result: [impact number + what changed]."

**Red flags:** a hero story with no RCA. Holding off mitigation to find the root cause. No mention of communication.

### Proudest project

**What they are checking:** technical depth, scope, and what motivates you. Deep, HLD-style follow-ups come from here.

**Sample answer:**
> **S:** "Our order service was on MySQL, with 40 crore rows in one table. Replication lag hit 30 sec on every sale."
> **T:** "I proposed and led partitioning order data by month and migrating hot data to a new Postgres cluster, with zero downtime."
> **A:** "I made a 4-phase plan: dual-write, backfill, shadow-read compare, cutover. For dual-write I wrote a reconciliation job that reported a mismatch count every hour. Shadow reads showed a 0.02% mismatch; the root cause was timezone conversion, which I fixed. I did the cutover behind a feature flag, 1% → 10% → 100% over 1 week. I tested the rollback plan at every step."
> **R:** "Zero downtime, zero data loss. Read p99 from 800 ms to 120 ms. Replication lag under 1 sec during sales. I was promoted to SDE-2 on the back of it, and this playbook was used in 2 more migrations."

**Template:** "[Problem + scale]. I [proposed/led] [solution]. Approach: [phases/key decisions + trade-off]. The hardest part was [X], solved by [how]. Result: [2 numbers]. Why I'm proud: [reason]."

**Red flags:** a project where your role was small. Can't explain the tech details. Just "it was quite complex".

### Learning something quickly

**What they are checking:** learn and be curious. How fast you get productive in an unknown tech/domain, and how.

**Sample answer:**
> **S:** "One of our Kafka consumers was lagging, and the engineer who knew Kafka was on leave. I had never run Kafka in production."
> **T:** "I had to fix the consumer lag in 2 days, or order notifications would go out late."
> **A:** "For the first 2 hours I read only the concepts I needed from the docs: partitions, consumer groups, rebalancing, commits. Then I reproduced it locally in Docker. The consumer was making a sync DB call per message and kept crossing `max.poll.interval`, which caused repeated rebalances. I switched to batch processing (500 messages) and went from 6 to 24 partitions. Before the fix, I got a 20 min review from a senior."
> **R:** "Lag went from 2 lakh messages to 0 in 3 hours. Notification delay from 15 min to 5 sec. I wrote a 1-page 'Kafka consumer checklist' for the team."

**Template:** "I didn't know [tech/domain], and [deadline/reason]. I did [focused learning plan], [hands-on/reproduce], [validated with an expert]. Result: [number]. Later I [shared it]."

**Red flags:** "I did a Udemy course" with no application. No structure to the learning. Not asking anyone for help.

## ⭐ Motivation

### Why are you leaving / why this company

**What they are checking:** your motivation is genuine, not negative, and you have researched the company. This is not STAR; it's a direct 30–45 sec answer.

**Sample answer:**
> "I learned a lot at my company over the last 3 years. I scaled catalog search and led a small team. Now my product is in a stable phase and most of the work is maintenance. I want a place with high-scale, correctness-critical problems. Razorpay fits because payments has problems like idempotency and reconciliation that excite me, I read your engineering blog post on the ledger redesign, and this team is building a new product right now, where ownership will be higher."

**Template:** "At [current company] I [achievement]. Now I want [growth: scope/domain/scale]. [Company] fits because of [specific: product, tech, team, blog/launch], and I will [what I'll contribute]."

**Red flags:** badmouthing your current company/manager. Only money or the "brand name". Knowing nothing specific about the company. A confused answer about notice period or counter-offers.

## Quick table

| Question | Signal | Story type |
|---|---|---|
| Conflict with teammate | Collaboration | Design/code review disagreement |
| Disagree with manager | Backbone + commit | Tech decision pushback with data |
| Biggest failure | Self-awareness | A project that went wrong |
| Mistake | Honesty, process fix | A prod bug you introduced |
| Tight deadline | Prioritisation | Scope cut + delivery |
| Ownership beyond role | Ownership | Fixed an orphan problem |
| Ambiguous requirements | Creating clarity | Vague ticket → shipped v1 |
| Tough feedback | Growth | Feedback you applied |
| Production incident | Calm under pressure | On-call incident |
| Proudest project | Depth | Migration / scale project |
| Learning quickly | Curiosity | New tech under a deadline |
| Why leaving / why us | Motivation | Direct 30–45 sec |

## Checklist

- [ ] I can list the 12 common questions and the signal for each (what the interviewer checks)
- [ ] I can tell my conflict and manager-disagreement stories with data and disagree-and-commit
- [ ] I can give a real failure and mistake story with ownership and a process fix
- [ ] I can tell a production incident story: mitigate → root cause → permanent fix → numbers
- [ ] I can fill each question's template with my story and say it in 60–120 sec
- [ ] I can give a positive, company-specific "why leaving / why this company" answer in 45 sec
- [ ] I can name 2 red flags for each question
