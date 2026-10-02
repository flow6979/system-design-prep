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

**In one line:** a user types "ipl" in the search box, and on every keystroke the **top 5–10 suggestions show up within 100ms** ("ipl score", "ipl 2026 schedule"). The core challenge is to keep the read path very fast, and to keep suggestions fresh based on popularity.

**What the interviewer checks in this question:** precomputing the read path (nothing heavy at query time), the trade-off between a trie and a prefix → top-K store, the data collection pipeline, and caching layers (client, CDN, server).

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Effect on design |
|---|---|---|
| "What are suggestions based on? Only popularity (search frequency)?" | Yes, popularity | Ranking = frequency, with a recency weight |
| "How many suggestions to show?" | Top 5–10 | Store only the top-K for each prefix, not the full list |
| "Latency target?" | < 100ms end-to-end | No sorting at query time, everything is precomputed |
| "How fresh must it be? How fast should a trending query show up?" | Daily is fine for normal, ~15 min for trending | Batch pipeline + a small stream layer |
| "Only prefix match, or typo/spell correction too?" | Only prefix, English lowercase | Simple prefix key, fuzzy is out of scope |
| "Do we need personalization?" | Basic, optional | Global top-K + a small merge with user history |
| "Scale?" | ~100M DAU, ~10 searches per user | Very high read QPS, caching is necessary |

> **Say:** "I will design this in two separate parts: a super-fast read path that serves precomputed top-K, and an offline data pipeline that builds top-K from search logs. There will be no ranking or sorting at query time."

## Step 2: Requirements

**Functional**
1. A user types a prefix and gets the top K (5–10) suggestions, sorted by popularity
2. Suggestions are updated from search logs (daily + near real-time for trending)
3. Offensive/blocked terms are never suggested
4. (Optional) The user's own recent searches show up at the top

**Non-functional**
- **Low latency:** p99 < 100ms (the user should not feel lag while typing)
- **High availability:** search still works if suggestions don't come, but this feature should not look down
- **Eventual consistency:** it is fine if a new trend shows up 15 min late
- **Scale:** extremely read-heavy, writes (log ingestion) are async

## Step 3: Estimation (only what changes the design)

- 100M DAU × 10 searches × ~6 keystrokes (~4 requests after debounce) → **~4B requests/day ≈ 46K QPS** avg, peak ~150K QPS. So we need multiple cache layers.
- Unique queries ~100M. Prefixes (up to max 20 chars) ~1B keys. Each key holds top 10 × ~30 bytes = 300 bytes → **~300 GB**. That won't fit on one machine, so we need **sharding**. But the top prefixes alone (which bring 90% of traffic) are very small and will fit in cache.
- Logs: 1B searches/day × 50 bytes = **50 GB/day**. Batch aggregation (Spark) handles this easily.

> **Say:** "Read QPS is very high and the data is GB scale, so I will compute the answer for every prefix in advance and keep it in a KV store. A query becomes an O(1) lookup."

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

> **Say:** "The suggest API is a GET and is cacheable, so both the browser and the CDN can cache it. Logging is a separate async endpoint, so it won't slow down the read path."

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

**Why each component:**
- **Client debounce + cache:** no call on every keystroke, wait 150ms. If the result for "ip" is in the local cache, don't ask again.
- **CDN:** short prefixes ("a", "ip", "sw") are the same for all users. A 5 min CDN cache means 50%+ of traffic never reaches the origin.
- **Suggest Service:** stateless. Reads `prefix → top-K` from Redis, re-checks the blocklist, and does an optional personalization merge.
- **Redis/KV (prefix → top-K):** O(1) lookup, sub-ms. Sharded by the hash of the prefix.
- **Kafka:** search logs come in at high volume. It decouples and makes replay possible.
- **Spark batch:** daily, accurate counts from the whole day's logs (with time decay).
- **Stream aggregator (Flink):** pushes trending from the last 15 min ("ipl final score") quickly.
- **Top-K Builder:** builds the top-K for each prefix from counts, applies the blocklist filter, and bulk loads into the KV.

