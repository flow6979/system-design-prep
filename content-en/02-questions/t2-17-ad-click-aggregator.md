---
title: Design Ad Click Aggregator
order: 17
tier: 2
time: 22
patterns: [Stream processing, Windowing, Exactly-once, OLAP, Lambda reconciliation]
topics: [07-message-queues-kafka, 15-counting-top-k, 10-idempotency-retries, 04-sharding-consistent-hashing, 02-sql-vs-nosql, 20-reliability-observability]
askedAt: [Google, Meta, Amazon, InMobi, Flipkart, Uber]
---

# Design Ad Click Aggregator

**In one line:** capture every ad click, redirect the user to the advertiser's site, and show advertisers click counts per ad, per minute. These counts go into **billing**, so a wrong count = wrong money.

**What the interviewer checks in this question:** high QPS ingestion, stream processing (windows, watermarks), exactly-once counting, choice of OLAP store, and an accuracy guarantee through batch reconciliation.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Impact on design |
|---|---|---|
| "How many clicks per second?" | ~10K avg, peak 50K QPS | Kafka + stream processor, not the DB directly |
| "Query granularity? Per minute?" | Per ad per minute, plus hour/day rollups | 1 min tumbling window |
| "How fresh must the dashboard be?" | ~1 min delay is fine | Streaming, not batch |
| "Accuracy for billing?" | Must be exact, 100% | Dedup + daily batch reconciliation |
| "Do we do the redirect too?" | Yes, the click goes through our server | The click server must be fast, < 50ms |
| "Fraud detection, impressions?" | Basic dedup yes, ML fraud out of scope | Click dedup by click_id |

> **Say:** "I will build two paths: a fast streaming path that updates the dashboard within 1 minute, and a batch path that computes the exact count from raw data at night and reconciles the streaming numbers. Billing will use the batch numbers."

## Step 2: Requirements

**Functional**
1. Users should be able to click an ad and get redirected to the advertiser URL (click is recorded)
2. Advertisers should be able to query clicks per minute for ad X (last 1 hour, or hour/day rollups)
3. Advertisers should be able to filter by campaign, country, device
4. Advertisers should be able to see the top N ads of a campaign (last 1 hour)

**Out of scope:** impressions/CTR, ML fraud detection, ad serving/auction, invoice generation UI.

**Non-functional (in priority order)**
1. **Accuracy:** every click counted exactly once (billing), a click is never lost
2. **Latency:** redirect p99 < 50 ms; dashboard query p99 < 1 sec
3. **Freshness:** dashboard at most ~1 min old
4. **Scale:** 50K QPS peak, ~1B clicks/day, data retained for 1 year

**CAP choice:** availability for click ingestion (redirect even if Kafka is down, with a local buffer), and an eventual dashboard (~1 min). Strong correctness for billing numbers, so they are final only after the batch recount.

## Step 3: Estimation (only what changes the design)

- 1B clicks/day ≈ **12K QPS avg, 50K peak**. An `UPDATE count+1` per click in any OLTP DB = hot rows, not possible. So pre-aggregation. 50K/sec alone does not justify Kafka; **replay + 2 consumers** do (Step 6).
- Raw event ~200 bytes → **200 GB/day** raw. Raw in S3, aggregated in OLAP.
- Aggregated: 10M ads × 1440 min = max 14B rows/day, but only rows for active ads → realistically ~100M rows/day. We need an OLAP store.

> **Say:** "We cannot count every raw click in a DB. The stream processor will aggregate in 1 minute windows, so OLAP gets one row per ad per minute (country, device): 50K writes/sec drop to ~1K rows/sec."

## Step 4: Core entities

- **ClickEvent**: click_id (unique, generated at impression time), ad_id, campaign_id, user_id, ip, country, device, ts
- **AdAggregate**: ad_id, minute_bucket, country, device, click_count
- **Ad**: ad_id, campaign_id, advertiser_id, target_url

## Step 5: APIs

```http
GET /click?ad=123&cid=<click_id>&sig=<hmac>   → 302 Location: advertiser URL
GET /ads/{adId}/clicks?from=..&to=..&granularity=minute&country=IN
                                              → [{minute, count}]
GET /campaigns/{id}/top-ads?window=1h&n=10    → [{adId, count}]
```

> **Say:** "The click URL has a `click_id` and an HMAC signature, created when the ad is served. This gives us dedup, and nobody can build a fake URL to inflate clicks."

## Step 6: High-level design

**Start with a simple v1:** the Click Service inserts every click into Postgres, and the dashboard runs `GROUP BY ad_id, minute`. This works up to a thousand clicks/sec. The numbers break it: at 50K inserts/sec + 1B rows/day a `GROUP BY` takes seconds (→ pre-aggregation: Flink + OLAP), clicks cannot be lost and Flink restarts/recounts need replay (→ Kafka), billing must be exact (→ S3 raw + Spark recount).

