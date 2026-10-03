---
title: Design Flash Sale (Big Billion Day / Lightning Deal)
order: 15
tier: 2
time: 22
patterns: [Contention, Atomic counters, Virtual queue, Rate limiting, CDN]
topics: [09-locks-and-contention, 05-caching, 07-message-queues-kafka, 11-rate-limiting, 12-blob-storage-cdn, 10-idempotency-retries, 16-distributed-transactions]
askedAt: [Flipkart, Amazon, Meesho, Myntra, Alibaba, Walmart]
---

# Design Flash Sale (Big Billion Day / Lightning Deal)

**In one line:** at 12 o'clock, 1,000 iPhones go on sale at ₹49,999, and 1 million people press "Buy" at the same time. The system must **not sell even one extra unit (no oversell)**, must not crash, and must stop bots.

**What the interviewer checks in this question:** extreme contention on a single row/key, atomic inventory decrement, shaping the load (waiting room, queue), returning stock on payment timeout, and bot protection.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Impact on design |
|---|---|---|
| "How much stock and how many people?" | 1,000 units, 1 million users in one minute | 1000x more demand than supply. We must reject most requests early |
| "Is oversell not allowed at all?" | Yes, zero oversell | Atomic decrement + DB constraint |
| "Per user limit?" | 1 unit per user | User-level dedup key |
| "How long does the user have to pay?" | 10 min | Reservation TTL, release stock on timeout |
| "Is undersell OK? Can a few units be left at the end?" | A little is OK, they will be released later | We can keep fairness a bit loose |
| "Normal catalog, search, recommendations?" | Out of scope | We only design the sale path |

> **Say:** "The problem here is not throughput, it is contention. 1 million people for 1,000 units. I will design it so that 99.9% of requests never reach the DB, and only the 1,000 winners go into the order path."

## Step 2: Requirements

**Functional**
1. Users should be able to see the product page with a countdown before the sale
2. Users should be able to press "Buy" at sale start and reserve a unit (max 1 per user)
3. Users should be able to pay within 10 min to confirm the order, otherwise the unit goes back to the pool
4. Users should be able to see "Sold out" right away once stock is gone

**Out of scope:** catalog, search, recommendations, multi-item cart, returns.

**Non-functional (in priority order)**
1. **Correctness:** zero oversell, 1 unit per user (most important)
2. **Availability:** site 99.99% up; the sale path may be throttled but must not crash
3. **Latency:** answer in p99 < 2 sec (got it / waiting / sold out)
4. **Fairness:** roughly FIFO, no advantage for bots
5. **Scale:** 1M users in one minute, ~500K page QPS, ~200K buy QPS, only 1,000 units

**CAP choice:** consistency for inventory: if the stock Redis primary is down, pause the sale rather than risk oversell. Availability for the product page and queue position: a stale countdown or position is fine.

## Step 3: Estimation (only what changes the design)

- 1 million users × many refreshes → **~500K QPS** on the page at sale start. Only a CDN can handle this.
- "Buy" clicks: ~200K QPS in the first 10 sec. One Redis key does ~100K ops/sec. So filter first with a waiting room / rate limit.
- Actual reservations/orders: only **1,000**. That is nothing for Postgres, so winners get a **direct sync insert**; no queue is needed in between.

> **Say:** "The funnel will look like this: 500K QPS at the CDN, 200K buy clicks at the gateway, a few thousand reach Redis through the waiting room, and only 1,000 reach the DB. Each layer cuts load by 10–100x."

## Step 4: Core entities

- **Sale**: id, product_id, start_at, end_at, total_stock, per_user_limit
- **Inventory** (Redis): `stock:{saleId}` counter
- **Reservation**: id, sale_id, user_id, status (`RESERVED`, `PAID`, `EXPIRED`), expires_at
- **Order**: id, user_id, sale_id, reservation_id, payment_id, status

## Step 5: APIs

```http
GET  /sales/{saleId}                     → product + countdown (CDN cached)
POST /sales/{saleId}/enter               → {queueToken, position}
GET  /sales/{saleId}/queue/{token}       → {position} or {admitted, buyToken}
POST /sales/{saleId}/reserve {buyToken}  → {reservationId, expiresAt} or SOLD_OUT
POST /orders {reservationId, paymentToken}
     Header: Idempotency-Key: <uuid>     → {orderId, status}
```

## Step 6: High-level design

**Start with a simple v1:** app server + Postgres: `UPDATE sales SET sold = sold + 1 WHERE id=? AND sold < total_stock` + a reservation insert. Enough for a normal sale. The numbers break it: 500K page QPS (→ CDN), 200K buy QPS on one row (→ Redis Lua), fairness + a ~100K ops/sec single-key limit (→ waiting room). The DB write for the 1,000 winners stays the same as v1.

