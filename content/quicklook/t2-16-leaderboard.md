**Ek line:** Har board ek Redis ZSET, scores Kafka se batched `ZINCRBY`, top N cached 1 sec, Cassandra me durable copy.

- **Requirements:** real-time score updates, top 100 aur apna rank turant, daily/weekly/contest boards.
- **Scale:** ~2 crore entries ≈ 2 GB (RAM me fit), ~5 lakh updates/sec burst, ~2 lakh "my rank" QPS, ek Redis node ~1 lakh ops/sec.
- **Components:** Kafka, workers (dedup + batch), Redis ZSET, Cassandra, top-N cache, Match Service.
- **Redis ZSET over SQL/Elasticsearch:** O(log N) update/rank, top N built-in; SQL ORDER BY crores rows scan.
- **Kafka over direct Redis/SQS:** burst absorb, replay, per-user order; 1-5 sec lag.
- **Cassandra durable copy over Redis AOF only:** prize audit aur rebuild.
- **eventId dedup:** at-least-once pe bhi exactly-once score.
- **Top N cache 1 sec:** sab ke liye same, reads ~100x kam.
- **Score-bucket sharding at huge scale over hash:** hash = scatter-gather.
- **Failure:** Redis node crash → replica, Cassandra rebuild/Kafka replay; fake scores → server-side only.
- **Senior signal:** hot board key (IPL final); worker batching 200 ms, read replicas, top-N cache, lag SLO alert.

**Interview me bolo:** "Memory problem nahi, 2 GB hai. Problem ek key pe write burst aur read QPS: top N cache karo aur writes batch/shard karo."

**Galti mat karna:** Client se score accept mat karo; ties ka handling bhoolna nahi.
