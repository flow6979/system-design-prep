---
title: Design BookMyShow / Ticketmaster
order: 5
tier: 1
time: 25
patterns: [Contention, Locks, Idempotency, Search, Virtual queue]
topics: [09-locks-and-contention, 10-idempotency-retries, 05-caching, 14-search-indexing, 07-message-queues-kafka]
askedAt: [Amazon, Meta, Uber, Flipkart, Microsoft]
---

# Design BookMyShow / Ticketmaster

**In one line:** users search for a movie/event, pick seats, and pay. The core challenge is that **one seat must never be sold to two people**, and the system must not crash during big launches.

**What the interviewer checks in this question:** handling contention (locks), the consistency vs availability trade-off, and peak traffic (the first-day-first-show of Avengers).

---

## Step 1: Clarify with the interviewer (3–5 min)

Ask these questions before you start the design:

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Are search, seat selection and booking in scope? Can I assume payment is a third-party gateway?" | Yes | No need to design payment internals |
| "How long is a seat hold? 10 min?" | Yes, 10 min | Redis TTL = 10 min |
| "Double booking is never allowed, so consistency > availability on the booking path?" | Yes | Strong consistency for booking (SQL + locks) |
| "Is slightly stale data OK in search and browse?" | Yes | Search from a read replica + cache, eventual consistency |
| "What is the scale? Peak traffic?" | ~10M DAU, 1 lakh+ people at once on a popular show | We need a virtual waiting queue |
| "Are recommendations, reviews, food ordering in scope?" | No | Say they are out of scope |

> **Say:** "So I will design 3 core flows: search events, view seat map, and book seats. I will keep strong consistency for booking, and availability + low latency for search."

## Step 2: Requirements

**Functional**
1. Users should be able to search shows by city/movie/date
2. Users should be able to see the seat map of a show (which seats are free)
3. Users should be able to hold seats for 10 min, confirm the booking with payment, and get a ticket notification

**Out of scope:** payment internals (third-party gateway), recommendations, reviews, food ordering, dynamic pricing.

**Non-functional (in priority order)**
1. **No double booking:** one seat, only one booking (strong consistency)
2. **Availability:** search and browse 99.99%
3. **Latency:** search p99 < 500 ms, hold p99 < 200 ms
4. **Scale:** 10M DAU, ~100:1 read/write, 1 lakh users/min on one show at launch

**CAP choice:** the booking path is CP: if the Postgres primary is down, showing an error is better than a double booking. Search and seat map are AP: slightly stale is fine, the final check happens at booking.

## Step 3: Estimation (only what changes the design)

- 10M DAU, each user does ~10 searches/browses → **100M reads/day ≈ 1,200 QPS** avg, peak 10x ≈ 12K QPS. So a cache is needed.
- Bookings: ~1M/day ≈ **12 bookings/sec** avg. The write load is small, one SQL DB can handle it.
- Popular launch: 1 lakh users on the same show in one minute. **This is the real problem**, not the average.
- The catalog is small (a few thousand movies, ~1 lakh shows/day), and filters are structured. A Postgres index + cache is enough.

> **Say:** "The average write load is small, so throughput is not the problem. The problem is contention on the same seat and the sudden spike."

## Step 4: Core entities

- **Event/Movie**: id, name, duration, language
- **Venue**: id, city, screens
- **Show**: id, event_id, venue_id, start_time
- **Seat**: show_id, seat_id, price_tier, status
- **Booking**: id, user_id, show_id, seat_ids, status (`PENDING`, `CONFIRMED`, `CANCELLED`), payment_id, idempotency_key

## Step 5: APIs

```http
GET  /shows?city=pune&movie=123&date=2026-10-10     → list of shows
GET  /shows/{showId}/seats                          → seat map + status
POST /bookings/hold   {showId, seatIds}             → {holdId, expiresAt}
POST /bookings/confirm {holdId, paymentToken}       → {bookingId, status}
     Header: Idempotency-Key: <uuid>
```

> **Say:** "Hold and confirm are separate APIs, because blocking a seat and paying are two separate steps, and there can be a 10 min gap between them."

## Step 6: High-level design

**Start with a simple v1:** one service + one Postgres: an indexed show query, a seat status column, booking in one transaction. At 12 bookings/sec this meets all three FRs. The numbers break it: 12K peak reads/sec → Redis cache + read replica; 1 lakh users on one show → Redis holds + waiting room, so there is no DB lock contention on the same rows; sending tickets must not slow booking → outbox + worker.

