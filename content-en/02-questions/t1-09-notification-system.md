---
title: Design a Notification System
order: 9
tier: 1
time: 25
patterns: [Message queues, Fan-out, Retries, Idempotency, Rate limiting]
topics: [07-message-queues-kafka, 10-idempotency-retries, 11-rate-limiting, 18-fan-out, 20-reliability-observability, 05-caching]
askedAt: [Amazon, Meta, Google, Swiggy, Flipkart, Paytm]
---

# Design a Notification System

**In one line:** other services (orders, payments, marketing) make one API call, and the system sends the user a push, SMS, email or in-app notification, while respecting the user's preferences and limits. The core challenge is that **no notification is missed, none is sent twice, and slow third-party providers don't slow down the whole system**.

**What the interviewer checks in this question:** an async queue-based design, per-channel isolation, retries + DLQ, idempotency, priority (OTP vs marketing), and handling third-party failures.

---

## Step 1: Clarify with the interviewer (3–5 min)

Ask these questions before you start the design:

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Which channels? Push, SMS, email, in-app?" | All four | A separate queue + worker for each channel |
| "Both transactional (OTP, order update) and marketing?" | Yes | Priority queues, OTP goes first |
| "What is the scale?" | ~100M notifications/day, 10M at once for a campaign | Kafka + horizontal workers |
| "Delivery guarantee? Are duplicates OK?" | At-least-once, but the user must not see duplicates | Idempotency key + dedup |
| "User preferences and opt-out?" | Yes, and quiet hours too | Preference check in the pipeline |
| "Scheduled notifications?" | Yes, "send tomorrow at 9" | Scheduler component |

> **Say:** "I will design this as an async pipeline: the API validates the request and puts it in Kafka, and each channel's workers send to their provider (APNs, FCM, Twilio, SES). Transactional and marketing traffic run at different priorities."

## Step 2: Requirements

**Functional (users should be able to)**
1. Internal services should be able to send a notification to a user or a segment (campaign) through one API, now or scheduled
2. Users should receive it by push (iOS/Android), SMS, email or in-app
3. Users should be able to set preferences (opt-out, channel, quiet hours), and the system respects them + rate limits
4. Callers should be able to see delivery status (sent, delivered, opened)

**Out of scope:** template editor UI, A/B testing, provider internals (treat APNs/Twilio as black boxes).

**Non-functional (in priority order)**
1. **Reliability:** an accepted notification is never lost (at-least-once, durable queue)
2. **Latency for transactional:** OTP p99 < 5 sec end-to-end, even while a campaign runs
3. **No duplicates for the user:** effectively once (the same OTP is not sent twice)
4. **Scale + isolation:** 100M/day, campaign peak ~17K/sec; one provider's outage must not stop other channels

**CAP choice:** availability. Accept the request and keep it in the queue even if a provider or Redis is down. Slightly stale preferences (cache) are fine; dedup is best-effort + provider idempotency.

## Step 3: Estimation (only what changes the design)

- 100M/day ≈ **~1.2K/sec avg**. Campaign: 10M in 10 min ≈ **~17K/sec peak**. So we need a queue as a buffer.
- Provider limits: SMS provider ~1K/sec, APNs/FCM high. **The provider decides the throughput, not us.** Workers must throttle to the provider's rate.
- Status events (sent/delivered/opened) are ~3x notifications → ~300M/day ≈ 3.5K/sec avg, **~50K/sec** during a campaign. Write-heavy data with a TTL → Cassandra.
- Campaign peak: 17K notifications/sec × ~2 channels + 3x status events ≈ **~100K msgs/sec** in total. This number and the need for replay are what pick Kafka.

> **Say:** "The bottleneck is not my servers, it is the third-party providers. So I will put a Kafka buffer in the middle, per-channel workers, and provider-wise rate limiting."

## Step 4: Core entities

- **Notification**: id, user_id, type, channel, priority, template_id, payload, idempotency_key, status, scheduled_at
- **Template**: id, channel, locale, subject, body (`"Hi {{name}}, order {{orderId}} delivered"`)
- **UserPreference**: user_id, channel, category (`OTP`, `ORDER`, `PROMO`), enabled, quiet_hours
- **DeviceToken**: user_id, platform (iOS/Android), token, last_active
- **DeliveryEvent**: notification_id, status (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `OPENED`), provider, timestamp

## Step 5: APIs

