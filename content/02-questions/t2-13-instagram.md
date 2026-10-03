---
title: Design Instagram
order: 13
tier: 2
time: 22
patterns: [Pre-signed upload, Async processing, CDN, Hybrid fan-out, Counters, TTL]
topics: [12-blob-storage-cdn, 18-fan-out, 05-caching, 07-message-queues-kafka, 15-counting-top-k, 04-sharding-consistent-hashing, 02-sql-vs-nosql]
askedAt: [Meta, Amazon, Google, Microsoft, ShareChat]
---

# Design Instagram

**Ek line me:** users photos upload karte hain, dusron ko follow karte hain, aur apni feed me followed logon ki posts dekhte hain, saath me likes, comments aur 24 ghante wali stories. Core challenge ye hai ki **heavy media fast upload aur serve ho**, aur **feed jaldi bane**, chahe kisi celebrity ke 50 crore followers hon.

**Is question me interviewer kya check karta hai:** blob storage + CDN ka sahi use, upload path ko app servers se hatana, async image processing, feed ka fan-out trade-off, aur hot counters (likes).

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Core features: upload, follow, feed, like/comment? Stories bhi?" | Haan, stories bhi | Stories ke liye TTL storage |
| "Sirf photos ya videos/reels bhi?" | Photos focus, video brief | Video transcoding out of scope ([YouTube](../02-questions/t1-07-youtube.md) jaisa) |
| "Feed chronological ya ranked?" | Simple ranking, mostly recent | Feed precompute + light rerank |
| "Scale?" | 500M DAU, 100M uploads/day | Storage aur CDN bahut bade |
| "Upload ke turant baad feed me dikhna chahiye?" | Kuch second ka delay chalega | Async fan-out |
| "Like count exact chahiye?" | Approx chalega, eventually exact | Counter sharding / batched updates |
| "Search, DMs, explore?" | Out of scope | Mention karke chhod do |

> **Bolo:** "Main is system ko teen hisson me todunga: media pipeline (upload, process, CDN), social graph + feed, aur engagement (likes, comments, stories). Read heavy hai, isliye feed aur media dono aggressively cache honge."

## Step 2: Requirements

**Functional**
1. Users photo + caption post kar sakein, aur story daal sakein jo 24 ghante baad apne aap gayab ho
2. Users dusre users ko follow/unfollow kar sakein
3. Users home feed me followed users ki recent posts dekh sakein
4. Users like aur comment kar sakein, aur counts dekh sakein

**Out of scope:** video/reels, DMs, search, explore, ads.

**Non-functional (priority order)**
1. **Latency:** feed p99 < 300ms (metadata), images CDN se < 100ms first byte
2. **Availability:** 99.99% feed aur image reads ke liye
3. **Durability:** upload hui photo kabhi lost na ho
4. **Consistency:** eventual. Nayi post followers ki feed me ~5–10 sec me, apni post turant (read-your-own-writes)
5. **Scale:** 500M DAU, 100M uploads/day, ~100:1 read vs write, celebrities ke followers crores me

**CAP choice:** feed, likes, counts ke liye AP: stale feed ya "1.2M likes" thoda purana chalega, feed down nahi. Media write durability-first (S3).

## Step 3: Estimation (sirf jo design badle)

- 100M uploads/day ≈ **1,200 uploads/sec**. Photo ~2 MB original + 3 resized versions ~500 KB → **~250 TB/day**. Isliye S3 + lifecycle tiers, DB me nahi.
- Feed reads: 500M DAU × 10 opens ≈ 5B/day ≈ **60K QPS**, peak ~150K. Precomputed feed + cache chahiye.
- Image reads: har feed open pe ~20 images → **~1M+ image req/sec**. Sirf CDN sambhal sakta hai.
- Fan-out: avg 200 followers × 1,200 posts/sec ≈ **240K feed writes/sec**. Par celebrity (25–50 cr followers) ka ek post = crores writes. Isliye hybrid fan-out.
- Likes: 500M DAU × ~10 likes ≈ 5B/day ≈ **~60K writes/sec**. Post metadata ~1 KB × 100M/day ≈ 100 GB/day (~36 TB/yr). Isliye Cassandra.

