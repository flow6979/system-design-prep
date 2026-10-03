**In one line:** A domain-sharded two-level frontier (priority + per-domain politeness), async fetchers, Bloom-filter URL dedup, SimHash content dedup, raw HTML in S3.

- **Requirements:** crawl 1B pages from seeds; fast, polite (robots/per-domain rate), no duplicates.
- **Scale:** ~400 pages/sec (peak 1K), ~100 TB HTML, ~320 Mbps, ~10B URLs, ~1 TB metadata.
- **Components:** Frontier, async fetchers (~5-20), S3, Kafka, parser, dedup (Bloom + SimHash), Cassandra metadata.
- **Two-level frontier over single FIFO:** important URLs first; no hammering a single domain.
- **Shard frontier by domain hash over URL hash:** politeness lives on one node, no distributed lock.
- **Bloom filter over exact set/DB lookup:** 10B URLs ~12 GB RAM vs ~500 GB; ~1% miss.
- **SimHash over exact hash only:** catches near-duplicates differing by ads/timestamps.
- **Kafka between fetch and parse:** a parser crash does not stall fetching; replay.
- **Cassandra over sharded Postgres:** 10B rows, key lookups only, no transactions.
- **Failure:** fetcher crash → lease/visibility timeout; site 5xx → per-domain backoff, max 3 retries; Bloom lost → reload S3 snapshot.
- **Senior signal:** the bottleneck is politeness + DNS, not CPU; leased dequeue, disk-backed queues, adaptive back-off.

**Say in the interview:** "Network and politeness are the bottleneck, not CPU. I use a domain-sharded two-level frontier, a Bloom filter for URL dedup, and SimHash for content dedup."

**Avoid:** Flooding one domain; proposing an exact in-RAM set of all URLs.