```http
POST /notifications
     Header: Idempotency-Key: order-123-delivered
     {userId, type: ORDER_DELIVERED, channels: [push, sms],
      templateId, params: {orderId: 123}, priority: HIGH, sendAt?}
     → 202 {notificationId}
POST /notifications/bulk    {segmentId, templateId, sendAt}   → 202 {campaignId}
GET  /notifications/{id}                                      → status per channel
PUT  /users/{id}/preferences {category, channel, enabled}     → 200
GET  /users/{id}/inbox?cursor=...                             → in-app notifications
```

> **Say:** "The API returns 202 Accepted, because the actual sending is async. The caller does not have to wait for the provider's response."

## Step 6: High-level design

**Start with a simple v1:** API → a `notifications` table (Postgres) → one worker picks pending rows on a cron and calls the provider. This works up to ~1K/sec. But a 17K/sec campaign spike, OTPs that must not wait behind marketing, and an SMS outage that must not stop push → a durable queue, a topic per channel + priority, separate worker pools. Dedup and rate limits on every request → Redis. ~50K status writes/sec → Cassandra.

```mermaid
flowchart LR
  S["Internal services"] --> API["Notification API + pref check"]
  SCH["Scheduler"] --> API
  API --> RC[("Redis prefs, dedup, limits")]
  API --> K[["Kafka topics per channel + priority"]]
  K --> PW["Push workers"]
  K --> SW["SMS workers"]
  K --> EW["Email workers"]
  K --> IW["In-app workers"]
  PW --> PRV["Providers: APNs/FCM, Twilio, SES"]
  SW --> PRV
  EW --> PRV
  IW --> DB[("Cassandra inbox + status")]
  SW --> DLQ[["DLQ topic"]]
  PRV -. "delivery callbacks" .-> TR["Tracking Service"]
  TR --> DB
```

**FR mapping:** FR1 → API + Scheduler + Kafka, FR2 → channel workers + providers, FR3 → pref check + Redis + Postgres prefs, FR4 → Tracking Service + Cassandra.

**Why each component:**
- **Notification API + pref check:** validation, idempotency, opt-out, quiet hours, per-user limit, then put it in Kafka and return 202. No separate "preference service"; an in-process check is enough.
- **Redis:** dedup `SET NX`, rate-limit counters and a prefs cache, sub-ms at 17K/sec. The simpler option, a counter update in Postgres per request, creates hot rows.
- **Kafka (topic per channel + priority):** ~100K msgs/sec at campaign peak, 2 consumer groups on the status stream (Cassandra writer, analytics), and replay from an offset after a buggy template. **Honest note:** at only ~1K/sec with no campaigns, per-channel SQS queues (built-in delay, retry, DLQ) would be the simpler and better choice.
- **Channel workers:** stateless, call the provider SDK, throttled to the provider's rate. Separate pools = outage isolation.
- **DLQ:** messages that fail again and again are kept aside for investigation/replay.
- **Cassandra:** ~50K status writes/sec at peak, per-user time-ordered inbox, 90-day TTL. The simpler option, Postgres, would need sharding at this peak.
- **Tracking Service:** provider webhooks (delivered, bounced) and opens/clicks; the provider callback endpoint scales separately.

## Step 7: Main flow: order delivered notification

```mermaid
sequenceDiagram
  participant O as Order Service
  participant A as Notification API
  participant R as Redis
  participant K as Kafka
  participant W as Push Worker
  participant F as FCM
  participant T as Tracking
  O->>A: POST /notifications key order-123-delivered
  A->>R: SET dedup key NX EX 86400
  R-->>A: OK, first time
  A->>R: check prefs and rate limit
  A->>K: publish to push.high topic
  A-->>O: 202 Accepted
  K->>W: consume message
  W->>W: render template, fetch device tokens
  W->>F: send push
  F-->>W: 200 message id
  W->>T: status SENT
  F-->>T: delivery receipt later
```

## Step 8: Data model & DB choice

```sql
-- Postgres: low write, config type data
templates(id PK, channel, locale, version, subject, body)
user_preferences(user_id, category, channel, enabled, quiet_start, quiet_end,
                 PRIMARY KEY(user_id, category, channel))
device_tokens(user_id, token PK, platform, last_active)
```

```text
Cassandra (write-heavy, time-ordered):
notifications_by_user  PK user_id, CK created_at DESC → in-app inbox
delivery_events        PK notification_id, CK ts      → status history
```

- **Templates, preferences → Postgres + Redis cache:** small data, many reads.
- **Notification log, status, inbox → Cassandra:** 300M+ writes/day, partitioned by user, sorted by time.
- **Dedup keys, rate limit counters → Redis** with TTL.

## Step 9: Deep dives (the interviewer will push here)