```mermaid
flowchart LR
  U["Users"] --> CDN["CDN product page"]
  U --> G["API Gateway + Bot filter"]
  G --> WR["Waiting Room Service"]
  WR --> RQ[("Redis queue ZSET")]
  G --> RS["Reservation Service"]
  RS --> RI[("Redis stock + Lua")]
  RS --> DB[("Postgres sales, reservations, orders")]
  G --> OS["Order Service"]
  OS --> DB
  OS --> PG["Payment Gateway"]
  EX["Expiry worker"] --> DB
  EX --> RI
```

**Why each component:** (FR1 → CDN, FR2 → Waiting Room + Reservation + Redis Lua, FR3 → Order Service + Payment + Expiry worker, FR4 → sold-out flag at gateway/CDN)
- **CDN:** 500K page QPS must not reach the origin; app servers cannot autoscale 100x in 30 sec.
- **API Gateway + Bot filter:** per-user / per-IP rate limit, CAPTCHA, device fingerprint (fairness).
- **Waiting Room (Redis ZSET):** 200K buy QPS > one Redis key's ~100K ops/sec, plus FIFO fairness. A plain rate limit is random, not fair.
- **Reservation Service + Redis Lua:** atomic "stock check + decrement + user dedup"; 200K QPS on a DB row would be lock contention.
- **Postgres (sync insert):** the winner's reservation goes straight to the DB. ~1,000 rows in total, so **no Kafka**: the spike never reaches the DB, a queue would only add lag and ops.
- **Expiry worker (cron, every 30 sec):** expires unpaid reservations, returns stock. A DB scan is enough for 1,000 rows.

## Step 7: Main flow: from buy click to order

```mermaid
sequenceDiagram
  participant U as User
  participant W as Waiting Room
  participant R as Reservation Svc
  participant RD as Redis
  participant DB as Postgres
  participant O as Order Svc
  U->>W: POST /enter
  W-->>U: queueToken, position 4512
  W-->>U: admitted, buyToken
  U->>R: POST /reserve buyToken
  R->>RD: EVAL lua - check user, DECR stock
  RD-->>R: OK, left 312
  R->>DB: INSERT reservation UNIQUE sale_id user_id
  R-->>U: reserved, pay in 10 min
  U->>O: POST /orders with paymentToken
  O->>DB: UPDATE reservation PAID WHERE status RESERVED
  O-->>U: order CONFIRMED
```

## Step 8: Data model & DB choice

```sql
sales(id PK, product_id, start_at, end_at, total_stock, sold INT,
      CHECK (sold <= total_stock))
reservations(id PK, sale_id, user_id, status, expires_at,
             UNIQUE(sale_id, user_id))
orders(id PK, reservation_id UNIQUE, payment_id UNIQUE, status)
```

- **Redis** = fast gatekeeper. **Postgres** = final truth. Reservation insert + `sold = sold + 1` in one transaction; if it fails, Redis `INCR` returns the unit.
- `CHECK (sold <= total_stock)` and `UNIQUE(sale_id, user_id)` stop oversell and double purchase at the DB level, even if something goes wrong in Redis.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 How do you decrement inventory atomically?
**NFR:** zero oversell, even at 200K buy QPS.
A DB row `UPDATE ... SET stock = stock - 1` at 200K QPS = row lock contention, and the DB dies. So use a **Lua script** in Redis (single-threaded, atomic):
```lua
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return -2 end  -- already bought
local s = tonumber(redis.call('GET', KEYS[1]))
if s <= 0 then return -1 end                                           -- sold out
redis.call('DECR', KEYS[1]); redis.call('SADD', KEYS[2], ARGV[1])
return s - 1
```
- Plain `DECR` also works (if it goes negative, `INCR` it back), but Lua also does the user dedup in the same step.
- As soon as stock hits 0, set a flag `soldout:{saleId}`. The gateway/CDN reads that flag and shows "Sold out" right away, without even reaching Redis.
- If one key is very hot, **split the stock**: divide 1,000 units into 10 keys of 100 each, pick a key by user hash. If one key runs out, try another.
- **Trade-off:** Redis is fast but can lose the last writes on failover; so the DB constraint is the safety net, and we accept a little undersell.

### 9.2 Virtual waiting room and queue admission
**NFR:** fairness + the site must not crash (fixed load).
- On `/enter`, give the user a token, `ZADD queue:{saleId} <timestamp> <userId>`.
- An admission worker gives a `buyToken` (signed, valid for 2 min) to N users (say 2,000) every second.
- The client polls its position (or uses SSE). Once stock hits 0, everyone in the queue gets "Sold out" right away.
- Benefit: load on the Reservation service comes at a fixed rate, not as a spike.
- **Trade-off:** users wait a few seconds and we run one more service; in return, predictable load and fairness.

### 9.3 Payment timeout and stock release
**NFR:** correctness (a paid unit is never sold twice) + less undersell.
- Reservation TTL is 10 min. The expiry worker runs every 30 sec: `status=RESERVED AND expires_at < now()` → `EXPIRED`, then `INCR stock` in Redis and remove the user from the set.
- Released units go to users waiting in the queue.
- Race: payment and expiry at the same time? `UPDATE reservations SET status='PAID' WHERE id=? AND status='RESERVED'`. Whoever wins first wins. If expiry won and the payment came late, **auto refund**.
- **Trade-off:** a unit stays blocked for the 10 min TTL; a shorter TTL = less undersell but genuine slow payers fail.

