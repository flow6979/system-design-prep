---
title: Design Real-time Leaderboard (Gaming / Dream11)
order: 16
tier: 2
time: 20
patterns: [Sorted sets, Top-K, Sharding, Stream processing]
topics: [15-counting-top-k, 05-caching, 07-message-queues-kafka, 04-sharding-consistent-hashing, 10-idempotency-retries, 08-real-time-communication]
askedAt: [Dream11, MPL, Amazon, Microsoft, Riot Games, Zynga]
---

# Design Real-time Leaderboard (Gaming / Dream11)

**Ek line me:** lakhs players ke scores real-time update hote hain, aur har player ko **top 100** aur **apna rank** turant dikhna chahiye, daily/weekly/contest-wise.

**Is question me interviewer kya check karta hai:** Redis sorted set ka sahi use, SQL `ORDER BY` kyun scale nahi karta, crores users pe sharding, ties, aur score updates ka pipeline (Kafka, idempotency).

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Ek global board ya per contest / per game?" | Per contest + global daily/weekly | Har board ek alag sorted set key |
| "Kitne users ek board pe?" | Bada contest ~2 crore users | Ek ZSET ~2 GB, ek node pe fit, par hot. Sharding discuss karna padega |
| "Score kaise badhta hai? Increment ya overwrite?" | Har event pe points add (Dream11: player ne run banaya) | `ZINCRBY`, events Kafka se |
| "Kitna real-time?" | 1–5 sec delay chalega | Async pipeline OK |
| "Ties kaise tod'ne hain?" | Pehle jo pahuncha wo upar, ya same rank | Composite score |
| "Rank ke alawa kya dikhana hai?" | Top 100 + mera rank + mere aas paas ke 10 | `ZREVRANK`, `ZREVRANGE` |

> **Bolo:** "Main ek board ko Redis sorted set maanunga, score updates Kafka se aayenge, aur DB sirf durability aur history ke liye hoga. Read path pura Redis se."

## Step 2: Requirements

**Functional**
1. Users should be able to apna score badhta dekhein jab game/match event aaye (system score increment kare)
2. Users should be able to kisi board ka top N (jaise top 100) dekhein
3. Users should be able to apna rank aur aas paas ke users dekhein
4. Users should be able to daily, weekly aur per-contest boards dekhein (purane boards archive)

**Out of scope:** scoring rules khud, friends leaderboard, prize payout ka payment flow, anti-cheat ML.

**Non-functional (priority order me)**
1. **Correctness:** har event exactly-once count ho (prize isi pe)
2. **Latency:** top N aur my rank p99 < 50 ms
3. **Freshness:** score update 1–5 sec me board pe
4. **Scale:** ~2 crore users ek contest pe, peak 5 lakh score updates/sec (wicket pe), ~2 lakh rank reads/sec
5. **Durability:** Redis crash pe board rebuild ho sake

**CAP choice:** live board pe availability + eventual consistency (1–5 sec purana rank chalega). Contest khatam hone pe **final freeze** strongly consistent snapshot, kyunki prize usi se bantte hain.

## Step 3: Estimation (sirf jo design badle)

- ZSET entry ~100 bytes → 2 crore users ≈ **2 GB**. Memory me fit hai.
- Dream11 me ek real-world event (wicket) pe ek match ke saare contests ke lakhs teams ka score badalta hai → **5 lakh updates/sec** burst. Ek Redis node ~1 lakh ops/sec. Isliye batching/sharding.
- Reads: crores users har kuch sec "my rank" refresh → ~2 lakh QPS. Top 100 cache karo (sab ke liye same).

> **Bolo:** "Memory problem nahi hai, 2 GB. Problem hai ek key pe write burst aur read QPS. Top N sab ke liye same hai to use cache karunga, aur writes ko batch ya shard karunga."

## Step 4: Core entities

