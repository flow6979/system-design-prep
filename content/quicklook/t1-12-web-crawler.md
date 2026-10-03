**Ek line:** Two-level frontier (priority + per-domain politeness) domain-sharded, async fetchers, Bloom filter URL dedup, SimHash content dedup, S3 raw HTML.

- **Requirements:** seeds se 1B pages crawl; fast, polite (robots/rate per domain), duplicate nahi.
- **Scale:** ~400 pages/sec (peak 1K), ~100 TB HTML, ~320 Mbps, ~10B URLs, ~1 TB metadata.
- **Components:** Frontier, async fetchers (~5-20), S3, Kafka, parser, dedup (Bloom + SimHash), Cassandra metadata.
- **Two-level frontier over single FIFO:** important pehle; ek domain pe hammering nahi.
- **Shard frontier by domain hash over URL hash:** politeness ek node pe, distributed lock nahi.
- **Bloom filter over exact set/DB lookup:** 10B URLs ~12 GB RAM vs ~500 GB; ~1% miss.
- **SimHash over exact hash only:** ads/timestamps wale near-duplicates pakde.
- **Kafka between fetch and parse:** parser crash fetch nahi rokta; replay.
- **Cassandra over sharded Postgres:** 10B rows, sirf key lookups, no txn.
- **Failure:** fetcher crash → lease/visibility timeout; site 5xx → per-domain backoff, max 3 retries; Bloom lost → S3 snapshot.
- **Senior signal:** bottleneck CPU nahi, politeness + DNS hai; leased dequeue, disk-backed queues, adaptive back-off.

**Interview me bolo:** "Network aur politeness bottleneck hai, CPU nahi. Domain-sharded two-level frontier, Bloom filter se URL dedup, aur SimHash se content dedup."

**Galti mat karna:** Ek domain ko flood mat karo; exact set me saare URLs RAM me rakhne ki baat mat karo.