```mermaid
flowchart LR
  C["Client app"] --> G["API Gateway + Rate limiter"]
  G --> S["Show Service: search + seat map"]
  G --> B["Booking Service"]
  S --> RC[("Redis: cache, holds, waiting room")]
  S --> RR[("Postgres read replica")]
  B --> RC
  B --> DB[("Postgres primary")]
  DB -- "replication" --> RR
  B --> PG["Payment Gateway"]
  PG -- "webhook" --> B
  DB -- "outbox table" --> W["Notification worker"]
  W --> SMS["SMS / email provider"]
```

**FR mapping:** FR1 + FR2 → Show Service + Redis + read replica. FR3 → Booking Service + Redis holds + Postgres primary + outbox worker.

**Why each component:**
- **API Gateway:** auth, rate limiting, stopping bots
- **Separate Show Service and Booking Service:** the read path has ~100x the traffic and is AP, booking is CP. They scale separately
- **Postgres search (index + `pg_trgm`) + cache, not Elasticsearch:** filters are structured, the catalog is small, and `pg_trgm` handles a typo like "avengr". ES = CDC + one more cluster, with no need for it
- **Redis:** thousands of holds/sec on one show at launch. `SET NX PX` is cheaper than DB row locks and auto-releases with TTL. The waiting room + cache live here too
- **Booking Service:** hold + confirm. All the consistency work happens here
- **Outbox + worker, not Kafka:** only ~12 bookings/sec, one consumer. An outbox row in the booking transaction, and a worker sends SMS/email with retries. It also solves the dual-write problem

## Step 7: Main flow: booking a seat

```mermaid
sequenceDiagram
  participant U as User
  participant B as Booking Service
  participant R as Redis
  participant DB as Postgres
  participant P as Payment Gateway
  U->>B: POST /hold {show 42, A5}
  B->>R: SET hold:42:A5 user1 NX PX 600000
  R-->>B: OK
  B-->>U: holdId, expires in 10 min
  U->>P: pay
  P-->>B: webhook: payment success
  B->>DB: BEGIN, INSERT booking show 42 A5 UNIQUE, INSERT outbox, COMMIT
  DB-->>B: OK
  B->>R: DEL hold:42:A5
  B-->>U: Booking CONFIRMED
```

## Step 8: Data model & DB choice

```sql
bookings(id PK, user_id, show_id, status, payment_id, idempotency_key UNIQUE, created_at)
booking_seats(booking_id, show_id, seat_id, UNIQUE(show_id, seat_id))
```

```sql
outbox(id PK, booking_id, type, payload, status, created_at)   -- written in the same transaction
```

`UNIQUE(show_id, seat_id)` is the most important line. With it, the DB itself stops double booking.

## Step 9: Deep dives (the interviewer will push here)

### 9.1 How will you stop double booking?

**NFR:** no double booking (strong consistency).

Two layers:
1. **Redis hold** (`SET NX PX`): fast, temporary, auto-expires after 10 min.
2. **DB unique constraint:** the final truth. Even if Redis crashes, or a late payment arrives after the hold expired, the DB will not allow two bookings.

> If the payment succeeded but the DB insert failed (someone else took the seat), trigger an **auto refund**. This is a rare edge case, and mentioning it sends a strong signal.

**Trade-off:** state in two places (Redis + DB) and a rare refund path, in exchange for fast holds and guaranteed correctness in the DB.

### 9.2 Avengers launch: 1 lakh people, 1 minute

**NFR:** availability and hold p99 < 200 ms even during the spike.

- **Virtual waiting queue:** give users a token and put them in line in a Redis sorted set. Let ~5,000 users in at a time. Show the rest "you are #2,341 in line".
- Serve the seat map from a **CDN/Redis cache**, so every request does not hit the DB.
- Per-user rate limit + CAPTCHA at the gateway, so bots stay out.

```mermaid
flowchart LR
  U["1 lakh users"] --> WQ["Waiting Room\nRedis sorted set"]
  WQ -- "5000 at a time" --> B["Booking flow"]
  WQ -. "position update via SSE" .-> U
```

**Trade-off:** users have to wait in line, in exchange for no crash and a fair (FIFO) order.

### 9.3 How does the seat map stay live?

**NFR:** seat map availability, slightly stale is fine (AP).

