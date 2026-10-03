**In one line:** Key-value stores give sub-ms access by key: Redis for in-memory structures, DynamoDB for managed scale; key design is everything.

- **Why Redis is fast:** RAM, single-threaded event loop, no lock contention, efficient structures; network is the bottleneck.
- **Structures:** string (atomic `INCR`), hash (object), list (latest-N), set, sorted set (leaderboard, O(log n)).
- **Approximate counting:** HyperLogLog counts uniques in 12 KB; Streams = mini Kafka; bitmaps, geo.
- **Atomicity:** `MULTI/EXEC` has no rollback; use a Lua script or `WATCH` for check-then-decrement.
- **Persistence:** RDB snapshots, AOF logs every write; replication is async, not durability.
- **Redis cluster:** 16384 hash slots; multi-key ops need the same slot (hash tag); Sentinel for failover.
- **Eviction:** `allkeys-lru` for a cache, not `noeviction`; Pub/Sub is fire-and-forget, not a queue.
- **DynamoDB keys:** partition key high cardinality (`user_id`), sort key orders within a partition; `status`/`country` are bad.
- **GSI vs LSI:** GSI has a different partition key and can be added later; LSI only at creation, 10 GB cap.
- **Hot partition:** ~3000 RCU / 1000 WCU per partition; it scales across keys, not within one.
- **Access-pattern-first:** every query = `GetItem`/`Query`; no `Scan` + filter on the API path; `ConditionExpression` for races.

**Say in the interview:** "I list access patterns first, then keys and GSIs. Redis is for cache/ephemeral data, with a durable source of truth elsewhere."

**Avoid:** `KEYS *` in production, `ZRANGE 0 -1` on a big set, or Redis as the source of truth for money.