```mermaid
flowchart LR
  U["User browser"] --> CS["Click Service redirect"]
  CS --> K[["Kafka clicks topic"]]
  CS -- "302 redirect" --> U
  K --> F["Flink stream job"]
  F --> OL[("OLAP Druid / ClickHouse")]
  K --> S3[("S3 raw clicks")]
  S3 --> SP["Spark daily batch"]
  SP --> OL
  SP --> BL[("Billing DB")]
  A["Advertiser dashboard"] --> Q["Query Service"]
  Q --> OL
```

**Why each component:** (FR1 → Click Service + Kafka, FR2/FR3/FR4 → Flink + OLAP + Query Service; accuracy NFR → S3 + Spark)
- **Click Service:** stateless, writes the event to Kafka (acks=all), then returns 302. Redirect latency NFR.
- **Kafka:** 50K/sec peak, **2 independent consumers** (Flink and the S3 sink), and **7-day replay** (recount after a Flink crash/bug fix). A simpler SQS gives each message to one consumer and has no replay.
- **Flink:** 1 min event-time windows, watermarks, exactly-once checkpoints. A simpler "raw clicks straight into ClickHouse + materialized views" can work, but gives weaker control over click_id dedup and late events.
- **OLAP (ClickHouse/Druid/Pinot):** slice-and-dice in < 1 sec over ~100M aggregated rows/day. Postgres is slow here.
- **S3 + Spark:** a cheap permanent copy of raw data (200 GB/day), exact recount at night, billing truth.
- **Query Service:** dashboard APIs, picks the rollup (minute/hour/day). A thin layer.

## Step 7: Main flow: from click to dashboard

```mermaid
sequenceDiagram
  participant U as User
  participant CS as Click Service
  participant K as Kafka
  participant F as Flink
  participant O as OLAP
  participant A as Advertiser
  U->>CS: GET /click ad 123, cid c77
  CS->>CS: verify HMAC
  CS->>K: produce click c77, acks all
  CS-->>U: 302 to advertiser URL
  K->>F: consume
  F->>F: dedup c77, add to window 12:05
  F->>O: at watermark, write ad 123, 12:05, count 842
  A->>O: clicks for ad 123 last 1 hour
  O-->>A: per minute counts
```

## Step 8: Data model & DB choice

```sql
-- OLAP (ClickHouse / Druid)
ad_clicks_1m(ad_id, campaign_id, minute_ts, country, device, clicks)
  PARTITION BY day, ORDER BY (ad_id, minute_ts)
-- rollups
ad_clicks_1h, ad_clicks_1d   -- materialized views
```

- **OLAP column store:** sorted by time + ad_id, columnar compression, aggregates in ms.
- **S3 (Parquet):** raw clicks, 1 year, for batch.
- **Billing DB (Postgres):** final daily numbers per advertiser, invoices.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 Exactly-once counting
**NFR:** accuracy, every click counted once.

Duplicates can come from three places:
1. **User double click / bot refresh:** dedup by `click_id`. Keyed state `seen(click_id)` in Flink with a 10 min TTL.
2. **Click Service retry:** Kafka idempotent producer (`enable.idempotence=true`).
3. **Flink restart:** checkpoints (Kafka offset + window state together) and an idempotent or transactional OLAP sink. Upsert on row key `(ad_id, minute)`, so a replay overwrites instead of adding twice.
> We also have batch reconciliation, so if anything slips in streaming, it gets fixed at night.

**Trade-off:** dedup state + checkpoints make the Flink job heavy and restarts slow; in return, billing is safe.

