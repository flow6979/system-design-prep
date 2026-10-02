---
title: Design Typeahead / Autocomplete
order: 10
tier: 1
time: 22
patterns: [Trie, Precomputed top-K, Caching, Batch pipeline, Sharding]
topics: [15-counting-top-k, 05-caching, 07-message-queues-kafka, 04-sharding-consistent-hashing, 12-blob-storage-cdn, 14-search-indexing]
askedAt: [Google, Amazon, Microsoft, Flipkart, LinkedIn]
---

# Design Typeahead / Autocomplete

**Ek line me:** user search box me "ipl" type kare, aur har keystroke pe **100ms ke andar top 5–10 suggestions** dikhein ("ipl score", "ipl 2026 schedule"). Core challenge ye hai ki read path bahut fast ho, aur suggestions popularity ke hisaab se fresh rahein.

**Is question me interviewer kya check karta hai:** read path ko precompute karna (query time pe kuch heavy nahi karna), trie ya prefix → top-K store ka trade-off, data collection pipeline, aur caching layers (client, CDN, server).

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Suggestions kis basis pe? Sirf popularity (search frequency)?" | Haan, popularity | Ranking = frequency, recency weight ke saath |
| "Kitne suggestions dikhane hain?" | Top 5–10 | Har prefix pe sirf top-K store karo, poori list nahi |
| "Latency target?" | < 100ms end-to-end | Query time pe sorting nahi, sab precomputed |
| "Freshness kitni chahiye? Trending query kitni jaldi dikhe?" | Normal ke liye daily chalega, trending ke liye ~15 min | Batch pipeline + chhota stream layer |
| "Sirf prefix match ya typo/spell correction bhi?" | Sirf prefix, English lowercase | Simple prefix key, fuzzy out of scope |
| "Personalization chahiye?" | Basic, optional | Global top-K + user history ka chhota merge |
| "Scale?" | ~100M DAU, har user ~10 search | Read QPS bahut high, caching zaroori |

> **Bolo:** "Main do alag hisson me design karunga: ek super-fast read path jo precomputed top-K serve kare, aur ek offline data pipeline jo search logs se top-K banaye. Query time pe koi ranking ya sorting nahi hogi."

## Step 2: Requirements

**Functional**
1. User prefix type kare, top K (5–10) suggestions mile, popularity se sorted
2. Search logs se suggestions update hon (daily + trending ke liye near real-time)
3. Offensive/blocked terms kabhi suggest na hon
4. (Optional) User ki apni recent searches upar aayein

**Non-functional**
- **Low latency:** p99 < 100ms (user ko typing ke saath lag na lage)
- **High availability:** suggestions na aayein to search fir bhi chale, par ye feature down nahi dikhna chahiye
- **Eventual consistency:** naya trend 15 min late dikhe to chalega
- **Scale:** extremely read-heavy, writes (log ingestion) async

## Step 3: Estimation (sirf jo design badle)

- 100M DAU × 10 searches × ~6 keystrokes (debounce ke baad ~4 requests) → **~4B requests/day ≈ 46K QPS** avg, peak ~150K QPS. Isliye multiple cache layers chahiye.
- Unique queries ~100M. Prefixes (max 20 chars tak) ~1B keys. Har key pe top 10 × ~30 bytes = 300 bytes → **~300 GB**. Ek machine me nahi aayega, **sharding** chahiye. Par sirf top prefixes (jo 90% traffic laate hain) bahut chhote hain, cache me aa jayenge.
- Logs: 1B searches/day × 50 bytes = **50 GB/day**. Batch aggregation (Spark) easily sambhal lega.

> **Bolo:** "Read QPS bahut high hai aur data GB scale ka hai, isliye har prefix ka answer pehle se compute karke KV store me rakhunga. Query ek O(1) lookup ban jayegi."

## Step 4: Core entities

