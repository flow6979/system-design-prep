**Ek line:** Bahut zyada events ko fast count karo aur top-K nikalo: Redis counters, approximate structures, aur stream windows.

- **Redis INCR:** atomic, ~100K ops/sec per node; har 10 sec DB me flush.
- **Hot key:** sharded counters (`views:42:{0..N-1}`), read pe SUM. Sirf hot keys ke liye.
- **Write batching:** 1 sec memory me jodo, phir ek `INCRBY` (~100x kam writes).
- **Leaderboard:** Redis sorted set, update + rank O(log N); daily boards alag key + TTL.
- **HyperLogLog:** unique count, ~12 KB, ~0.81% error. `PFADD/PFCOUNT`.
- **Count-Min Sketch:** frequency, sirf over-estimate; trending/heavy hitters.
- **Bloom filter:** "pehle dekha?" false positive possible; dedup, crawler.
- **Top-K:** min-heap size K, O(N log K). Distributed: key se partition karo tabhi local top-K merge exact.
- **Windows:** tumbling (fixed), sliding (overlap), session (inactivity gap).
- **Late events:** event time + watermarks; bahut late side output/batch reconcile.
- **Batch vs stream:** billing = batch exact; live/trending = stream. Kappa (replay) aaj zyada popular.

**Interview me bolo:** "Likes ke liye Redis INCR + batching, viral posts pe sharded counters, 10 sec flush. Unique viewers HyperLogLog. Ad clicks Kafka by ad_id, Flink 1 min tumbling, billing ke liye daily batch reconcile."

**Galti mat karna:** Har like pe DB `UPDATE likes = likes + 1` (hot row). Distributed me local top-K merge ko exact maanna, ya billing me approximate structures.