- **Board**: id (`contest:123`, `global:daily:2026-10-03`), type, start_at, end_at
- **ScoreEvent**: event_id, user_id, board_id, delta, ts
- **UserScore**: board_id, user_id, score, updated_at (DB me durable copy)

## Step 5: APIs

```http
POST /boards/{boardId}/scores {userId, delta, eventId}   → 202 (internal, game service se)
GET  /boards/{boardId}/top?n=100                         → [{rank, userId, score}]
GET  /boards/{boardId}/rank/{userId}                     → {rank, score}
GET  /boards/{boardId}/around/{userId}?k=5               → 5 upar + 5 neeche
```

## Step 6: High-level design

**Simple v1 pehle:** game service → Leaderboard Service → ek Redis ZSET per board (`ZINCRBY` sync), reads bhi wahi se, aur Postgres me `user_scores`. Chhote game (hazaaron updates/sec) ke liye ye kaafi hai. Numbers isko todte hain: wicket pe **5 lakh updates/sec burst** (ek Redis node ~1 lakh ops/sec, ek Postgres bhi nahi le sakta) → Kafka buffer + batching worker, aur write-heavy durable copy → Cassandra.

```mermaid
flowchart LR
  GS["Game / Match Service"] --> K[["Kafka score events"]]
  K --> SW["Score Worker"]
  SW --> R[("Redis ZSET boards")]
  SW --> DB[("Cassandra user_scores")]
  C["Client"] --> G["API Gateway"]
  G --> LS["Leaderboard Service"]
  LS --> TC["Top-N cache 1 sec"]
  LS --> R
  AR["Archiver at board end"] --> R
  AR --> S3[("Object storage snapshots")]
```

**Har component kyun:** (FR1 → Kafka + Score Worker + Redis, FR2/FR3 → Leaderboard Service + Redis + Top-N cache, FR4 → per-period keys + Archiver)
- **Kafka:** 5 lakh events/sec burst absorb, `user_id` partition se per-user order, aur retention se **replay** (Redis rebuild). Simpler SQS me replay aur per-key ordering nahi; sync write burst pe Redis gira deta.
- **Score Worker:** `eventId` dedup, 200 ms batch me per-user deltas jod ke `ZINCRBY` pipeline (burst 5–10x kam).
- **Redis ZSET:** `O(log N)` update/rank, top N range query. 2 crore users ≈ 2 GB, ek node me fit.
- **Leaderboard Service + Top-N cache:** top 100 sab ke liye same, 1 sec in-process cache se Redis read load 100x kam.
- **Cassandra:** durable copy, batching ke baad bhi lakhs writes/sec, sirf `(board_id, user_id)` key access, joins/transactions nahi. Postgres ko itne writes ke liye bahut shards chahiye.
- **Archiver:** board khatam hone pe ZSET snapshot S3 me (history, prizes). Simple cron job.

## Step 7: Main flow: score update aur rank read

```mermaid
sequenceDiagram
  participant GS as Match Service
  participant K as Kafka
  participant W as Score Worker
  participant R as Redis
  participant DB as Scores DB
  participant U as User
  participant L as Leaderboard Svc
  GS->>K: ScoreEvent eventId e9, user u1, +25
  K->>W: consume batch
  W->>R: SET seen:e9 NX EX 86400
  W->>R: ZINCRBY board:c123 25 u1
  W->>DB: UPSERT absolute score 310
  W->>K: commit offset
  U->>L: GET rank u1
  L->>R: ZREVRANK board:c123 u1 and ZSCORE
  R-->>L: rank 4120, score 310
  L-->>U: rank 4121, score 310
```

## Step 8: Data model & DB choice

```text
Redis:  board:{boardId}         ZSET  member=userId  score=composite
        seen:{eventId}          STRING (dedup, TTL 1 day)
Cassandra: user_scores(board_id, user_id, score, updated_at, PK((board_id), user_id))
S3:        final board snapshots + archived score events (audit)
```