> **Bolo:** "Media bytes kabhi mere app servers se nahi guzrenge. Client seedha S3 pe upload karega aur CDN se padhega. App servers sirf metadata handle karenge."

## Step 4: Core entities

- **User**: id, username, profile_pic_url, follower_count, is_celebrity
- **Post**: id, user_id, caption, media_keys, status (`UPLOADING`, `PROCESSING`, `LIVE`), created_at
- **Follow**: follower_id, followee_id, created_at
- **Like**: post_id, user_id, created_at
- **Comment**: id, post_id, user_id, text, created_at
- **Story**: id, user_id, media_key, created_at, expires_at
- **FeedItem**: user_id → list of post_ids (precomputed)

## Step 5: APIs

```http
POST /posts/upload-url  {contentType, size}          → {postId, uploadUrl (pre-signed S3, 15 min)}
PUT  <uploadUrl>        (client → S3 direct, bytes)  → 200
POST /posts/{postId}/publish  {caption}              → {status: PROCESSING}
GET  /feed?cursor=abc&limit=20                       → {posts: [...], nextCursor}
POST /users/{id}/follow                              → 200
POST /posts/{postId}/like                            → 200 (idempotent)
POST /posts/{postId}/comments  {text}                → {commentId}
POST /stories/upload-url, GET /stories/feed          → stories tray
```

> **Bolo:** "Upload do step me hai: pehle pre-signed URL lo, phir client seedha S3 pe PUT kare. Feed cursor-based paginated hai, offset nahi, kyunki nayi posts aati rehti hain."

## Step 6: High-level design

**Simple v1 pehle:** ek app service + Postgres (users, posts, follows, likes) + S3 + CDN. Feed = followees ki posts pe `ORDER BY created_at LIMIT 20` query. Chhote scale pe FR1–FR4 ho jaate hain. Numbers isse todte hain: 150K peak feed QPS + celebrities → precomputed Redis feeds + hybrid fan-out. 1,200 uploads/sec ka resize → async workers. ~60K likes/sec + 36 TB/yr metadata → Cassandra. ~1M image req/sec → CDN. Services alag kyunki load alag hai (feed 150K, likes 60K, uploads 1.2K per sec).

```mermaid
flowchart LR
  C["Mobile app"] --> G["API Gateway"]
  C -- "PUT image" --> S3[("S3 originals + resized")]
  C -- "GET image" --> CDN["CDN"]
  CDN --> S3
  G --> PS["Post Service"]
  G --> FS["Feed Service"]
  G --> GS["Graph Service"]
  G --> EN["Engagement Service (likes, comments)"]
  PS --> PDB[("Cassandra posts, likes, comments")]
  EN --> PDB
  S3 -- "upload event" --> K[["Kafka post-events"]]
  PS -- "post.live" --> K
  K --> IP["Image Processor (thumbnails)"]
  IP --> S3
  K --> FO["Fan-out workers"]
  FO --> FC[("Redis feeds + counters")]
  FS --> FC
  EN --> FC
  GS --> GDB[("Sharded MySQL follows")]
```

