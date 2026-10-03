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

## New questions (added later)
t2-23-recommendation-system, t2-24-ecommerce-inventory, t2-25-discord, t2-26-distributed-logging

## LLD / Design patterns files (`03-lld/`)

Files: `01-oops.md`, `02-solid.md`, `03-creational.md`, `04-structural.md`, `05-behavioral.md`

Frontmatter:
```yaml
---
title: Creational Patterns
order: 3
time: 15
---
```

Rules:
- Har concept/pattern ek `## ` section hai. Important / most-used wale ke heading me star: `## ⭐ Singleton`. Baaki bina star: `## Prototype`.
- `## ` sirf pattern/concept sections ke liye use karo (aur last me `## Checklist`). Andar subheadings `### ` ya bold text se.
- Har section ka format:
  1. **Ek line me:** kya problem solve karta hai
  2. **Real example:** roz ki zindagi / Indian app example (1–2 lines)
  3. **Kab use karo / kab nahi:** 2–3 bullets
  4. Code: pehle ```java block, uske turant baad ```cpp block. Dono same cheez dikhayein. Chhota (15–40 lines), runnable-ish, `main` ke saath usage. Website ek time pe sirf ek language dikhati hai (user toggle karta hai), isliye dono hamesha do.
  5. **LLD problems me kahan:** (Parking Lot, Elevator, Splitwise, BookMyShow, Vending Machine, Logger, Chess, Snake & Ladder, Rate limiter…)
  6. **Interview me bolo:** ek ready line
  7. **Common galti:** 1–2 bullets
- Mermaid class diagram optional (sirf jahan bahut help kare), `classDiagram` syntax.
- File ke end me `## Checklist` with 5–8 `- [ ]` items.
- C++: C++17, `#include`s ke saath, smart pointers (`std::unique_ptr`/`shared_ptr`) prefer karo, raw `new` avoid.
- Java: Java 17, single-file style (ek public class + nested/static classes ya extra non-public classes).

## Java files (`04-java/`, English mirror in `content-en/04-java/`)

Files (slug → title):
01-basics (Java Basics: primitives & types), 02-strings (Strings), 03-arrays (Arrays), 04-oops (OOP in Java), 05-collections-overview (Collections Framework), 06-lists (ArrayList & LinkedList), 07-maps-sets (HashMap, TreeMap & Sets), 08-queues (Queue, Deque & PriorityQueue), 09-generics (Generics), 10-exceptions (Exceptions), 11-jvm-memory (JVM & Memory), 12-streams-lambdas (Lambdas & Streams), 13-modern-java (Modern Java 8–21), 14-concurrency (Concurrency), 15-interview-qa (Java Interview Rapid-fire)

Frontmatter:
```yaml
---
title: Strings
order: 2
time: 20
---
```

Rules:
- Same as LLD: each concept is a `## ` section; must-know ones get `## ⭐ …` (website "Only ⭐" filter uses this).
- Section format (adapt when a part does not fit):
  1. **Ek line me:** / **In one line:**
  2. Short explanation (with a mermaid diagram only where it really helps, e.g. HashMap buckets, JVM memory areas, collections hierarchy, thread states)
  3. ```java code example (runnable style, `main` where useful, 10–40 lines, comments in the file's language)
  4. **Important methods** table where relevant: `| Method | Kya karta hai / What it does | Time complexity |`
  5. **Interview tip:** (Hinglish file) / **Interview tip:** (English file) — what interviewers ask and the crisp answer
  6. **Common galti:** / **Common mistake:**
- Only Java code (no C++). Java 17+ syntax unless the section is about a specific newer feature (say which version).
- Cover depth expected at SDE-1/SDE-2 interviews: internals (e.g. HashMap resize/treeify, String pool, ArrayList growth, GC generations), time complexities, pitfalls (== vs equals, Integer cache, ConcurrentModificationException, autoboxing NPE).
- End with `## Checklist` (6–10 items) — same count and order in both languages.
- Hinglish file in `content/04-java/`, English file with the same name in `content-en/04-java/`. English uses headings/labels in English; keep ⭐ in the same headings; same code (comments translated).

## Database files (`05-db/`, English mirror in `content-en/05-db/`)

Files (slug → title):
01-choosing-a-database (Choosing a Database), 02-relational-sql (Relational Databases: PostgreSQL & MySQL), 03-transactions-acid (Transactions & ACID), 04-indexes (Indexes), 05-key-value (Key-Value: Redis & DynamoDB), 06-document (Document: MongoDB & Firestore), 07-wide-column (Wide-column: Cassandra & ScyllaDB), 08-search (Search: Elasticsearch), 09-time-series (Time-series Databases), 10-graph (Graph Databases), 11-vector (Vector Databases), 12-columnar-olap (Columnar / OLAP), 13-newsql (NewSQL / Distributed SQL), 14-scaling-databases (Scaling Databases), 15-object-storage (Object Storage: S3), 16-interview-qa (Database Interview Rapid-fire)

Frontmatter: `title`, `order` (file number), `time` (minutes).

Rules (same spirit as Java files):
- Each concept is a `## ` section; must-know ones get `## ⭐ …`. End with `## Checklist` (6–10 items, same count/order in both languages).
- Database pages should cover, where they apply: **Ek line me / In one line**, data model (small mermaid diagram if it helps), **real example** (Indian apps: Swiggy, Zerodha, Uber, Paytm, Flipkart…), **important commands / methods** table (`| Command / method | Kya karta hai / What it does | Example |`) with the real syntax of that DB (SQL, Redis commands, MongoDB shell methods, DynamoDB API calls, CQL, Elasticsearch query DSL, Cypher, PromQL, etc.), a code block of realistic usage (```sql, ```bash for redis-cli, ```javascript for mongo shell, ```json for ES DSL, ```python where an SDK is clearer), **features**, **kab use karo / kab nahi** (when to use / when not), **kin system design questions me** with links to existing HLD pages (`../02-questions/<slug>.md`, `../01-topics/<slug>.md` — only slugs from STYLE.md lists), **Interview tip**, **Common galti / Common mistake**.
- Comparison tables are welcome (e.g. Redis vs Memcached, Postgres vs MySQL, Cassandra vs DynamoDB).
- Depth: SDE-1/SDE-2 interviews. Real internals where interviewers dig (MVCC, WAL, B-tree vs LSM, Dynamo partitioning, Cassandra write path, ES inverted index, HNSW).
- Hinglish file in `content/05-db/`, English file with the same name in `content-en/05-db/`, same structure, same ⭐ headings, same code (comments translated). Mermaid rules from above apply (quote every node label).