### 9.4 Bot protection
**NFR:** fairness, real users get the product.
- Login + verified phone required before the sale. Block new accounts or give them low priority.
- Per-user, per-IP, per-device rate limits at the gateway. CAPTCHA on `/enter`.
- `buyToken` is signed and bound to the user, so it cannot be shared or replayed.
- Multiple accounts on the same address / payment card → post-sale fraud check, cancel the order.
- **Trade-off:** every check adds friction and stops some genuine users too.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Redis Lua** for stock decrement | Atomic, ~100K ops/sec, user dedup in the same step | **DB row update:** lakhs of lock waits. **Optimistic locking:** retry storm. Sacrifice: some writes can be lost on failover |
| **DB CHECK + UNIQUE constraint** | Safety net, no oversell even if Redis fails | **Only Redis:** oversell on failover. Sacrifice: sometimes Redis says "yes" and the DB says "no" = an error for the user |
| **Virtual waiting room** | Fixed-rate load, fair FIFO | **Only rate limit + autoscaling:** unfair, single-key bottleneck. Sacrifice: an extra service, users wait |
| **Sync DB insert** for winners | ~1,000 inserts, the DB is the truth immediately | **Kafka/SQS:** the spike never reaches the DB, so a queue only adds lag + ops. Sacrifice: DB down = sale paused |
| **CDN** for product page | 500K QPS at the edge | **App servers:** origin goes down. Sacrifice: countdown/badge slightly stale |
| **TTL reservation + cron expiry** | Unpaid units come back | **Decrement after payment:** 1,000+ people pay, refunds. **Delay queue:** overkill. Sacrifice: ~30 sec release delay |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Redis primary crash | Some decrements may be lost | The DB constraint stops oversell. AOF `everysec` + replica. Dedicated Redis for the sale |
| Postgres slow/down | Lua won but the insert failed | Redis `INCR` returns the unit, user gets "retry"; if the DB is down, pause the sale (correctness > availability) |
| Payment gateway slow | Reservations are expiring | Increase the TTL a bit for the sale, get dedicated capacity from the gateway |
| Hot key | One Redis shard at 100% CPU | Split stock across keys, sold-out flag at the edge |
| Bots | Real users get nothing | CAPTCHA, signed tokens, rate limit, fraud check |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Pre-registration / lottery:** register before the sale, pick random winners. Contention disappears
- **Load test + game day:** rehearse with 2x the expected traffic before the sale
- **Graceful degradation:** turn off non-critical features like recommendations and reviews during the sale
- **Multi-region:** product page from the CDN in every region, but inventory in one primary Redis cluster

## Step 13: Likely follow-up questions

- "What if Redis and the DB have different counts?" → The DB is the truth. After the sale, a reconciliation job syncs Redis from the DB
- "The user pressed buy from two tabs?" → `SISMEMBER` in Lua + DB `UNIQUE(sale_id, user_id)`
- "Payment succeeded but the reservation had already expired?" → the conditional update fails, auto refund
- "What if 10 million users show up?" → shard the waiting room's Redis ZSET, or use a pre-registration lottery
- "How will you prove fairness?" → FIFO by queue timestamp, and admission logs for audit
- "Why no Kafka?" → only ~1,000 writes reach the DB; the funnel already removed the spike
- **Senior signal:** raise it yourself: the real single point is the stock Redis key. Plan its failover (last-writes loss) and hot-shard CPU up front: dedicated Redis, stock split, sold-out flag at the edge, DB constraint as backstop.

## 2-minute recap (read this before the interview)

> In a flash sale the problem is contention, not throughput. Build a funnel: the CDN serves the product page, the gateway filters bots and applies rate limits, the waiting room (Redis ZSET) admits users at a fixed rate, and the Reservation service does user dedup + stock decrement atomically with a Redis Lua script. As soon as it is sold out, a flag is set and the rest of the requests are rejected at the edge. The ~1,000 winners' reservations go straight (sync) to Postgres, since a queue is pointless for so few writes. Postgres has `CHECK(sold <= total)` and `UNIQUE(sale_id, user_id)`, so there is no oversell even if Redis fails. Reservations have a 10 min TTL, an expiry worker returns the stock, and late payments get an auto refund. For bots: CAPTCHA, signed buy tokens, per-device limits.

## Checklist

- [ ] I can tell the numbers for the funnel (CDN → gateway → waiting room → Redis → DB)
- [ ] I can write the Redis Lua script for atomic stock decrement
- [ ] I can explain how a DB constraint stops oversell
- [ ] I can explain the waiting room and the admission rate
- [ ] I can handle the race between payment timeout and stock release
- [ ] I can tell 3 ways to protect against bots
- [ ] I can tell 3 trade-offs from the decision table without looking
