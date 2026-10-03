---
title: Design a Web Crawler
order: 12
tier: 1
time: 22
patterns: [URL frontier, Politeness, Bloom filter, Dedup, Batch processing]
topics: [07-message-queues-kafka, 12-blob-storage-cdn, 04-sharding-consistent-hashing, 05-caching, 11-rate-limiting, 20-reliability-observability]
askedAt: [Google, Amazon, Microsoft, Meta, Atlassian]
---

# Design a Web Crawler

**Ek line me:** kuch seed URLs se shuru karke internet ke pages download karo, unke links nikaalo, aur aage crawl karte raho, taaki search engine (Google) ya data pipeline ke liye **1B pages** store ho sakein. Core challenge ye hai ki itna bada crawl **fast, polite aur bina duplicate** ke ho.

**Is question me interviewer kya check karta hai:** URL frontier design (priority + politeness), dedup (URL aur content), scale estimation, aur crawler traps / failures handle karna.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Purpose kya hai? Search indexing ya kisi specific data ke liye?" | Search engine indexing | Sirf HTML, poora page store karna hai |
| "Kitne pages aur kitne time me?" | 1B pages, ~1 mahine me | Throughput ≈ 400 pages/sec, distributed fetchers |
| "Sirf HTML ya images/PDF bhi?" | Sirf HTML | Content-type filter |
| "robots.txt follow karna hai? Politeness?" | Haan, zaroori | Per-domain queue + delay |
| "Recrawl karna hai? Freshness?" | Haan, popular pages jaldi | Priority + recrawl scheduler |
| "JavaScript-rendered pages?" | Out of scope / brief | Headless browser ka mention |
| "Duplicate content handle karna hai?" | Haan | Hash/simhash dedup |

> **Bolo:** "Main crawler ko ek pipeline ki tarah design karunga: frontier → fetch → parse → dedup → store, aur links wapas frontier me. Do cheezein sabse important hain: politeness (kisi site ko overload na karein) aur dedup (same cheez dobara na karein)."

## Step 2: Requirements

**Functional** (user yahan search/indexing team hai)
1. Team seed URLs de, crawler pages fetch kare aur links nikaal ke aage crawl karta rahe
2. Indexer raw HTML + metadata padh sake
3. Site owners ke robots.txt aur crawl-delay hamesha follow hon
4. Pages unke change rate ke hisaab se recrawl hon

**Out of scope:** JS rendering, images/PDF, login wale pages, indexing/ranking khud.

**Non-functional (priority order)**
1. **Politeness (hard rule):** ek domain pe max ~1 request/sec ya robots.txt ka crawl-delay
2. **Throughput:** 1B pages / 30 din ≈ 400 pages/sec avg, ~1K peak, horizontally scalable
3. **Efficiency:** duplicate URL fetch < ~1%, duplicate content store/index nahi
4. **Robustness:** bad HTML, traps, fetcher crash se crawl na ruke, koi URL lost na ho (lease)
5. **Freshness:** news pages ~15 min, baaki ~1 mahina

**CAP choice:** AP. Ek URL do baar ya thoda late crawl ho jaye to chalega, crawl rukna nahi chahiye. Strong consistency sirf politeness pe, jo domain-sharding se ek node pe local rehti hai.

## Step 3: Estimation (sirf jo design badle)

- 1B pages / 30 din ≈ 33M/day ≈ **~400 pages/sec** avg, peak ~1,000/sec.
- Avg page 100 KB → **100 TB** raw HTML. Compress karke ~25 TB. Isliye S3 jaisa blob storage.
- Ek fetch ~500ms–2s (network bound). Ek machine ~500 concurrent async connections → ~300 pages/sec. **~5–10 fetcher machines** kaafi, safety ke liye 20.
- URL dedup: 1B+ URLs (aur seen links ~10B). Exact set me 10B × 50 bytes = 500 GB. **Bloom filter** (1% false positive) ≈ 10 bits/URL → ~12 GB. RAM me aa jayega.
- Bandwidth: 400 × 100 KB = **40 MB/s ≈ 320 Mbps**.
- Metadata: ~10B known URLs × ~100 bytes ≈ **1 TB**, ~2–5K writes/sec (crawl updates + naye URLs), sirf key lookups.