### 9.1 Retries, backoff and DLQ
**NFR:** reliability (nothing lost) + one provider's outage does not stop the rest.
- The provider returned 5xx/timeout → **exponential backoff + jitter** (1s, 2s, 4s, 8s...), max 5 tries.
- Use separate **retry topics** for retries (`sms.retry.1m`, `sms.retry.10m`), so the main topic is not blocked. Kafka has no per-message delay, which is why we need these topics (SQS has it built in).
- After 5 tries → **DLQ**. Alert + dashboard, replay after the fix.
- No retry on 4xx (invalid token, invalid number). Mark the token as inactive.
- **Circuit breaker:** if Twilio keeps failing → switch to a fallback provider (Gupshup/MSG91). That is why you keep an adapter interface in front of providers.
- **Trade-off:** retry topics are extra topics and consumers; ordering is not guaranteed across retries.

### 9.2 Idempotency and dedup
**NFR:** no duplicates for the user (effectively once).
- Kafka is at-least-once. If a worker sends and then crashes before the commit → the message comes again.
- **API level:** store the caller's `Idempotency-Key` (e.g. `order-123-delivered`) in Redis with `SET NX EX 24h`. On a duplicate request, return the same notificationId.
- **Worker level:** check `sent:{notificationId}:{channel}` before sending. Set it after sending. A small window still remains, so many providers also accept an idempotency key, pass it to them.
- Exactly-once is impossible with a third party. Target: **effectively once** for the user.
- **Trade-off:** if Redis is down, dedup weakens; for transactional we accept a duplicate risk rather than a missed notification.

### 9.3 Priority and rate limits
**NFR:** OTP p99 < 5 sec, even during a campaign.
```mermaid
flowchart LR
  A["Notification API"] --> H[["push.high - OTP, payment"]]
  A --> M[["push.medium - order updates"]]
  A --> L[["push.low - marketing"]]
  H --> W1["Dedicated workers, always on"]
  M --> W2["Shared workers"]
  L --> W3["Throttled workers"]
```
- A 10M marketing campaign must not block OTPs. Separate topics, separate consumer groups, and reserved workers for OTP.
- **Per-user rate limit:** max 3 promos/day, 1 per hour (Redis counter / sliding window). No limit on transactional.
- **Per-provider rate limit:** token bucket, don't send more than the SMS provider's 1K/sec limit, or it will block you.
- **Quiet hours:** hold promos from 10 pm to 8 am, put them in the scheduled queue.
- **Trade-off:** reserved OTP workers are often idle (cost), but we get a latency guarantee.

### 9.4 Templates, scheduling, bulk fan-out
**NFR:** a 10M campaign in 10 min (~17K/sec), without touching OTPs.
- **Templates:** versioned, per locale (Hindi, English). The worker fills in `{{name}}`. Templates change without a code deploy.
- **Scheduling:** a `send_at` index on the `scheduled_notifications` table. Every minute the scheduler picks up due rows and puts them into the API/Kafka. At very large scale, use time-bucketed partitions (by minute).
- **Bulk campaign:** split the segment (10M users) into small batches (1K), each batch is one Kafka message. Fan-out workers expand a batch into individual notifications. No single giant job.
- **Trade-off:** the scheduler works at minute granularity, so `sendAt` has ±1 min jitter.