## Step 7: Main flow: user types "ipl"

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

**Rebuild flow:** Kafka → S3 → Spark daily count → Top-K Builder takes the top 10 for each prefix → writes new Redis keys with a version (`v42:prefix:ipl`) → flips the pointer `current_version = 42`. Atomic switch, so half-built data is never served.

## Step 8: Data model & DB choice

```text
Redis / KV:
  key   = "v42:p:ipl sc"
  value = [["ipl score", 98123], ["ipl schedule", 55120], ...]   (max 10)

query_stats (Spark output, Parquet on S3):
  query_text, count_7d_decayed, last_seen, region
```

- **Read store:** Redis cluster (or DynamoDB / Cassandra if the data is bigger than RAM). Simple key → value, no joins.
- **Raw logs:** S3 (cheap, perfect for batch).
- Keep the score in the value too, so personalization merge and trending merge can work.

## Step 9: Deep dives (the interviewer will push here)

### 9.1 Trie vs precomputed prefix → top-K
- **Trie with top-K per node:** each node caches the top 10 for that prefix. Lookup = walk the length of the prefix = O(L). Compact in memory (shared prefixes). But a trie is an in-memory structure, hard to distribute and update.
- **Precomputed prefix → top-K in KV:** each prefix is a key. Lookup O(1). Easy to shard, replicate and cache. More memory (prefixes repeat), but storage is cheap.

> **Say:** "Conceptually this is still a trie with top-K at each node. I flatten it into a KV so I get sharding, replication and CDN caching for free. The builder can build a trie offline and dump the output into the KV."

To save memory: limit prefix length to max 20–25 chars, and don't store very rare prefixes (count < threshold) at all.

### 9.2 Data collection pipeline and freshness
- The client sends an event on every search submit → Log Service → Kafka.
- **Batch (daily):** Spark counts over the last 7–30 days of logs with **time decay** (`score = Σ count × 0.9^days_ago`), so old trends slowly go down.
- **Stream (15 min):** Flink detects a sudden spike in a sliding window (count in last 15 min >> normal). Update only the prefixes of these trending queries, not a full rebuild.
- The builder merges the batch top-K and trending for each prefix.
- You can also sample logs (every 10th event), because popularity doesn't need an exact count.

### 9.3 Latency < 100ms: caching layers
1. **Client:** 150ms debounce, a local LRU cache, and prefetch "ipl" results along with "ip" in one response.
2. **CDN:** 1–3 char prefixes are the hottest. With `max-age=300` the CDN serves them.
3. **Suggest service in-memory cache:** the top 100K prefixes in the service's RAM.
4. **Redis:** everything else, sub-ms.

The network is the biggest part, so deploy multi-region and serve the user from the nearest region.

### 9.4 Sharding by prefix
- **Range by first char** ("a–c" on one shard): simple, but it will skew ("s" is huge, "x" is small).
- **Hash of full prefix** (consistent hashing): even load. One request needs just one key, so no range query is needed. Choose this.
- Replicate hot prefixes ("i", "ip") + CDN/local cache, so one shard doesn't take all the load.