> **Bolo:** "Bottleneck CPU nahi, network aur politeness hai. Isliye async I/O fetchers, aur URL dedup ke liye Bloom filter kyunki exact set bahut bada hai."

## Step 4: Core entities

- **URL record**: url, url_hash, domain, priority, last_crawled_at, next_crawl_at, status, depth
- **Page**: url_hash, s3_path, content_hash, simhash, http_status, fetched_at
- **Domain**: domain, robots_rules, crawl_delay, last_fetch_at, ip
- **Frontier item**: url, priority, domain (queue me)

## Step 5: APIs

Crawler internal system hai, public API nahi. Internal interfaces:

```http
POST /seeds            {urls: [...]}                  → 202 (frontier me add)
GET  /crawl/status     ?url=https://example.com/a      → {lastCrawled, status, s3Path}
POST /crawl/priority   {domain, boost}                 → 200 (news sites boost)

Event: page.fetched  {urlHash, s3Path, contentHash}    → Kafka topic for indexer
```

> **Bolo:** "Bahar ka koi user nahi hai, isliye main components ke beech ke contracts pe focus karunga: frontier ka enqueue/dequeue aur page.fetched event."

## Step 6: High-level design

**Simple v1 pehle:** ek machine: in-memory queue, `seen` hash set, ek fetch → parse loop, files disk pe. 1M pages tak FR1–FR4 ho jaate hain. Numbers isse todte hain: 400–1K pages/sec → kai async fetchers. Kai machines pe politeness → frontier domain-hash se sharded. 10B seen URLs (500 GB exact set) → Bloom filter. 100 TB HTML → S3. ~1 TB metadata → KV store. Do consumers (parser + indexer) aur re-parse ki zarurat → Kafka.

```mermaid
flowchart LR
  SD["Seed URLs"] --> F["URL Frontier (priority + per-domain queues)"]
  F --> FE["Fetcher workers (async)"]
  FE --> DNS[("DNS cache")]
  FE --> RB[("robots.txt cache")]
  FE --> WEB["Internet"]
  FE --> S3[("S3 raw HTML")]
  FE --> K[["Kafka page-fetched"]]
  K --> PA["Parser + Link Extractor"]
  PA --> CD["Content Dedup (simhash)"]
  PA --> UF["URL Filter + Bloom filter"]
  UF --> F
  CD --> MD[("Metadata DB Cassandra")]
  K --> IX["Indexer (downstream)"]
```

**Har component kyun:**
- **URL Frontier (FR1, FR3, FR4):** kya crawl karna hai aur kab. Priority + politeness. Domain hash se sharded, disk-backed (RocksDB). Single FIFO queue ek site ko hammer karti.
- **Fetcher workers (400–1K pages/sec):** async HTTP, ~500 connections per machine. Timeout, max size (5 MB), redirect limit.
- **DNS cache + robots.txt cache:** DNS 10–200ms le sakta hai, robots.txt ~24 hr cache. Har fetch pe dobara lookup = fetcher idle.
- **S3 (100 TB):** sasta, durable, indexer batch me padhe. DB me HTML blob mehnga aur bloat.
- **Kafka `page-fetched` (FR2):** sirf ~1K small events/sec, throughput reason nahi. Reason: do independent consumer groups (parser + indexer) aur 7-day replay, taaki parser bug fix ke baad bina dobara fetch kiye re-parse ho. Simpler option: SNS → do SQS queues, par replay nahi.
- **Parser:** links nikaalna, absolute + normalize karna.
- **URL Filter + Bloom:** seen, blocked, trap-like URLs hatata hai. Bloom frontier nodes ke saath domain-sharded hai (~12 GB / N nodes), alag Redis nahi.
- **Content Dedup:** same/near-same content dobara store/index na ho.
- **Metadata DB Cassandra (~1 TB, 2–5K writes/sec):** sirf key lookups, joins/transactions nahi, built-in sharding + replication. Sharded Postgres bhi chalega, par 10B rows ki sharding manual.

