**In one line:** Count huge event volumes fast and extract top-K using Redis counters, approximate structures and stream windows.

- **Redis INCR:** atomic, ~100K ops/sec per node; flush to DB every 10 sec.
- **Hot key:** sharded counters (`views:42:{0..N-1}`), SUM on read. Only for hot keys.
- **Write batching:** accumulate 1 sec in memory, then one `INCRBY` (~100x fewer writes).
- **Leaderboard:** Redis sorted set, update and rank O(log N); daily boards as separate keys with TTL.
- **HyperLogLog:** unique count, ~12 KB, ~0.81% error. `PFADD/PFCOUNT`.
- **Count-Min Sketch:** frequency, only over-estimates; trending/heavy hitters.
- **Bloom filter:** "seen before?" with possible false positives; dedup, crawlers.
- **Top-K:** min-heap of size K, O(N log K). Distributed: partition by key so merging local top-K is exact.
- **Windows:** tumbling (fixed), sliding (overlap), session (inactivity gap).
- **Late events:** event time plus watermarks; very late ones go to side output/batch reconcile.
- **Batch vs stream:** billing = exact batch; live/trending = stream. Kappa (replay) is more popular today.

**Say in the interview:** "Likes via Redis INCR with batching, sharded counters for viral posts, 10 sec flush. HyperLogLog for unique viewers. Ad clicks in Kafka by ad_id, Flink 1-min tumbling windows, daily batch reconcile for billing."

**Avoid:** `UPDATE likes = likes + 1` per like (hot row contention). Treating merged local top-K as exact, or using approximate structures for billing.