- Simple: poll every 5 sec. It is read-heavy, but cheap with a cache.
- Better: push seat status over **SSE/WebSocket** when someone places a hold. Turn it on only for popular shows.

**Trade-off:** with polling the map is up to 5 sec stale, in exchange for being simple and cheap.

### 9.4 No double charge on payment

**NFR:** exactly-once-like charging, even after retries.

- The client sends an **Idempotency-Key** with every confirm request. The server first checks if this key came before. If yes, it returns the old result.
- The payment webhook can also come twice. Keep `payment_id` unique.

**Trade-off:** idempotency keys must be stored, in exchange for safe retries.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Postgres** for bookings | ACID + unique constraint, ~12 writes/sec | **Cassandra/DynamoDB:** weak multi-row transactions. Sacrifice: single primary, booking pauses a few sec on failover |
| **Redis TTL** for seat hold | Thousands of holds/sec in a spike, atomic `NX`, TTL auto-release | **DB `held_until` column:** lock contention on the same rows in a spike. Sacrifice: Redis down = holds lost (DB constraint stays safe) |
| **No pessimistic lock** | We cannot hold a DB lock for the 10 min payment window | Holding `SELECT FOR UPDATE` that long uses up all connections. Sacrifice: the rare refund case |
| **Postgres + `pg_trgm` + cache** for search | Structured filters, small catalog, one DB | **Elasticsearch:** CDC + one more cluster, sync lag. **Plain LIKE:** does not understand typos. Sacrifice: basic relevance ranking |
| **Outbox + worker** for notifications | ~12/sec, atomic with the booking, retries | **Kafka:** overkill at this volume. **Sync call:** slow SMS = slow booking. Sacrifice: a small worker polling delay |
| **Virtual queue** at peak | Load control, fair FIFO | **Only autoscaling:** not fast enough, DB/locks still the bottleneck. Sacrifice: users wait |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Redis down | Holds are gone | The DB constraint stops double booking. Run Redis with replica + sentinel |
| Payment webhook missed | Money is deducted, booking is PENDING | A reconciliation job asks the gateway for the status every 5 min |
| Booking service crash | In-flight requests fail | Stateless service + multiple instances. Safe retry with the idempotency key |
| Hot show | All load on one show | Waiting room + cache |
| Notification worker down | Ticket SMS is late | Outbox rows stay pending, the worker retries when back. No effect on booking |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- Make the seat map fully live with **WebSocket**
- **Multi-region:** search in every region, booking in one primary region (for consistency)
- **Elasticsearch when needed:** once we need full-text + relevance ranking over events, artists, venues

## Step 13: Likely follow-up questions

- "What is the difference between a Redis lock and a DB lock? Why both?" → Step 9.1
- "What if the user does not pay within 10 min?" → TTL expires, the seat is free, booking is `CANCELLED`
- "Payment succeeded but the seat went to someone else?" → Auto refund
- "What if a group takes 6 seats together?" → Hold all seats atomically in one Lua script. If even one fails, release all
- "What if search results are stale?" → That is acceptable. The final check happens at booking time
- **Senior signal:** raise it yourself: there is a race between the hold TTL and payment: if the gateway is slow, the hold expires, the seat goes to someone else, and a late payment arrives. The DB constraint stops double booking, but you need auto refund + a payment window shorter than the hold TTL.

## 2-minute recap

> BookMyShow is read-heavy, but booking needs strong consistency. Two services: Show Service (search + seat map: read replica + Redis cache, `pg_trgm`; no ES, the catalog is small) and Booking Service. Booking happens in two steps: hold and confirm. Hold uses Redis `SET NX PX 10min`, and confirm runs in a Postgres transaction with `UNIQUE(show_id, seat_id)`. So even if Redis fails, there is no double booking. Idempotency key on payment, and a reconciliation job for webhooks. For peak launches: virtual waiting queue + rate limit + cached seat map. Notifications go async through an outbox + worker (~12/sec, no need for Kafka).

## Checklist

- [ ] I can ask the interviewer the clarifying questions without notes
- [ ] I can explain the 2-step hold + confirm flow
- [ ] I can draw the HLD diagram in 5 min
- [ ] I can explain both layers against double booking (Redis + DB constraint)
- [ ] I can explain the virtual queue for peak traffic
- [ ] I can tell how the idempotency key and payment reconciliation work
- [ ] I can say 3 trade-offs from the decision table without notes