**Mapping:** FR1 → Frontier, Fetchers, Parser, URL Filter. FR2 → S3, Kafka, Metadata DB. FR3 → robots cache + per-domain queues. FR4 → `next_crawl_at` + Frontier priority.

## Step 7: Main flow: ek URL crawl karna

```mermaid
sequenceDiagram
  participant F as Frontier
  participant W as Fetcher
  participant D as DNS cache
  participant R as robots cache
  participant S as Site
  participant S3 as S3
  participant P as Parser
  W->>F: dequeue next URL from a ready domain
  F-->>W: https://example.com/page1
  W->>R: allowed for example.com/page1
  R-->>W: yes, crawl delay 1s
  W->>D: resolve example.com
  D-->>W: 93.184.216.34
  W->>S: GET /page1
  S-->>W: 200 HTML
  W->>S3: put raw HTML
  W->>P: page.fetched event via Kafka
  P->>P: extract links, normalize, simhash
  P->>F: enqueue new unseen URLs
```

## Step 8: Data model & DB choice

```text
url_records (Cassandra, partition key = url_hash):
  url_hash, url, domain, priority, depth, status, last_crawled_at, next_crawl_at, content_hash

domains (Cassandra, next_allowed_fetch_at frontier node ki memory me):
  domain, robots_txt, crawl_delay_ms, next_allowed_fetch_at

S3 layout:
  s3://crawl/2026/10/03/<url_hash>.html.gz
```

- **Cassandra:** billions of rows, write-heavy (har crawl pe update), lookup by key. Joins nahi chahiye.
- **S3:** raw content. Bade WARC files me batch karke likho (chhoti files S3 pe mehngi padti hain).
- **Bloom filter:** har frontier node pe in-memory (sirf apne domains ka), har ghante S3 pe snapshot.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 URL Frontier: priority + politeness
**NFR:** politeness (hard rule) + throughput.
Do level ki queues (Mercator design):
1. **Front queues (priority):** URL ka priority score (PageRank, domain importance, freshness need) dekh ke high/medium/low queues me daalo. Selector zyada baar high queue se uthata hai.
2. **Back queues (politeness):** har domain ki apni FIFO queue. Ek **min-heap** `(next_allowed_time, domain)` rakhta hai. Fetcher heap se woh domain uthata hai jiska time aa gaya, ek URL fetch karta hai, aur `next_allowed_time = now + crawl_delay` set karta hai.

```mermaid
flowchart LR
  IN["New URLs"] --> PR["Prioritizer"]
  PR --> H["High queue"]
  PR --> M["Medium queue"]
  PR --> L["Low queue"]
  H --> RT["Router by domain"]
  M --> RT
  L --> RT
  RT --> D1["Queue: flipkart.com"]
  RT --> D2["Queue: wikipedia.org"]
  D1 --> HP["Min-heap next fetch time"]
  D2 --> HP
  HP --> W["Fetchers"]
```

- Distribute: frontier ko **domain ke hash** se shard karo. Ek domain hamesha ek node pe, isliye politeness locally enforce hoti hai, distributed lock nahi chahiye.
- Frontier bahut bada hota hai (billions URLs), isliye queues disk-backed (RocksDB), sirf head memory me. Kafka yahan fit nahi: lakhon per-domain queues chahiye.

**Trade-off:** ek bada domain (wikipedia) apne node pe hi rehta hai, isliye load thoda uneven.