- **Redis** = serving layer. **Cassandra** = durable copy. Worker `ZINCRBY` ka return (naya total) Cassandra me likhta hai, isliye write idempotent hai (`score = score + delta` counter nahi). Chhote scale (< 10K writes/sec) pe Postgres hi theek hota.
- Rank `ZREVRANK` 0-based hai, isliye API me +1.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 SQL kyun nahi, sorted set kyun?
**NFR:** my rank p99 < 50 ms at ~2 lakh QPS.
- `SELECT COUNT(*) FROM scores WHERE score > my_score` → crores rows pe har request full index range scan. 2 lakh QPS pe DB khatam.
- Redis ZSET = skip list + hash. `ZINCRBY` O(log N), `ZREVRANK` O(log N), `ZREVRANGE 0 99` O(log N + 100).
- Top 100: `ZREVRANGE board:c123 0 99 WITHSCORES`. My neighbours: rank nikalo, phir `ZREVRANGE board r-5 r+5`.
- **Trade-off:** pura board RAM me (2 GB per bada contest); SQL ki flexible queries chhodi.

### 9.2 Ties kaise handle karoge?
**NFR:** correctness (prize ke liye rank deterministic).
- **Same score = same rank** chahiye: `ZCOUNT board (score +inf` + 1 = rank (jitne strictly upar hain + 1).
- **Pehle pahuncha wo upar:** composite score = `score * 10^10 + (MAX_TS - ts)`. Double precision 2^53 tak exact hai, isliye score aur ts range ka dhyaan rakho (ya seconds use karo).
- Interviewer ko batao ki business se poochna padega kaunsa chahiye.
- **Trade-off:** composite score me precision limit; `ZCOUNT` wala tarika ek extra call.

### 9.3 Crores users: sharding
**NFR:** scale (write burst + memory) bina rank latency tode.
- **Hash by user_id** across N shards: writes spread ho jaate hain, par global rank ke liye har shard se count chahiye (scatter-gather). Top N: har shard ka top N, merge karo.
- **Score buckets (range sharding):** shard 1 = score 0–100, shard 2 = 100–500, ... User ka rank = uske shard me rank + upar wale shards ke total counts (ye counts cache me). Top N sirf top shard se.
- Drawback: score badhne pe user shard change karta hai (remove + add), aur buckets skewed ho sakte hain. Buckets ko distribution dekh ke set karo.
- **Approximate rank** bhi chalega bahut neeche walon ke liye: "aap top 35% me ho". Exact rank sirf top 10K ke liye.
- **Trade-off:** sharding tabhi jab ek node kam pade (2 GB pe zarurat nahi); har shard scheme me rank query complex hoti hai.