**Har component kyun:**
- **Pre-signed URL + S3 (250 TB/day, durability):** bytes app servers bypass karte hain. Proxy karte to 250 TB/day unke bandwidth se.
- **CDN (~1M+ image req/sec):** image ek baar likhi, karodon baar padhi. Seedha S3 se = zyada latency aur egress cost.
- **Image Processor (1,200 uploads/sec):** 3 sizes, WebP/AVIF, EXIF strip, async, upload ko block nahi karta.
- **Kafka post-events:** ~1.2K events/sec, throughput reason nahi. Reason: 2+ independent consumers (image processor, fan-out, aage notifications), replay (Redis feeds lost hon to fan-out dobara), aur author_id key pe ordering (`post.live` phir `post.deleted`). Simpler option: SNS → SQS per consumer, par replay nahi.
- **Post/Engagement + Cassandra (~60K like writes/sec, 36 TB/yr):** simple access patterns (user ki posts, post ke likes), linear scale. Sirf posts ke liye sharded Postgres bhi chalta, likes ka volume decide karta hai.
- **Graph Service + sharded MySQL:** follow writes kam, sirf do-direction lookups. Multi-hop query nahi, isliye graph DB ki zarurat nahi.
- **Fan-out workers + Redis feeds (150K peak reads, p99 300ms):** har active user ki precomputed post_id list (~500M × 500 × 8 B ≈ 2 TB). Pull on read (200 followees ka merge har open pe) itne QPS pe slow.
- **Feed Service:** precomputed feed + celebrities ki posts merge, hydrate, rank.

**Mapping:** FR1 → Post Service, S3, Kafka, Image Processor (stories: TTL). FR2 → Graph Service + MySQL. FR3 → Fan-out, Redis, Feed Service, CDN. FR4 → Engagement Service, Cassandra, Redis counters.

## Step 7: Main flow: photo upload se feed tak

```mermaid
sequenceDiagram
  participant U as User app
  participant P as Post Service
  participant S3 as S3
  participant K as Kafka
  participant IP as Image Processor
  participant FO as Fan-out
  participant R as Redis feeds
  U->>P: POST upload-url
  P-->>U: postId, pre-signed URL
  U->>S3: PUT original photo
  S3->>K: upload event
  K->>IP: resize to 3 sizes, WebP
  IP->>S3: put thumbnails
  IP->>P: media ready
  U->>P: publish postId with caption
  P->>K: post.live event, once media ready and published
  K->>FO: fan-out postId
  FO->>R: LPUSH feed of each follower, LTRIM 500
```

**Feed read:** Feed Service `feed:{userId}` Redis se 20 post_ids leta hai, followed celebrities ki recent posts alag se laata hai, merge + rank karta hai, aur post metadata (cache se) + CDN image URLs ke saath return karta hai.

## Step 8: Data model & DB choice

```text
posts (Cassandra, partition = user_id, clustering = post_id DESC):
  user_id, post_id (Snowflake, time-sortable), caption, media_keys, status, created_at

follows (sharded MySQL, shard key = user_id):
  followers_by_user(user_id, follower_id)   -- fan-out ke liye
  following_by_user(user_id, followee_id)   -- feed read pe celebrities ke liye

likes (Cassandra, partition = post_id):  post_id, user_id        -- "maine like kiya?" check
post_counters (Redis + Cassandra counter): post_id, like_count, comment_count
comments (Cassandra, partition = post_id, clustering = created_at)
stories (Cassandra with TTL 86400 / Redis sorted set by time)
feed cache (Redis list): feed:{userId} → [post_id, ...] max 500
```

- **Cassandra** for posts/likes/comments: huge write volume, simple access patterns (user ki posts, post ke likes), linear scale.
- **Post IDs Snowflake se:** time-sortable, isliye feed merge me sort easy.
- **Graph:** dono direction ki tables, kyunki fan-out ko followers chahiye aur feed read ko following.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 Upload path aur image processing
**NFR:** durability + fast upload response.
1. Client `upload-url` maangta hai. Server check karta hai (size < 20 MB, type image), post row `UPLOADING` me banata hai, aur 15 min ka **pre-signed PUT URL** deta hai.
2. Client seedha S3 pe upload karta hai (bade files ke liye multipart, resumable).
3. S3 event → Kafka → **Image Processor** (autoscaling workers): 3 sizes, WebP, EXIF/GPS strip (privacy), content moderation (nudity/violence ML).
4. Media ready + publish dono ho gaye → post `LIVE`, `post.live` event, fir fan-out. Processing fail → retry, 3 baar ke baad DLQ + user ko error.

> **Bolo:** "Isse app servers ka bandwidth bachta hai aur upload S3 ki scale pe chalta hai. Processing async hai, toh user ko upload ke turant baad 'posted' dikh jaata hai."

