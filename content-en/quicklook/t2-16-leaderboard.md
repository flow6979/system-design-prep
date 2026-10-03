**In one line:** One Redis ZSET per board, scores applied via batched `ZINCRBY` from Kafka, top N cached for 1 sec, durable copy in Cassandra.

- **Requirements:** real-time score updates, top 100 and own rank instantly, daily/weekly/contest boards.
- **Scale:** ~20M entries ≈ 2 GB (fits RAM), ~500K updates/sec burst, ~200K "my rank" QPS, one Redis node ~100K ops/sec.
- **Components:** Kafka, workers (dedup + batch), Redis ZSET, Cassandra, top-N cache, Match Service.
- **Redis ZSET over SQL/Elasticsearch:** O(log N) update/rank, top N built in; SQL ORDER BY scans crores of rows.
- **Kafka over direct Redis/SQS:** absorbs bursts, replay, per-user order; 1-5 sec lag.
- **Cassandra durable copy over Redis AOF only:** prize audit and rebuild.
- **eventId dedup:** exactly-once scoring over at-least-once delivery.
- **Top N cache 1 sec:** identical for everyone, ~100x fewer reads.
- **Score-bucket sharding at huge scale over hash:** hash sharding forces scatter-gather.
- **Failure:** Redis node crash → replica, Cassandra rebuild/Kafka replay; fake scores → accept only server-side.
- **Senior signal:** a hot board key (IPL final); 200 ms worker batching, read replicas, top-N cache, lag SLO alert.

**Say in the interview:** "Memory is not the problem, it is 2 GB. The problem is write bursts and read QPS on one key, so cache top N and batch/shard the writes."

**Avoid:** Accepting scores from clients; forgetting tie handling.
