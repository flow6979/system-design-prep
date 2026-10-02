---
title: Numbers Cheatsheet
order: 21
time: 6
usedIn: [t1-01-url-shortener, t1-03-news-feed, t1-04-whatsapp-chat, t1-07-youtube, t1-08-dropbox, t2-13-instagram, t2-17-ad-click-aggregator]
---

# Numbers Cheatsheet

**Ek line me:** estimation ke liye 15–20 numbers yaad rakho. Exact hona zaroori nahi, sahi order of magnitude (10x ke andar) zaroori hai.

> **Example:** Interviewer bola "100M DAU". Tum 5 second me bol do "~1,000 QPS average, peak ~5K". Isse dikhta hai ki tum numbers se design decide karte ho, guess se nahi.

## Latency numbers (har engineer ko pata hone chahiye)

| Operation | Time | Yaad rakhne ka tareeka |
|---|---|---|
| L1 cache reference | ~1 ns | CPU ke andar |
| L2 cache reference | ~5 ns | |
| Main memory (RAM) read | ~100 ns | L1 se 100x slow |
| 1 KB compress (fast algo) | ~2 µs | |
| SSD random read | ~100 µs | RAM se 1000x slow |
| Read 1 MB sequentially from RAM | ~10–250 µs | |
| Round trip within same datacenter | ~0.5 ms | |
| Read 1 MB sequentially from SSD | ~1 ms | |
| HDD disk seek | ~10 ms | SSD se 100x slow |
| Same region, different AZ | ~1–2 ms | |
| Mumbai → Singapore | ~60 ms | |
| Cross-continent (India → US) | ~150–250 ms | Speed of light limit, cache/CDN hi bachata hai |

**Takeaways:**
- RAM >> SSD >> network >> HDD. Isliye hot data Redis (RAM) me.
- Same DC me network call ~0.5 ms. 10 sequential service calls = 5 ms+, isliye parallel karo.
- Cross-continent 150ms+. Global users ke liye CDN + regional deployment.

## Powers of 2 aur storage units

| Power | Exact | Approx | Unit |
|---|---|---|---|
| 2^10 | 1,024 | 1 Thousand (10^3) | 1 KB |
| 2^20 | 1,048,576 | 1 Million (10^6) | 1 MB |
| 2^30 | | 1 Billion (10^9) | 1 GB |
| 2^40 | | 1 Trillion (10^12) | 1 TB |
| 2^50 | | 10^15 | 1 PB |

- Million users × 1 KB = 1 GB. Billion × 1 KB = 1 TB. Ye do line yaad rakho, baaki isi se nikal jaata hai.
- Indian units: 1 lakh = 10^5, 1 crore = 10^7.
- `int` = 4 bytes, `long`/timestamp = 8 bytes, UUID = 16 bytes.

## Time: 1 din ≈ 10^5 seconds

1 din = 86,400 sec ≈ **10^5** (thoda round up, calculation easy). 1 mahina ≈ 2.5M sec. 1 saal ≈ 3 × 10^7 sec.

| Per day | Average QPS | Shortcut |
|---|---|---|
| 1M | ~12 | 10^6 / 10^5 = 10 |
| 10M | ~115 | ~100 |
| 100M | ~1,160 | ~1K |
| 1B | ~11,600 | ~10K |
| 10B | ~116,000 | ~100K |

**Peak = 2–5x average** (normal apps). IPL / flash sale / New Year: **10x+**.

## Ek server kitna sambhal leta hai (rough)

| Component | Rough capacity (single node) | Note |
|---|---|---|
| Web/app server (stateless API) | 1K–10K QPS | Kaam pe depend. Simple JSON API ~5K |
| Postgres / MySQL writes | ~5K–10K writes/sec | Simple inserts, SSD. Complex txn kam |
| Postgres / MySQL reads | ~10K–50K reads/sec | Indexed queries, cache ke saath zyada |
| Redis | ~100K ops/sec | Single thread, sub-ms latency |
| Kafka broker | ~100 MB/sec, lakhs msgs/sec | Partitions badhao to scale |
| Cassandra node | ~10K–20K writes/sec | Writes linearly scale with nodes |
| WebSocket connections per server | ~50K–1M | Tuned box pe 1M possible, 100K safe bolo |
| Single DB storage comfortable | ~1–5 TB | Usse upar sharding socho |

> Rule: agar number ek node ki capacity ke 50% se upar jaa raha hai, to scaling (replicas, cache, shards) ki baat karo.

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

**Given:** 100M DAU, har user din me 10 photos dekhta hai, 10% users din me 1 photo upload karte hain.

| Kya | Calculation | Result |
|---|---|---|
| Uploads/day | 100M × 10% | 10M/day |
| Upload QPS | 10M / 10^5 | ~100 QPS, peak ~500 |
| Views/day | 100M × 10 | 1B/day |
| View QPS | 1B / 10^5 | ~10K QPS, peak ~50K |
| Read:write | 10K : 100 | **100:1, read-heavy** |
| Storage/day | 10M × 500 KB | 5 TB/day |
| Storage/year | 5 TB × 365 | ~1.8 PB/year |
| Egress bandwidth | 10K × 500 KB | ~5 GB/sec |

**Design pe asar:**
- 100:1 read-heavy → CDN + cache must.
- PB storage → photos S3/blob storage me, DB me sirf metadata.
- 5 GB/sec egress → CDN ke bina possible nahi.
- 100 upload QPS → metadata ek sharded-ready SQL DB sambhal lega.

> **Bolo:** "Read:write 100:1 hai aur 1.8 PB/year storage hai. Isliye photos blob storage + CDN pe, metadata DB me, aur feed ke liye cache. Write QPS chhota hai, upload path pe koi special scaling nahi chahiye."

## Interview me bolo

> "Main 1 din ko 10^5 seconds maan ke chalunga. 100M requests/day matlab ~1K QPS average, peak 5x to ~5K. Ek Postgres ~5–10K simple writes/sec le leta hai, to writes ke liye abhi sharding nahi chahiye, par reads ke liye Redis cache lagaunga."

## Common galtiyan

- 5 minute exact arithmetic me lagana (86,400 se divide). Round numbers lo.
- Sirf average QPS nikalna, peak bhool jaana.
- Numbers nikal ke design me use na karna. Har number ke baad "isliye..." bolo.
- Bits aur bytes mix karna (network Mbps bits me hota hai, storage MB bytes me).
- Replication factor (3x) storage me na jodna.
- Ek node ki capacity ka koi idea na hona, isliye "1000 QPS ke liye sharding" jaisi baat karna.

## Checklist

- [ ] RAM, SSD, same-DC network aur cross-continent latency bina dekhe bata sakta hoon
- [ ] Per day count ko QPS me 10 sec ke andar convert kar sakta hoon (10^5 rule)
- [ ] Redis, Postgres, Kafka, app server ki rough single-node capacity bata sakta hoon
- [ ] Photo, video minute, tweet ka rough size bata sakta hoon
- [ ] Storage/year aur bandwidth ka estimate karke usse design decision nikaal sakta hoon