### 9.2 URL dedup: Bloom filter
**NFR:** efficiency (duplicate fetch < ~1%).
- Pehle **normalize**: lowercase host, default port hatao, fragment (`#...`) hatao, query params sort karo, tracking params (`utm_*`) hatao.
- Fir `bloom.mightContain(url)`. Nahi hai → pakka naya, enqueue. Hai → shayad seen, skip.
- False positive ka matlab hai kuch naye URLs miss honge (~1%). Crawler ke liye acceptable. False negative kabhi nahi hota.
- Exact check chahiye ho to Bloom positive pe Cassandra me lookup (do-step).

**Trade-off:** ~1% naye URLs miss, badle me 500 GB ki jagah ~12 GB RAM.

### 9.3 Content dedup: hash aur simhash
**NFR:** efficiency (duplicate content store/index nahi).
- **Exact duplicate:** body ka SHA-256 / MD5. Same hash already hai → store mat karo, sirf URL ko canonical se link karo. Web pe ~30% pages duplicate/mirror hote hain.
- **Near duplicate:** same article, alag ads/timestamp. **SimHash** (64-bit fingerprint): similar docs ke fingerprint me kuch hi bits alag. Hamming distance ≤ 3 → duplicate maano.
- `<link rel="canonical">` bhi respect karo.

**Trade-off:** SimHash threshold se kabhi alag pages bhi "duplicate" maane ja sakte hain.

### 9.4 Crawler traps aur bad sites
**NFR:** robustness.
- **Infinite URLs:** calendar (`/2026/10/04`, `/2026/10/05`...), session IDs, `?page=1..∞`. Rokne ke liye: **max depth** per domain, **max URL length** (~2,000 chars), **max pages per domain** per crawl cycle, repeating path segments (`/a/b/a/b/a/b`) detect karo.
- **Spider traps / slow servers:** strict timeout (10s), max response size, per-domain error rate zyada ho to domain ko back-off.
- Spam/malicious domains ke liye blocklist.

**Trade-off:** max depth/pages limits se kuch genuine deep pages bhi chhoot jaate hain.

### 9.5 Recrawl aur freshness
**NFR:** freshness (news ~15 min, baaki ~1 mahina).
- Har URL ka `next_crawl_at`. News homepage har 15 min, blog post har mahine.
- **Adaptive:** recrawl pe content_hash same mila → interval double. Badla → interval aadha.
- **Conditional GET** (`If-Modified-Since`, `ETag`) → 304 Not Modified, bandwidth bachti hai.
- Scheduler due URLs ko priority ke saath frontier me wapas daalta hai. Sitemaps (`sitemap.xml` ka `lastmod`) bhi signal dete hain.

