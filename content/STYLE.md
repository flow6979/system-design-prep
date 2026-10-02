# Content style guide

Har file isi style me likhni hai. Reference files:
- Topic: `01-topics/09-locks-and-contention.md`
- Question: `02-questions/t1-05-bookmyshow.md`

## Language
- **Hinglish** (Roman script Hindi + English tech terms). Simple, crisp, padhte hi samajh aaye.
- Tech terms English me hi rakho (cache, shard, partition, TTL). Unhe translate mat karo.
- Chhote sentences likho. Fluff, emoji aur "worth noting" jaisi lines nahi.
- Indian examples jahan natural lage (Swiggy, Paytm, IPL, BookMyShow).

## Frontmatter (zaroori, website isse padhti hai)

Topic:
```yaml
---
title: Caching
order: 5            # file number
time: 7             # padhne me minutes
usedIn: [t1-01-url-shortener, t1-03-news-feed]   # question slugs
---
```

Question:
```yaml
---
title: Design URL Shortener (TinyURL)
order: 1
tier: 1             # 1 ya 2
time: 20
patterns: [Caching, ID generation]
topics: [05-caching, 17-unique-id-generation]    # topic slugs
askedAt: [Google, Amazon, Microsoft]
---
```

## Mermaid rules (galat syntax se diagram toot jaata hai)
- Node label me `(`, `)`, `/`, `:`, `,`, `?`, `+`, `&`, `'` ya `"` ho to label ko double quotes me likho: `A["API Gateway (auth)"]`. Safe rehne ke liye **hamesha quotes** use karo.
- DB node: `DB[("Postgres")]`, queue: `Q[["Kafka"]]`
- Edge labels: `A -- "text" --> B` ya `A -->|text| B`. Edge text me bhi brackets avoid karo.
- sequenceDiagram me message text me `;` aur `#` mat likho.
- `flowchart LR` ya `flowchart TD` use karo (`graph` nahi).
- Har diagram chhota aur readable rakho (max ~14 nodes).

## Links
- Topic ↔ question links relative hon: `[Caching](../01-topics/05-caching.md)`, `[URL Shortener](../02-questions/t1-01-url-shortener.md)`.
- Sirf neeche ki file list me jo slugs hain wahi use karo.

## Checklist (website progress % isse banati hai)
- Har file ke end me `## Checklist` heading, uske neeche `- [ ] ...` items.
- Topic: 4–6 items. Question: 6–8 items. Har item "...kar sakta hoon / bata sakta hoon" jaisa ho, jise self-test kar sako.
- Checklist ke baad kuch nahi likhna.

## Topic file sections (is order me)
1. `# Title`
2. **Ek line me:** ...
3. `> **Example:**` real-life example
4. Kaise kaam karta hai (subsections, table, mermaid jahan zarurat ho)
5. Kab use karo / kab nahi (table ya bullets)
6. `## Kin systems me lagta hai` (question files ke links)
7. `## Interview me bolo` (1–2 ready quote lines)
8. `## Common galtiyan`
9. `## Checklist`

Length: ~80–160 lines. Utna hi ki 5–8 min me padh lo.

## Question file sections (is order me, headings same)
1. `# Title`, ek-line summary, aur "Is question me interviewer kya check karta hai"
2. `## Step 1: Interviewer se ye confirm karo`: table (Tum poochho | Typical jawab | Design pe asar) + "Bolo:" quote
3. `## Step 2: Requirements`: Functional + Non-functional
4. `## Step 3: Estimation`: sirf woh numbers jo design decision badlein, aur "Bolo:" line
5. `## Step 4: Core entities`
6. `## Step 5: APIs` (```http block)
7. `## Step 6: High-level design`: mermaid flowchart + "Har component kyun"
8. `## Step 7: Main flow`: mermaid sequenceDiagram (1–2 main flows)
9. `## Step 8: Data model & DB choice`
10. `## Step 9: Deep dives`: 3–4 subsections, wahi jahan interviewer pressure dalta hai
11. `## Step 10: Decision table`: (Decision | Kyun chuna | Kya nahi chuna, kyun), 5–7 rows
12. `## Step 11: Failures & bottlenecks`: table
13. `## Step 12: "Isko aur better kaise karein"`: end me khud bolne wali improvements
14. `## Step 13: Interviewer ke likely follow-up sawal`: sawal → chhota jawab
15. `## 2-minute recap`: ek paragraph jo interview se pehle padhna hai
16. `## Checklist`

Length: ~180–280 lines.

## File list (slugs)

Topics (`01-topics/`):
00-interview-framework, 01-scaling-basics, 02-sql-vs-nosql, 03-indexing-replication, 04-sharding-consistent-hashing, 05-caching, 06-cap-consistency, 07-message-queues-kafka, 08-real-time-communication, 09-locks-and-contention, 10-idempotency-retries, 11-rate-limiting, 12-blob-storage-cdn, 13-geospatial, 14-search-indexing, 15-counting-top-k, 16-distributed-transactions, 17-unique-id-generation, 18-fan-out, 19-api-design, 20-reliability-observability, 21-numbers-cheatsheet, 22-red-flags

Questions (`02-questions/`):
t1-01-url-shortener, t1-02-rate-limiter, t1-03-news-feed, t1-04-whatsapp-chat, t1-05-bookmyshow, t1-06-uber, t1-07-youtube, t1-08-dropbox, t1-09-notification-system, t1-10-typeahead, t1-11-payment-system, t1-12-web-crawler, t2-13-instagram, t2-14-food-delivery, t2-15-flash-sale, t2-16-leaderboard, t2-17-ad-click-aggregator, t2-18-job-scheduler, t2-19-google-docs, t2-20-distributed-kv-store, t2-21-nearby-places, t2-22-llm-chat-app