**Trade-off:** followers ko post processing ke kuch second baad dikhti hai.

### 9.2 Feed generation: hybrid fan-out
**NFR:** feed p99 < 300ms at 150K peak QPS.
Detail ke liye [News Feed](../02-questions/t1-03-news-feed.md) dekho. Short me:
- **Normal users (< ~10K followers): fan-out on write.** Post aate hi har follower ki Redis feed list me post_id push. Read super fast.
- **Celebrities (Virat Kohli, 25 cr followers): fan-out on read.** Unki posts kisi ki feed me push nahi hoti. Feed read pe user ke followed celebrities (usually kam) ki latest posts fetch karke merge.
- **Inactive users** (30 din se nahi aaye) ko fan-out skip. Wapas aayein to feed on-the-fly bana do.
- Feed list sirf post_ids rakhti hai (8 bytes), poora post nahi. Hydration alag cache se.

**Trade-off:** ~2 TB Redis aur do code paths, aur celebrity merge read latency thodi badhata hai.

### 9.3 Likes aur comments counters
**NFR:** hot posts pe bhi availability + ~60K like writes/sec.
- Virat ki post pe 1 lakh likes/min. Ek row ka `UPDATE count = count + 1` hot row ban jaata hai.
- **Like record:** `likes(post_id, user_id)` me insert, idempotent (same user dobara like = no-op).
- **Count:** Redis `INCR post:123:likes` (fast), aur ek background job har few seconds Redis se Cassandra me flush. Bahut hot posts ke liye **sharded counter** (10 keys me baant ke, read pe sum).
- UI me "1.2M likes" dikhana hai, isliye exact real-time count zaroori nahi.
- Comments: post_id partition, time-ordered, cursor pagination.

**Trade-off:** count kuch second stale, aur Redis crash pe last flush ke baad ke increments AOF pe depend.

### 9.4 Stories with TTL
**NFR:** FR1 ka 24 hr expiry bina cleanup jobs ke.
- Story upload same pre-signed path se. Metadata Cassandra me **TTL 24 hr** (row apne aap delete), ya Redis sorted set `stories:{userId}` score = timestamp, aur `ZREMRANGEBYSCORE` se purani hatao.
- **Stories tray:** user jinhe follow karta hai unme se kis-kis ki active story hai. Fan-out on write se `tray:{userId}` me user_id push, TTL ke saath. Celebrities ke liye read time pe check.
- Media S3 lifecycle rule se 24 hr baad delete/archive (archive feature ke liye user ka "highlights" alag rakho).