### 9.5 Delivery tracking
**NFR:** status is available but eventual (a few seconds late is fine).
- Worker: `QUEUED → SENT`. Provider callback/webhook: `DELIVERED`, `BOUNCED`. App/email pixel: `OPENED`, `CLICKED`.
- Events go Kafka → Cassandra + analytics warehouse. Campaign dashboard: sent vs delivered vs opened.
- On email bounces/spam complaints, put the address on a suppress list, or the SES account can get blocked.
- **Trade-off:** `OPENED` is approximate (email clients block pixels).

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Async API (202) + queue** | Caller is fast, spikes get buffered | **Sync provider call in API:** if Twilio is slow, Order Service is slow too. **Sacrifice:** the caller gets status separately via poll/webhook |
| **Topic per channel + priority** | Provider outage isolation, OTP doesn't wait behind marketing | **One common queue:** head-of-line blocking, OTP 20 min late. **Sacrifice:** more topics and worker pools to manage |
| **Kafka** over SQS/RabbitMQ | ~100K msgs/sec campaign peak, 2 consumers on the status stream, replay | **SQS:** delay/retry/DLQ built in, the better pick at ~1K/sec. **RabbitMQ:** good per-message priority, but no replay. **Sacrifice:** retry topics built by hand, cluster ops |
| **Retry topics + backoff + DLQ** | Main flow not blocked, poison messages kept aside | **Infinite inline retry:** the rest of the partition's traffic stops. **Sacrifice:** ordering lost on retry |
| **Idempotency key + Redis dedup** | No duplicates for the user even with at-least-once | **Relying on Kafka exactly-once:** a third-party call is not in the transaction. **Sacrifice:** dependency on Redis, a small duplicate window |
| **Cassandra** for logs/inbox | ~50K writes/sec peak, per-user time-ordered reads, TTL | **Postgres:** sharding burden at this peak. **Sacrifice:** no ad-hoc queries, a separate analytics warehouse |
| **Provider adapter + fallback** | Switch if one vendor is down/expensive | **Single hardcoded provider:** vendor outage = channel down. **Sacrifice:** maintaining contracts and templates for two vendors |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle it |
|---|---|---|
| SMS provider down | SMS fails | Circuit breaker → fallback provider. Hold in the retry topic |
| Worker crash after send, before commit | May send a duplicate | `sent:` dedup key + provider idempotency key |
| Campaign spike (10M) | Queue lag | Kafka buffer, low priority topic throttled, separate OTP workers |
| Invalid device tokens | Useless calls, provider warning | Mark token inactive on 4xx, cleanup job |
| Redis down | No dedup/rate limit check | Fail-open for transactional (send), fail-closed for marketing (hold) |
| Kafka broker down | Publish fails | Replication factor 3, `acks=all`. API retries with the same idempotency key |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Smart channel fallback:** if a push is not delivered/opened in 5 min, send an SMS (only for important types)
- **Send-time optimization:** send promos at the time the user usually opens the app, so the open rate goes up
- **Notification batching/digest:** instead of 10 notifications for 10 likes, "Rahul and 9 others liked this"
- **Cost optimization:** SMS is expensive, skip SMS when push is enabled
- **Multi-region workers** + region-wise providers (Indian SMS gateways in India, DLT compliance)
- **Observability:** alerts and an SLO dashboard on latency, failure rate and DLQ size per channel/provider

## Step 13: Likely follow-up questions

- "How do you make sure the user doesn't get the same notification twice?" → API idempotency key + worker dedup → Step 9.2
- "What if a provider is down?" → backoff retries, retry topics, DLQ, fallback provider → Step 9.1
- "Why won't OTP be late during a marketing blast?" → separate priority topics and dedicated workers → Step 9.3
- "What if the user opted out?" → preference check before sending, cached in Redis. Transactional (OTP) can't be opted out of
- "How will you send a campaign to 10M users?" → fan-out in batches, throttled low priority topic → Step 9.4
- "Is order preserved?" → if you need per-user ordering, Kafka key = userId, order is kept within one partition
- "Why Kafka and not SQS?" → ~100K msgs/sec at campaign peak, 2 consumers on the status stream and replay. At only ~1K/sec we would take SQS (delay + DLQ built in)
- **Senior signal:** say it yourself: the real bottleneck is the provider rate limit (SMS ~1K/sec), not our servers; a 10M SMS campaign takes ~3 hours. So use a per-provider token bucket, tell the caller the campaign ETA, and decide the fail-open/closed policy for a Redis outage up front.

## 2-minute recap

> A notification system is an async pipeline. Internal services call `POST /notifications` (with an Idempotency-Key). The API checks dedup (Redis `SET NX`), preferences, quiet hours and the per-user rate limit, puts the message in Kafka, and returns 202. Kafka because the campaign peak is ~100K msgs/sec, the status stream has 2 consumers and we need replay; at ~1K/sec SQS would be enough. Kafka has separate topics for each channel (push, SMS, email, in-app) and priority (high/medium/low), so one provider's outage or a marketing blast doesn't block OTPs. Stateless channel workers render the template and call APNs/FCM, Twilio, SES, staying inside the provider's rate limit. On failure: exponential backoff, retry topics, then DLQ, and a circuit breaker switches to a fallback provider. Status events go to Cassandra, and delivered/opened is tracked from provider callbacks. The scheduler puts due notifications into the pipeline, and campaigns fan out in batches.

## Checklist

- [ ] I can draw the HLD with channel-wise Kafka topics + workers in 5 min
- [ ] I can explain the flow of retries with backoff, retry topics and DLQ
- [ ] I can tell how an idempotency key + dedup stop duplicates
- [ ] I can explain OTP vs marketing priority isolation
- [ ] I can tell where preferences, quiet hours and rate limits are checked
- [ ] I can explain scheduling and bulk campaign fan-out
- [ ] I can tell the delivery tracking flow (sent, delivered, opened)
- [ ] I can say 3 trade-offs from the decision table without looking
