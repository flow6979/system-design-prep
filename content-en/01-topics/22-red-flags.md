---
title: Red Flags (How You Lose Marks)
order: 22
time: 6
usedIn: [t1-01-url-shortener, t1-03-news-feed, t1-05-bookmyshow, t1-11-payment-system, t2-15-flash-sale]
---

# Red Flags (How You Lose Marks)

**In one line:** in HLD interviews, most people fail not because they lack knowledge, but because of **mistakes in approach**. Read this list and don't make even one of these.

> **Example:** Two candidates built the same BookMyShow design. One asked about requirements for 3 min, did a deep dive on double booking, and talked through trade-offs: **Strong Hire**. The other jumped straight to "Kafka, Redis, Cassandra, Kubernetes" and drew boxes for 25 min: **No Hire**. The design was the same, the approach was different.

## Red flags: why it hurts, what to do

### 1. Jumping into design without requirements
- **Why it hurts:** you'll solve the wrong problem. The interviewer thinks you'll also write code without understanding in the real job.
- **Do:** first spend 3–5 min on clarifying questions. Write down functional + non-functional requirements. Scope out what you won't do. See [Interview Framework](../01-topics/00-interview-framework.md).

### 2. Over-engineering
- **Why it hurts:** 12 microservices, multi-region active-active and a Kubernetes service mesh for 1,000 QPS. It shows you have no sense of scale and cost.
- **Variants:** adding Kafka, microservices or Kubernetes to a design one Postgres would handle. Or skipping the simple v1 and drawing the "final" architecture straight away.
- **Do:** first a simple v1 (client → service → one DB) that meets every FR. Then add a component only when an NFR or a number demands it: "if scale goes 10x, this part will change".

### 3. Naming tech without justification
- **Why it hurts:** saying "Cassandra here" is a buzzword. The interviewer will immediately ask "why?", and if you can't answer, you lose marks.
- **Do:** tie every choice to a requirement or a number, and give one "what I didn't pick": "Cassandra, because it's write-heavy and we don't need multi-row transactions. Not Postgres, because 1M writes/sec won't fit on one node."

### 4. Ignoring the NFRs the interviewer gave
- **Why it hurts:** the interviewer said "absolutely no double booking" or "latency < 100ms", and your design doesn't mention it at all. This is a direct signal that you aren't listening. Same family: vague NFRs ("fast", "scalable"). Without a number, no decision can be justified.
- **Do:** write the NFRs on the board in numbers (`p99 < 200 ms`, `99.99%`, `10K writes/sec`). Link every deep dive to them: "This is because you asked for strong consistency."

### 5. Not doing deep dives
- **Why it hurts:** only boxes and arrows = junior level. The senior signal comes from deep dives (contention, hot keys, failure).
- **Variant:** a deep dive that addresses no stated requirement (the NFR was consistency, you spent 10 min on logging).
- **Do:** after the HLD, say it yourself: "I'd like to deep dive into 2–3 things: X, Y, Z", and tie each to an NFR: "NFR: p99 < 50 ms, hence the cache".

### 6. Leaving single points of failure
- **Why it hurts:** one DB, one Redis, one LB, no replicas. In production, that is downtime.
- **Senior red flag:** raising bottlenecks and failures only when the interviewer points them out. A senior is expected to raise them unprompted.
- **Do:** without being asked, say for every component "what if this fails? where will it choke first?" Replicas, failover, multi-AZ. See [Reliability](../01-topics/20-reliability-observability.md).

### 7. Staying silent while drawing
- **Why it hurts:** the interviewer evaluates your thinking, not your drawing. 5 min of silence = they are guessing, and usually guessing wrong.
- **Do:** keep talking: "Now I'm adding a Booking Service, because the hold and confirm logic will live here."

### 8. Not managing time
- **Why it hurts:** 20 min on requirements and estimation, and no time left for deep dives. Or the HLD is left half done.
- **Do:** a rough 45 min plan: requirements 5, entities 2, APIs 5, HLD 10–15, deep dives 10–15, wrap-up 3. Estimate only where a number changes a decision. Keep watching the clock.

### 9. Arguing with the interviewer
- **Why it hurts:** the interviewer's hint or pushback is usually meant to guide you in the right direction. Being defensive = a bad collaboration signal.
- **Do:** say "Good point", and think about the trade-off. If you agree, change the design. If you disagree, give your reasoning politely and also accept their view: "Both will work, I'll go with X because..., but if Y is the priority, your approach is better."

### 10. Too much estimation
- **Why it hurts:** 10 min of calculating bandwidth, storage and cache size that have no effect on the design. Wasted time.
- **Do:** only the numbers that change a decision (read:write ratio, peak QPS, storage). Round numbers. After every number, say "so...". See [Numbers Cheatsheet](../01-topics/21-numbers-cheatsheet.md).

## Quick table

| Red flag | One-line fix |
|---|---|
| Skipping requirements | 3–5 min of questions, write down NFRs |
| Over-engineering / skipping v1 | Simple v1 first, evolve only when a number demands it |
| Buzzwords | A requirement/number + an alternative with every tech |
| Ignoring or vague NFRs | NFRs in numbers, link every decision to them |
| No deep dive / unrelated deep dive | 2–3 deep dives, each tied to an NFR |
| SPOF / waiting to be told | Ask "what if this fails?" yourself |
| Silence | Talk while you draw |
| Time waste | A 45 min plan, watch the clock |
| Arguing | Treat a hint as a gift |
| Over-estimation | Only numbers that change a decision |

## Green flags: what strong candidates do

- **They stay in the driver's seat:** they say the next step themselves before the interviewer asks.
- **They talk about trade-offs:** "I took X, not Y, because..." on every major decision.
- **They decide with numbers:** "It's 12 writes/sec, so one Postgres is enough."
- **They identify the hard part:** contention in BookMyShow, celebrity fan-out in a feed, idempotency in payments.
- **They raise failures themselves:** "If Redis is down..."
- **They evolve from simple → complex:** first a working design, then find the bottleneck and fix it.
- **They bring the interviewer along:** "Would you like me to deep dive into search or booking?"
- **They mention improvements at the end:** monitoring, multi-region, analytics, things not done because of time.

## Where it is used

In every question. These are the best ones to practice with:
- [BookMyShow](../02-questions/t1-05-bookmyshow.md): linking the NFR (no double booking) to every decision
- [News Feed](../02-questions/t1-03-news-feed.md): avoiding over-engineering and evolving to hybrid fan-out
- [Payment System](../02-questions/t1-11-payment-system.md): raising failures and edge cases yourself

## Say this in the interview

> "Before I start the design, I'd like to spend 2–3 minutes clarifying requirements, so I solve the right problem."

> "The HLD is ready now. I think the hard part of this problem is X, so I'll deep dive into that first. If you'd like to go into another area, please tell me."

## Common mistakes

- Believing there is only one "right answer". The interviewer looks at your reasoning, not the final architecture.
- Only reading without doing mock interviews. Practice by speaking out loud, with a timer.
- Ignoring the interviewer's hint and sticking to your own plan.
- Adding a new component in the last 5 min, without a wrap-up.

## Checklist

- [ ] I can tell at least 8 of the 10 red flags without looking, with their fixes
- [ ] I can tell the time plan for a 45 min interview
- [ ] I can state every tech choice in the "because + what I didn't pick" format
- [ ] I can give a polite, trade-off based answer to the interviewer's pushback
- [ ] I remember 5 green flags and can use them in a mock interview