### 9.4 Updates ka pipeline, durability aur boards
**NFR:** exactly-once scoring + Redis crash pe rebuild.
- Har event ka `eventId`. Worker `SET seen:{eventId} NX` se dedup, taaki Kafka redelivery pe double score na ho.
- Burst me worker events ko 200ms batch karke ek user ke deltas jod ke ek `ZINCRBY` bheje (Redis pipeline).
- Redis crash: DB se rebuild (`user_scores` scan karke `ZADD` batch) ya Kafka offset se replay.
- **Daily/weekly:** alag keys `global:daily:2026-10-03`, `global:weekly:2026-W40`. Ek event dono me `ZINCRBY`. Key pe `EXPIRE` board khatam hone ke baad 7 din. Khatam board ka snapshot S3 me.
- **Trade-off:** 200 ms batching = thoda freshness gaya, badle me Redis pe 5–10x kam ops.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Redis sorted set** for ranking | O(log N) update aur rank, top N built-in | **SQL ORDER BY / COUNT:** har rank query crores rows scan. **Elasticsearch:** rank query natural nahi. Sacrifice: RAM cost, durability alag se |
| **Kafka** for score events | 5 lakh/sec burst, replay se rebuild, per-user order | **Direct Redis write:** burst pe overload. **SQS:** replay aur per-key order nahi. Sacrifice: Kafka cluster ops, 1–5 sec lag |
| **Cassandra as durable copy** | Lakhs writes/sec, simple key access, prize audit | **Postgres:** is write rate pe heavy sharding. **Sirf Redis + AOF:** prize ke liye ek in-memory store risky. Sacrifice: ek aur DB chalana |
| **Event dedup with eventId** | At-least-once Kafka pe bhi exactly-once score | **Bina dedup:** redelivery pe double points. Sacrifice: har event pe ek extra Redis write |
| **Score-bucket sharding** at huge scale | Top N ek shard se, rank = local rank + upar ke counts | **Hash sharding:** har rank query scatter-gather. Sacrifice: user shard badalta hai, skew |
| **Top N cache 1 sec** | Sab ke liye same data, Redis read load 100x kam | **Har request Redis se:** bekaar load. Sacrifice: top N 1 sec purana |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Redis node crash | Board gayab | Replica failover. Worst case Cassandra se rebuild ya Kafka replay |
| Worker crash beech me | Event aadha process | Offset commit baad me, dedup key se retry safe |
| Hot board (IPL final) | Ek key pe write burst | Worker side batching, read replicas, top N cache |
| Kafka lag | Board 30 sec purana | Consumer scale karo, partitions badhao, lag alert |
| Cheating / fake scores | Galat winner | Score sirf server-side Match Service se, client se kabhi nahi |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **WebSocket push** top 10 changes ka, polling ki jagah
- **Friends leaderboard:** friends list ke scores `ZMSCORE` se laake sort, ya per-user small ZSET
- Neeche ke users ke liye **percentile rank** (approx), exact sirf top 10K
- Contest khatam hone pe **final freeze**: board read-only, snapshot se prize distribution

## Step 13: Interviewer ke likely follow-up sawal

- "Redis memory se bada ho gaya to?" → score-bucket sharding ya Redis Cluster pe multiple boards spread
- "Ek user ka score ghatana ho (penalty)?" → `ZINCRBY` negative delta, same pipeline
- "Exactly-once scoring?" → eventId dedup + DB upsert idempotent
- "Rank 1-based dense ya competition ranking?" → `ZCOUNT` se competition rank, business se poochho
- "Historical: last week ka rank 1 kaun tha?" → S3 snapshot, Redis se nahi
- **Senior signal:** khud bolo: asli bottleneck ek hot board key hai (IPL final pe sab ek ZSET pe). Redis shard single-threaded hai, isliye worker aggregation, read replicas, top-N cache, aur Kafka lag pe freshness SLO alert.

## 2-minute recap (interview se pehle ye padho)

> Leaderboard = Redis sorted set per board. Score events game service se Kafka me jaate hain (5 lakh/sec burst + replay). Score Worker `eventId` se dedup, 200 ms batch karke `ZINCRBY` karta hai aur naya total Cassandra me likhta hai, taaki Redis crash pe rebuild ho sake. Top N `ZREVRANGE 0 99`, my rank `ZREVRANK`, neighbours rank ke aas paas ka range. Top N ko 1 sec cache karo. Ties ke liye composite score (score + reverse timestamp) ya `ZCOUNT` se same rank. 2 crore users ≈ 2 GB, memory fit hai, par write burst ke liye batching, aur bahut bade scale pe score-bucket sharding: rank = shard ka local rank + upar ke shards ka count. Daily/weekly alag keys, TTL ke saath, aur khatam board ka snapshot.

## Checklist

- [ ] SQL `COUNT/ORDER BY` kyun fail hota hai bata sakta hoon
- [ ] ZINCRBY, ZREVRANK, ZREVRANGE se top N aur my rank bata sakta hoon
- [ ] Ties ke dono approaches samjha sakta hoon
- [ ] Score-bucket vs hash sharding ka trade-off bata sakta hoon
- [ ] Kafka + dedup se exactly-once scoring explain kar sakta hoon
- [ ] Redis crash pe rebuild aur daily/weekly boards ka design bata sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