- **Query log**: query_text, user_id, timestamp, region
- **Query stats**: query_text, count, last_seen (aggregated)
- **Prefix entry**: prefix → list of (query, score), max K
- **Blocklist**: offensive terms / patterns
- **User history** (optional): user_id → recent queries

## Step 5: APIs

```http
GET /suggest?q=ipl%20sc&limit=10&lang=en     → ["ipl score", "ipl schedule", ...]
    Response header: Cache-Control: public, max-age=300

POST /log/search  {query, userId, ts}         → 202 Accepted (async, fire-and-forget)
```

> **Bolo:** "Suggest API GET hai aur cacheable hai, taaki browser aur CDN dono cache kar sakein. Logging alag async endpoint hai, read path ko slow nahi karega."

## Step 6: High-level design

```mermaid
flowchart LR
  C["Client (debounce + local cache)"] --> CDN["CDN (hot prefixes)"]
  CDN --> G["API Gateway"]
  G --> S["Suggest Service"]
  S --> RC[("Redis prefix to top-K")]
  C -- "search event" --> L["Log Service"]
  L --> K[["Kafka search-logs"]]
  K --> SP["Stream aggregator (trending)"]
  K --> S3[("S3 raw logs")]
  S3 --> B["Spark batch job (daily)"]
  B --> BU["Top-K Builder + filter"]
  SP --> BU
  BU --> RC
```

**Har component kyun:**
- **Client debounce + cache:** har keystroke pe call nahi, 150ms ruko. "ip" ka result local cache me ho to dobara mat maango.
- **CDN:** short prefixes ("a", "ip", "sw") sab users ke liye same hain. CDN pe 5 min cache se 50%+ traffic origin tak aata hi nahi.
- **Suggest Service:** stateless. Redis se `prefix → top-K` uthata hai, blocklist re-check, optional personalization merge.
- **Redis/KV (prefix → top-K):** O(1) lookup, sub-ms. Prefix ke hash se sharded.
- **Kafka:** search logs high volume me aate hain. Decouple karta hai aur replay possible.
- **Spark batch:** daily poore din ke logs se accurate counts (time decay ke saath).
- **Stream aggregator (Flink):** last 15 min ka trending ("ipl final score") jaldi push karta hai.
- **Top-K Builder:** counts se har prefix ka top-K banata hai, blocklist filter lagata hai, aur KV me bulk load karta hai.

## Step 7: Main flow: user "ipl" type karta hai

```mermaid
sequenceDiagram
  participant U as User
  participant CL as Client
  participant CDN as CDN
  participant S as Suggest Service
  participant R as Redis
  U->>CL: types i, p, l
  CL->>CL: debounce 150ms, check local cache for ipl
  CL->>CDN: GET /suggest?q=ipl
  CDN-->>CL: cache hit, top 10
  U->>CL: types ipl sc
  CL->>CDN: GET /suggest?q=ipl sc
  CDN->>S: cache miss
  S->>R: GET prefix ipl sc
  R-->>S: ipl score, ipl schedule
  S-->>CDN: top-K, max-age 300
  CDN-->>CL: suggestions
```

**Rebuild flow:** Kafka → S3 → Spark daily count → Top-K Builder har prefix ka top 10 nikaalta hai → nayi Redis keys version ke saath (`v42:prefix:ipl`) likhta hai → pointer `current_version = 42` flip. Atomic switch, aadha-adhura data serve nahi hota.

## Step 8: Data model & DB choice

```text
Redis / KV:
  key   = "v42:p:ipl sc"
  value = [["ipl score", 98123], ["ipl schedule", 55120], ...]   (max 10)

query_stats (Spark output, Parquet on S3):
  query_text, count_7d_decayed, last_seen, region
```