### 9.2 Windows, late events and watermarks
**NFR:** freshness ~1 min and counts in the right minute.
- **Tumbling window of 1 min**, using **event time** (the click's ts), not processing time. Otherwise, during Kafka lag, counts land in the wrong minute.
- **Watermark** = "events up to this time have arrived". For example `max_event_ts - 30 sec`. When the watermark crosses 12:06, the 12:05 window closes and is emitted.
- **Late events** (the phone was offline): update the window (upsert) up to `allowedLateness 5 min`. Anything later → side output → S3, and the batch job will count them.
- **Trade-off:** a bigger watermark delay = more accurate but a later dashboard; smaller = fresher but more late events.

### 9.3 Hot ad partitioning
**NFR:** freshness; one viral ad must not lag the whole pipeline.
- A viral ad (an IPL ad) gets 20K QPS → the single Kafka partition and single Flink task for that `ad_id` get overloaded.
- Fix: key = `ad_id + random(0..N-1)` salt. Flink first does a partial count on the salted key, then sums by `ad_id` in a second stage.
- Salt only known hot ads (config list or dynamic detection), use the normal key for the rest.
- **Trade-off:** two-stage aggregation for hot ads = a bit more latency and code.

### 9.4 Batch reconciliation (Lambda style)
**NFR:** 100% billing accuracy.
- Kafka → S3 raw (Kafka Connect, hourly Parquet files).
- At night a **Spark job**: raw clicks, distinct on `click_id`, group by `ad_id, minute`. This is the exact truth.
- Compare with the streaming result. If the difference > threshold, alert, and overwrite OLAP rows with the batch value. Billing always uses batch numbers.
- If the interviewer asks about Kappa: "It can also work with Flink alone if replay and exactly-once are strong, but in billing a double check is cheap insurance."
- **Trade-off:** two pipelines to maintain, and the final billing number arrives the next day.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Kafka** for ingestion | 50K QPS, 2 consumers (Flink, S3), 7-day replay | **Direct DB write:** hot rows, DB goes down. **SQS:** one consumer per message, no replay. Sacrifice: Kafka cluster ops |
| **Flink** for aggregation | Event-time windows, watermarks, exactly-once checkpoints | **ClickHouse materialized views:** simpler, but weak dedup/late events. **Spark micro-batch:** higher latency. Sacrifice: a stateful job is hard to run |
| **Tumbling 1 min window** | Simple, matches dashboard granularity | **Sliding window:** each event in many windows, more compute. Sacrifice: nothing finer than 1 min |
| **OLAP (ClickHouse/Druid/Pinot)** | Group by in < 1 sec over ~100M rows/day, rollups | **Postgres:** slow over billions of rows. **Cassandra:** no ad-hoc group by. Sacrifice: costly updates/deletes, one more store |
| **Spark batch reconciliation** | Exact truth from raw data, billing is safe | **Only streaming (Kappa):** a bug means wrong money and nobody notices. Sacrifice: two pipelines, next-day billing |
| **click_id + HMAC** | Dedup and protection from fake click URLs | **IP + ad_id dedup:** real clicks behind NAT get dropped. Sacrifice: signing work at ad serving |
| **Salted keys for hot ads** | No load concentrated on one partition | **Salting every ad:** pointless two-stage overhead. Sacrifice: maintaining a hot-ads list |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Kafka slow / down | Click not recorded | Click Service buffers to local disk and still redirects. Kafka replication factor 3 |
| Flink job crash | Dashboard stopped | Restart from the last checkpoint, replay from Kafka offsets, idempotent sink |
| OLAP down | Dashboard down | Flink sink backpressure, data is safe in Kafka. Query Service shows a stale cache |
| Hot ad | One task is lagging | Salting + two-stage aggregation |
| Bot click flood | Advertiser gets a fake bill | Rate limit per IP/user, click_id dedup, fraud filter in batch before billing |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Fraud detection stage** in Flink: same user with 20 clicks in 1 min → flag
- **Top-K ads** in real time in Flink with Count-Min Sketch + heap
- Data retention tiers: 1-min data for 30 days, then only hourly rollups (lower cost)
- **Data quality alerts:** if stream vs batch difference > 0.1%, page on-call

## Step 13: Likely follow-up questions

- "Why wait for the Kafka ack before redirecting so no click is lost?" → it is billing data. The Kafka ack is ~5–10ms, within the latency budget
- "A late event came 1 day later?" → dropped in streaming, the batch job will count it
- "How do you get exactly-once end to end?" → idempotent producer + Flink checkpoint + upsert sink + click_id dedup
- "The advertiser queries 1 year of data?" → from the day rollup table, not the minute table
- "Kappa vs Lambda?" → Step 9.4
- **Senior signal:** raise it yourself: the Kafka ack is on the redirect's critical path, so a slow Kafka = a slow redirect for every user. Use a local disk buffer + redirect on timeout in the Click Service, and make stream-vs-batch drift an alerting metric, or billing errors pile up silently.

## 2-minute recap (read this before the interview)

> The Click Service verifies the signed `click_id`, writes the event to Kafka (acks=all) and returns a 302 redirect. Kafka is partitioned by `ad_id` (chosen for 2 consumers + 7-day replay, not just for 50K/sec). Flink aggregates in event-time 1 min tumbling windows, closes windows by watermark, allows 5 min lateness, and sends later events to a side output. Exactly-once: click_id dedup state + idempotent producer + checkpoints + an `(ad_id, minute)` upsert sink. Results go to ClickHouse/Druid with hourly/daily rollups, and the dashboard reads from there. Raw clicks go to S3, and at night Spark does an exact recount and reconciles OLAP and billing. Hot ads use salted keys and two-stage aggregation.

## Checklist

- [ ] I can explain the click → redirect → Kafka flow and why we redirect after the ack
- [ ] I can explain tumbling windows, event time and watermarks
- [ ] I can tell the 3 layers of exactly-once (dedup, checkpoint, idempotent sink)
- [ ] I can tell why an OLAP store, and why not Postgres
- [ ] I can explain the role of batch reconciliation (Lambda)
- [ ] I can explain salting and two-stage aggregation for hot ads
- [ ] I can tell 3 trade-offs from the decision table without looking
