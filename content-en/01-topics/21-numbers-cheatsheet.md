---
title: Numbers Cheatsheet
order: 21
time: 6
usedIn: [t1-01-url-shortener, t1-03-news-feed, t1-04-whatsapp-chat, t1-07-youtube, t1-08-dropbox, t2-13-instagram, t2-17-ad-click-aggregator]
---

# Numbers Cheatsheet

**In one line:** remember 15–20 numbers for estimation. They don't need to be exact, but the order of magnitude (within 10x) must be right.

> **Example:** The interviewer says "100M DAU". Within 5 seconds you say "~1,000 QPS average, peak ~5K". This shows that you decide the design from numbers, not from guesses.

## Latency numbers (every engineer should know these)

| Operation | Time | How to remember |
|---|---|---|
| L1 cache reference | ~1 ns | Inside the CPU |
| L2 cache reference | ~5 ns | |
| Main memory (RAM) read | ~100 ns | 100x slower than L1 |
| 1 KB compress (fast algo) | ~2 µs | |
| SSD random read | ~100 µs | 1000x slower than RAM |
| Read 1 MB sequentially from RAM | ~10–250 µs | |
| Round trip within same datacenter | ~0.5 ms | |
| Read 1 MB sequentially from SSD | ~1 ms | |
| HDD disk seek | ~10 ms | 100x slower than SSD |
| Same region, different AZ | ~1–2 ms | |
| Mumbai → Singapore | ~60 ms | |
| Cross-continent (India → US) | ~150–250 ms | Speed of light limit, only cache/CDN can save you |

**Takeaways:**
- RAM >> SSD >> network >> HDD. That is why hot data goes in Redis (RAM).
- A network call inside the same DC is ~0.5 ms. 10 sequential service calls = 5 ms+, so make them parallel.
- Cross-continent is 150ms+. For global users: CDN + regional deployment.

## Powers of 2 and storage units

| Power | Exact | Approx | Unit |
|---|---|---|---|
| 2^10 | 1,024 | 1 Thousand (10^3) | 1 KB |
| 2^20 | 1,048,576 | 1 Million (10^6) | 1 MB |
| 2^30 | | 1 Billion (10^9) | 1 GB |
| 2^40 | | 1 Trillion (10^12) | 1 TB |
| 2^50 | | 10^15 | 1 PB |

- Million users × 1 KB = 1 GB. Billion × 1 KB = 1 TB. Remember these two lines, and you can derive the rest from them.
- Indian units: 1 lakh = 10^5, 1 crore = 10^7.
- `int` = 4 bytes, `long`/timestamp = 8 bytes, UUID = 16 bytes.

## Time: 1 day ≈ 10^5 seconds

1 day = 86,400 sec ≈ **10^5** (rounded up a little, to make calculation easy). 1 month ≈ 2.5M sec. 1 year ≈ 3 × 10^7 sec.

| Per day | Average QPS | Shortcut |
|---|---|---|
| 1M | ~12 | 10^6 / 10^5 = 10 |
| 10M | ~115 | ~100 |
| 100M | ~1,160 | ~1K |
| 1B | ~11,600 | ~10K |
| 10B | ~116,000 | ~100K |

**Peak = 2–5x average** (normal apps). IPL / flash sale / New Year: **10x+**.

## How much one server can handle (rough)

| Component | Rough capacity (single node) | Note |
|---|---|---|
| Web/app server (stateless API) | 1K–10K QPS | Depends on the work. Simple JSON API ~5K |
| Postgres / MySQL writes | ~5K–10K writes/sec | Simple inserts, SSD. Fewer for complex txns |
| Postgres / MySQL reads | ~10K–50K reads/sec | Indexed queries, more with a cache |
| Redis | ~100K ops/sec | Single thread, sub-ms latency |
| Kafka broker | ~100 MB/sec, lakhs of msgs/sec | Add partitions to scale |
| Cassandra node | ~10K–20K writes/sec | Writes scale linearly with nodes |
| WebSocket connections per server | ~50K–1M | 1M is possible on a tuned box, say 100K to be safe |
| Single DB storage comfortable | ~1–5 TB | Above that, think about sharding |

> Rule: if a number goes above 50% of one node's capacity, talk about scaling (replicas, cache, shards).

## Typical object sizes

| Object | Size |
|---|---|
| Tweet / chat message (text + metadata) | ~300 B – 1 KB |
| User profile row | ~1 KB |
| Short URL record | ~500 B |
| Thumbnail | ~20–50 KB |
| Photo (compressed, mobile) | ~200 KB – 2 MB (use 500 KB) |
| 1 minute video, 720p | ~20–30 MB |
| 1 minute video, 1080p | ~50–100 MB |
| 1 minute audio (music) | ~1 MB |
| Web page (HTML) | ~100 KB |
| Log line / click event | ~200 B – 1 KB |

## Worked example: photo sharing app

**Given:** 100M DAU, each user views 10 photos a day, 10% of users upload 1 photo a day.

| What | Calculation | Result |
|---|---|---|
| Uploads/day | 100M × 10% | 10M/day |
| Upload QPS | 10M / 10^5 | ~100 QPS, peak ~500 |
| Views/day | 100M × 10 | 1B/day |
| View QPS | 1B / 10^5 | ~10K QPS, peak ~50K |
| Read:write | 10K : 100 | **100:1, read-heavy** |
| Storage/day | 10M × 500 KB | 5 TB/day |
| Storage/year | 5 TB × 365 | ~1.8 PB/year |
| Egress bandwidth | 10K × 500 KB | ~5 GB/sec |

**Effect on the design:**
- 100:1 read-heavy → CDN + cache are a must.
- PB of storage → photos in S3/blob storage, only metadata in the DB.
- 5 GB/sec egress → not possible without a CDN.
- 100 upload QPS → a sharding-ready SQL DB can handle the metadata.

> **Say:** "Read:write is 100:1 and storage is 1.8 PB/year. So photos go on blob storage + CDN, metadata in the DB, and a cache for the feed. Write QPS is small, so the upload path doesn't need any special scaling."

## Say this in the interview

> "I'll treat 1 day as 10^5 seconds. 100M requests/day means ~1K QPS average, and with a 5x peak that's ~5K. One Postgres handles ~5–10K simple writes/sec, so writes don't need sharding yet, but I'll add a Redis cache for reads."

## Common mistakes

- Spending 5 minutes on exact arithmetic (dividing by 86,400). Use round numbers.
- Computing only average QPS and forgetting the peak.
- Computing numbers but not using them in the design. After every number, say "so...".
- Mixing up bits and bytes (network Mbps is in bits, storage MB is in bytes).
- Not adding the replication factor (3x) to storage.
- Having no idea of a single node's capacity, and so saying things like "sharding for 1000 QPS".

## Checklist

- [ ] I can tell RAM, SSD, same-DC network and cross-continent latency without looking
- [ ] I can convert a per-day count to QPS within 10 sec (the 10^5 rule)
- [ ] I can tell the rough single-node capacity of Redis, Postgres, Kafka and an app server
- [ ] I can tell the rough size of a photo, a minute of video and a tweet
- [ ] I can estimate storage/year and bandwidth and derive a design decision from it