### 9.5 Personalization and offensive filter (brief)
- **Personalization:** the user's last 50 searches in a small Redis list. The Suggest Service merges the global top-K with user history (entries that match the prefix). A personalized response is not cached on the CDN, so do this only for logged-in users, and the global part is still cached.
- **Offensive filter:** filter at the builder stage with a blocklist + ML classifier (offline, so cheap). Also do a fast blocklist check at serve time, so a newly blocked term is removed right away without a rebuild.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Precomputed prefix → top-K in Redis/KV** | O(1) lookup, easy sharding + replication, CDN friendly | **Live trie in app memory:** 300 GB doesn't fit on one box, hard to update and distribute. **DB `LIKE 'ipl%' ORDER BY count`:** scan + sort on every keystroke, impossible in 100ms |
| **Offline batch + small stream layer** | Batch is accurate and cheap, stream only for trending | **Live counter update on every search:** 50K+ writes/sec on a hot key, and sorting would be needed on the read path |
| **Client debounce + CDN cache** | 60–80% of requests never reach the origin | **Server call on every keystroke:** 3–4x QPS, and old responses arrive in a race |
| **Hash-based sharding** | Even load, single-key lookup | **Range by first letter:** "s" vs "x" skew, hot shard |
| **Versioned rebuild + pointer flip** | Atomic switch, easy rollback | **In-place overwrite:** during a rebuild, data is half new and half old |
| **No Elasticsearch completion suggester** | KV is cheaper and faster for fixed top-K | **Elasticsearch:** good if you need fuzzy, but at this scale it is costly and has higher latency per keystroke |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle it |
|---|---|---|
| Redis shard down | No suggestions for some prefixes | Replica failover. Until then the CDN/local cache serves. Return an empty list, not an error |
| Batch job fails | Suggestions go stale | The old version keeps being served. Alert + retry |
| Bad rebuild (wrong data) | Wrong suggestions | Roll back the version pointer to the old version |
| Hot prefix ("i") | Load on one shard | CDN + in-memory cache + replicas |
| Kafka lag | Trending is late | Acceptable. Autoscale consumers |
| Offensive term leak | Brand damage | Update the serve-time blocklist right away, CDN purge |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Fuzzy / typo tolerance:** "iplsc" → "ipl score". Precompute edit distance 1 variants offline, or use a small Elasticsearch fallback.
- **Multi-language + region-wise top-K:** put the region in the key (`in:ipl`), because trends in Mumbai and the US are different.
- **ML ranking:** besides frequency, use CTR, freshness and user context as features. Offline model, score stored in the KV.
- **Prefix compression:** a trie snapshot (FST) on disk for long-tail prefixes, only hot prefixes in RAM.
- **A/B testing:** test new ranking versions on 5% of traffic, with a version pointer per bucket.
- **Abuse protection:** bots make fake searches to push a term into trending. Per-user dedup and rate limits on logging.

## Step 13: Likely follow-up questions

- "Why not use a trie directly?" → Conceptually it is a trie, but flattening it into a KV makes it easier to distribute and cache (Step 9.1)
- "How long until a new trending term shows up?" → ~15 min through the stream layer, the rest through the daily batch
- "How do you fit 300 GB of data in RAM?" → Shard it, drop rare prefixes, or use a disk-based KV (RocksDB/DynamoDB) + hot prefix cache
- "Different suggestions for one user?" → Global top-K + user history merge, the personalized part is not cached on the CDN
- "Need to remove an offensive term right away?" → Serve-time blocklist + CDN purge, filter it permanently in the next rebuild
- "What if the network is slow?" → Client prefetch + local cache, and multi-region serving

## 2-minute recap

> Typeahead is extremely read-heavy and must answer within 100ms, so nothing is computed on the read path. We compute the top-K for every prefix in advance and keep it in Redis/KV (conceptually a trie with top-K per node, but flattened into a KV). Lookup is O(1). Shard by prefix hash, and use CDN + in-memory cache for hot prefixes. The client does a 150ms debounce and local caching. Write side: search logs → Kafka → S3 → Spark daily batch (time decay) + Flink 15-min trending → Top-K Builder (blocklist filter) → versioned KV keys and an atomic pointer flip. Personalization = global top-K + user history merge. Offensive terms are filtered in the builder, and there is a blocklist at serve time too.

## Checklist

- [ ] I can ask the clarifying questions (K, latency, freshness, personalization) without looking
- [ ] I can explain the trade-off between a trie and a prefix → top-K KV
- [ ] I can draw the data pipeline (logs → Kafka → batch/stream → rebuild)
- [ ] I can tell the 4 caching layers for 100ms latency
- [ ] I can explain prefix sharding and hot prefix handling
- [ ] I can explain the versioned rebuild and atomic pointer flip
- [ ] I can tell the approach for personalization and the offensive filter
- [ ] I can say 3 trade-offs from the decision table without looking