**Trade-off:** recrawl bandwidth naye pages se compete karta hai, isliye fresh vs coverage ka budget split.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Two-level frontier (priority + per-domain queues)** | Important pages pehle, politeness guaranteed | **Single FIFO queue:** ek domain ke hazaron URLs line me, site pe hammering. Sacrifice: frontier logic complex |
| **Shard frontier by domain hash** | Domain ki politeness ek node pe, lock nahi | **Shard by URL hash:** politeness ke liye distributed lock/rate limit. Sacrifice: bade domains se uneven load |
| **Bloom filter for URL seen** | 10B URLs ~12 GB me, O(1) | **Exact hash set:** ~500 GB RAM. **DB lookup har link pe:** billions of reads. Sacrifice: ~1% naye URLs miss |
| **SimHash for near-dup** | Ads/timestamps alag ho to bhi duplicate pakde | **Sirf exact hash:** near duplicates miss. Sacrifice: kabhi false duplicate |
| **S3 for raw HTML** | 100 TB sasta, durable, indexer batch me padhe | **Database me HTML blob:** costly, DB bloat. Sacrifice: chhoti files mehngi, isliye WARC batching |
| **Cassandra for URL metadata** | ~1 TB, 2–5K writes/sec, key lookups, built-in sharding | **Sharded Postgres:** chalega, par 10B rows ki manual sharding, aur transactions chahiye hi nahi. Sacrifice: ad-hoc queries/joins nahi |
| **Kafka between fetch and parse** | Do consumer groups (parser + indexer), 7-day replay for re-parse | **Fetcher me hi parse:** parser slow/crash = fetching ruki. **SQS:** replay nahi. Sacrifice: ~1K events/sec ke liye cluster operate karna |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Fetcher machine crash | In-flight URLs lost | Frontier me lease/visibility timeout. Ack nahi aaya to URL wapas queue me |
| DNS slow / down | Fetch ruk jaate hain | Local DNS cache, multiple resolvers, prefetch DNS jab URL enqueue ho |
| Site 5xx / timeout | Retries se site aur dabegi | Exponential backoff per domain, max 3 retries, phir low priority |
| Crawler trap | Frontier ek domain se bhar gaya | Max depth, max pages per domain, URL pattern detection |
| Frontier node down | Uske domains crawl nahi | Disk-backed queues + replica, consistent hashing se domains reassign |
| Bloom filter lost | Duplicate crawl | Periodic snapshot to S3, restart pe reload |
| Hot domain (wikipedia) | Ek queue bahut lambi | Politeness ke andar hi rehna, par allowed ho to multiple IPs/connections |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **JS rendering:** SPA sites ke liye headless Chrome pool, sirf un domains ke liye jahan HTML khaali aata hai (mehnga hai).
- **Geo-distributed fetchers:** site ke region ke paas se fetch, latency aur bandwidth kam.
- **Smarter priority:** PageRank + click data + change rate se ML-based crawl scheduling.
- **WARC format + compaction:** chhote pages ko bade files me pack karke S3 cost kam.

## Step 13: Interviewer ke likely follow-up sawal

- "Ek site ko overload kaise nahi karoge?" → Per-domain back queue + min-heap next_allowed_time + robots crawl-delay (Step 9.1)
- "Same URL dobara crawl na ho?" → Normalize + Bloom filter (Step 9.2)
- "Mirror sites ka duplicate content?" → SHA hash exact ke liye, SimHash near-dup ke liye
- "Infinite calendar pages?" → Max depth, max pages per domain, URL length limit
- "Page update hua to?" → Adaptive recrawl + conditional GET
- **Senior signal:** khud bolo ki bottleneck CPU nahi, politeness + DNS hai: ek bada domain apne frontier node pe hot ban jaata hai, aur frontier node crash pe uske domains ruk jaate hain. Isliye leased dequeue (ack nahi to URL wapas), disk-backed queues + consistent hashing se reassignment, aur per-domain error rate pe auto back-off.

## 2-minute recap (interview se pehle ye padho)

> Crawler ek pipeline hai: seed URLs → frontier → fetchers → S3 → Kafka (parser + indexer consumers, replay) → parser → dedup → wapas frontier. 1B pages/mahina ≈ 400 pages/sec, 100 TB HTML, bottleneck network aur politeness hai. Frontier do level ka hai: priority queues (important pehle) aur per-domain back queues with min-heap (ek domain pe crawl-delay). Frontier domain hash se sharded, taaki politeness local rahe. DNS aur robots.txt cached. URL dedup normalize + Bloom filter (~12 GB, frontier nodes pe domain-sharded), content dedup SHA hash + SimHash. Traps ke liye max depth, max URL length, max pages per domain. Metadata Cassandra me, raw HTML S3 me. Recrawl adaptive interval + conditional GET se.

## Checklist

- [ ] 1B pages ka throughput, storage aur machines ka estimate bina dekhe kar sakta hoon
- [ ] Two-level URL frontier (priority + politeness) ka diagram bana sakta hoon
- [ ] Frontier ko domain se shard karne ka reason bata sakta hoon
- [ ] URL normalization aur Bloom filter dedup samjha sakta hoon
- [ ] Exact hash vs SimHash content dedup ka farak bata sakta hoon
- [ ] Crawler traps ke 3 defenses bol sakta hoon
- [ ] Recrawl freshness (adaptive interval, conditional GET) explain kar sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