**Trade-off:** S3 lifecycle din me ek baar chalta hai, isliye media thodi der zyada reh sakta hai. Read path `expires_at` se filter kare.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Pre-signed URL, client → S3 direct** | App servers pe bandwidth zero, S3 ki scale | **App server se upload proxy:** 250 TB/day app servers se. Sacrifice: upload validation baad me (size/type check processor me) |
| **Async image processing via Kafka** | Upload fast, workers alag scale. Kafka: 2+ consumers + replay + per-author order | **Upload request me resize:** spike pe servers down. **SQS:** replay nahi. Sacrifice: ~1.2K events/sec ke liye Kafka operate karna |
| **CDN for images** | 1M+ req/sec edge se, low latency | **Seedha S3 se serve:** latency aur egress cost zyada. Sacrifice: delete/privacy change pe CDN purge |
| **Hybrid fan-out + Redis feed lists** | Normal users ke liye fast read, celebrities ke liye write storm nahi | **Pure push:** ek celebrity post = 25 cr writes. **Pure pull:** har open pe 200+ users ka merge. Sacrifice: ~2 TB RAM, do code paths |
| **Cassandra for posts/likes/comments** | ~60K like writes/sec, 36 TB/yr, partition by user/post | **Sharded Postgres:** posts ke liye chalta, par likes volume pe manual sharding. Sacrifice: joins/transactions nahi |
| **Sharded MySQL for follows** | Do-direction key lookups, low write rate | **Graph DB (Neo4j):** multi-hop query chahiye hi nahi. Sacrifice: "mutual friends" jaisi queries mehngi |
| **Redis counters + periodic flush** | Hot post pe bhi fast, DB pe load kam | **DB row `count+1` har like pe:** hot row contention. Sacrifice: count kuch second stale |
| **TTL for stories** | Auto expiry, cleanup job nahi | **Cron se delete:** late chale to stories 24 hr ke baad bhi dikhein. Sacrifice: TTL delete lazy, read pe filter |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Upload beech me toota | Adhuri file | Multipart resumable upload. `UPLOADING` posts jo 1 hr me publish nahi hue, cleanup job hata de |
| Image Processor backlog | Posts `PROCESSING` me atke | Autoscale workers on Kafka lag. Tab tak original ka low-res preview |
| Redis feed cache lost | Feeds khaali | Fallback pull model se feed rebuild (following se fetch + merge), phir cache warm |
| CDN miss storm (viral post) | S3 pe load | CDN origin shield, popular images pre-warm |
| Counter flush fail | Count DB me purana | Redis AOF + replica, flush idempotent (absolute value set karo, delta nahi) |
| Follows shard hot | Celebrity ke followers list slow | Follower list paginate, celebrity ke liye fan-out hota hi nahi |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **ML-ranked feed:** engagement prediction model (likes, dwell time) se candidates rerank. Precomputed candidates + online ranking.
- **Adaptive image delivery:** device/network ke hisaab se size/format, blur placeholder ke saath.
- **Storage tiering:** 1 saal purani photos S3 Infrequent Access / Glacier me, cost 50%+ kam.
- **Multi-region:** media aur feed caches har region me, writes home region me, async replication.

## Step 13: Interviewer ke likely follow-up sawal

- "Celebrity ki post sabki feed me kaise?" → Fan-out on read for celebrities, merge at read time (Step 9.2)
- "Unfollow kiya to feed se posts hatengi?" → Read time pe filter (following set check), background me cleanup
- "Feed pagination kaise?" → Cursor = last post_id (Snowflake time-sortable)
- **Senior signal:** khud bolo ki viral celebrity post teen jagah hot banti hai: ek Cassandra partition (`post_id` ke likes/comments), ek Redis counter key, aur CDN miss storm. Isliye sharded counters, comments ko `(post_id, bucket)` me partition, aur origin shield. Saath me Redis feed cluster loss pe rebuild storm ko rate-limit karo.

## 2-minute recap (interview se pehle ye padho)

> Instagram read-heavy aur media-heavy hai. Upload: client pre-signed URL leta hai aur seedha S3 pe PUT karta hai, app servers bytes nahi chhoote. S3 event Kafka me, Image Processor async thumbnails/WebP banata hai, phir post LIVE aur `post.live` se fan-out. Kafka ka reason ~1.2K events/sec nahi, balki 2+ consumers + replay hai. Images CDN se serve. Posts, likes, comments Cassandra me (partition by user/post), IDs Snowflake se. Follow graph sharded MySQL me dono direction me stored. Feed hybrid fan-out: normal users ke posts fan-out on write se Redis feed lists me, celebrities ke posts read time pe merge. Like counts Redis INCR + periodic flush, hot posts pe sharded counter. Stories TTL 24 hr ke saath Cassandra/Redis me aur S3 lifecycle se media delete.

## Checklist

- [ ] Pre-signed URL upload flow step-by-step bata sakta hoon
- [ ] Async image processing pipeline (S3 event → Kafka → workers) samjha sakta hoon
- [ ] Storage aur CDN ke numbers estimate kar sakta hoon
- [ ] Hybrid fan-out aur celebrity problem explain kar sakta hoon
- [ ] Hot like counter ka solution (Redis + flush + sharded counter) bata sakta hoon
- [ ] Stories ka TTL design bata sakta hoon
- [ ] HLD diagram 5 min me bana sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