- **Read store:** Redis cluster (ya DynamoDB / Cassandra agar data RAM se bada ho). Simple key → value, koi join nahi.
- **Raw logs:** S3 (sasta, batch ke liye perfect).
- Value me score bhi rakho, taaki personalization merge aur trending merge ho sake.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 Trie vs precomputed prefix → top-K
- **Trie with top-K per node:** har node pe us prefix ke top 10 cache. Lookup = prefix ki length tak walk = O(L). Memory me compact (shared prefixes). Par trie ek in-memory structure hai, distribute karna aur update karna mushkil.
- **Precomputed prefix → top-K in KV:** har prefix ek key. Lookup O(1). Easily sharded, replicate, cache. Memory zyada (prefixes repeat), par storage sasta hai.

> **Bolo:** "Concept me ye trie hi hai jisme har node pe top-K hai. Main usse flatten karke KV me rakhta hoon, taaki sharding, replication aur CDN caching free me mil jaye. Builder offline trie bana sakta hai, aur output KV me dump kar sakta hai."

Memory bachane ke liye: prefix length max 20–25 chars, aur bahut rare prefixes (count < threshold) store hi mat karo.

### 9.2 Data collection pipeline aur freshness
- Client har search submit pe event bhejta hai → Log Service → Kafka.
- **Batch (daily):** Spark last 7–30 din ke logs pe count, **time decay** (`score = Σ count × 0.9^days_ago`) taaki purana trend dheere neeche jaye.
- **Stream (15 min):** Flink sliding window me sudden spike detect kare (count in last 15 min >> normal). Sirf in trending queries ke prefixes ko update karo, poora rebuild nahi.
- Builder har prefix ke liye batch top-K aur trending ko merge karta hai.
- Logs me sampling bhi kar sakte ho (har 10th event) kyunki popularity ke liye exact count zaroori nahi.

### 9.3 Latency < 100ms: caching layers
1. **Client:** 150ms debounce, local LRU cache, aur ek response me "ip" ke saath "ipl" ke results bhi prefetch.
2. **CDN:** 1–3 char prefixes sabse hot hain. `max-age=300` se CDN serve karega.
3. **Suggest service in-memory cache:** top 1 lakh prefixes service ke RAM me.
4. **Redis:** baaki sab, sub-ms.

Network ka sabse bada hissa hai, isliye multi-region deploy karo aur user ko nearest region se serve karo.

### 9.4 Sharding by prefix
- **Range by first char** ("a–c" ek shard): simple, par skew hoga ("s" bahut bada, "x" chhota).
- **Hash of full prefix** (consistent hashing): load even. Ek request ko ek hi key chahiye, isliye range query ki zaroorat nahi. Ye choose karo.
- Hot prefixes ("i", "ip") ko replicate karo + CDN/local cache, taaki ek shard pe load na aaye.

### 9.5 Personalization aur offensive filter (brief)
- **Personalization:** user ki last 50 searches ek chhoti Redis list me. Suggest Service global top-K aur user history (jo prefix se match kare) ko merge karta hai. Personalized response CDN pe cache nahi hota, isliye sirf logged-in users ke liye, aur global part fir bhi cached.
- **Offensive filter:** Builder stage pe blocklist + ML classifier se filter (offline, isliye cheap). Serve time pe bhi ek fast blocklist check, taaki naya blocked term turant hat jaye bina rebuild ke.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Precomputed prefix → top-K in Redis/KV** | O(1) lookup, easy sharding + replication, CDN friendly | **Live trie in app memory:** 300 GB ek box me nahi aata, update aur distribute karna mushkil. **DB `LIKE 'ipl%' ORDER BY count`:** har keystroke pe scan + sort, 100ms me impossible |
| **Offline batch + small stream layer** | Batch accurate aur sasta, stream sirf trending ke liye | **Har search pe live counter update:** 50K+ writes/sec ek hot key pe, aur read path pe sorting karni padti |
| **Client debounce + CDN cache** | 60–80% requests origin tak aati hi nahi | **Har keystroke pe server call:** QPS 3–4x, aur purane responses race me aate |
| **Hash-based sharding** | Even load, single-key lookup | **Range by first letter:** "s" vs "x" ka skew, hot shard |
| **Versioned rebuild + pointer flip** | Atomic switch, rollback easy | **In-place overwrite:** rebuild ke beech aadha naya aadha purana data |
| **Elasticsearch completion suggester nahi** | Fixed top-K ke liye KV sasta aur fast | **Elasticsearch:** fuzzy chahiye ho to accha, par is scale pe har keystroke ke liye costly aur latency zyada |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Redis shard down | Kuch prefixes ke suggestions nahi | Replica failover. Tab tak CDN/local cache serve kare. Empty list return karo, error nahi |
| Batch job fail | Suggestions stale | Purana version serve hota rahega. Alert + retry |
| Bad rebuild (galat data) | Galat suggestions | Version pointer purane version pe rollback |
| Hot prefix ("i") | Ek shard pe load | CDN + in-memory cache + replicas |
| Kafka lag | Trending late | Acceptable. Consumer autoscale |
| Offensive term leak | Brand damage | Serve-time blocklist turant update, CDN purge |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Fuzzy / typo tolerance:** "iplsc" → "ipl score". Edit distance 1 variants offline precompute karo, ya chhota Elasticsearch fallback.
- **Multi-language + region-wise top-K:** key me region daalo (`in:ipl`), kyunki Mumbai aur US ke trends alag hain.
- **ML ranking:** frequency ke alawa CTR, freshness, user context ko features banao. Offline model, score KV me.
- **Prefix compression:** long-tail prefixes ke liye trie snapshot (FST) disk pe, sirf hot prefixes RAM me.
- **A/B testing:** naye ranking versions ko 5% traffic pe test, version pointer per-bucket.
- **Abuse protection:** bots fake searches karke kisi term ko trending banayein. Per-user dedup aur rate limit logging pe.

## Step 13: Interviewer ke likely follow-up sawal

- "Trie kyun nahi seedha?" → Concept trie hi hai, par KV me flatten karna distribute aur cache karna aasaan banata hai (Step 9.1)
- "Naya trending term kitni der me dikhega?" → Stream layer se ~15 min, baaki daily batch
- "300 GB data RAM me kaise?" → Shard karo, rare prefixes drop karo, ya disk-based KV (RocksDB/DynamoDB) + hot prefix cache
- "Ek user ke liye alag suggestions?" → Global top-K + user history merge, personalized part CDN cache nahi hota
- "Offensive term turant hatana ho?" → Serve-time blocklist + CDN purge, next rebuild me permanently filter
- "Network slow hai to?" → Client prefetch + local cache, aur multi-region serving

## 2-minute recap (interview se pehle ye padho)

> Typeahead extremely read-heavy hai aur 100ms ke andar chahiye, isliye read path pe kuch compute nahi hota. Har prefix ka top-K pehle se compute karke Redis/KV me rakhte hain (concept trie with top-K per node, par KV me flattened). Lookup O(1). Prefix hash se sharding, hot prefixes ke liye CDN + in-memory cache. Client 150ms debounce aur local cache karta hai. Write side: search logs → Kafka → S3 → Spark daily batch (time decay) + Flink 15-min trending → Top-K Builder (blocklist filter) → versioned KV keys aur atomic pointer flip. Personalization = global top-K + user history merge. Offensive terms builder pe filter, serve time pe bhi blocklist.

## Checklist

- [ ] Clarifying sawal (K, latency, freshness, personalization) bina dekhe pooch sakta hoon
- [ ] Trie vs prefix → top-K KV ka trade-off samjha sakta hoon
- [ ] Data pipeline (logs → Kafka → batch/stream → rebuild) ka diagram bana sakta hoon
- [ ] 100ms latency ke liye 4 caching layers bata sakta hoon
- [ ] Prefix sharding aur hot prefix handling explain kar sakta hoon
- [ ] Versioned rebuild aur atomic pointer flip samjha sakta hoon
- [ ] Personalization aur offensive filter ka approach bata sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
