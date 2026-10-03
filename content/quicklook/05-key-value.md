**Ek line:** Key-value stores key se sub-ms access dete hain: Redis in-memory structures ke liye, DynamoDB managed scale ke liye; key design sab kuch hai.

- **Redis fast kyun:** RAM, single-threaded event loop, no lock contention, efficient structures; bottleneck network hota hai.
- **Structures:** string (`INCR` atomic), hash (object), list (latest-N), set, sorted set (leaderboard, O(log n)).
- **Approx counting:** HyperLogLog 12 KB me unique count; Streams = mini Kafka; bitmaps, geo.
- **Atomicity:** `MULTI/EXEC` me rollback nahi; check-then-decrement ke liye Lua script ya `WATCH`.
- **Persistence:** RDB snapshot, AOF har write log; replication async hai, durability nahi.
- **Redis cluster:** 16384 hash slots; multi-key ops same slot (hash tag) me; Sentinel failover.
- **Eviction:** cache ke liye `allkeys-lru`, `noeviction` nahi; Pub/Sub fire-and-forget hai, queue nahi.
- **DynamoDB keys:** partition key high cardinality (`user_id`), sort key partition ke andar order; `status`/`country` bure.
- **GSI vs LSI:** GSI alag partition key, baad me bhi ban sakta hai; LSI sirf creation pe, 10 GB cap.
- **Hot partition:** ~3000 RCU / 1000 WCU per partition; scale keys ke across hota hai, ek key me nahi.
- **Access-pattern-first:** har query = `GetItem`/`Query`; `Scan` + filter API path me nahi; race ke liye `ConditionExpression`.

**Interview me bolo:** "Pehle access patterns list karta hoon, phir keys aur GSIs. Redis cache/ephemeral ke liye, durable source of truth alag."

**Galti mat karna:** Production me `KEYS *`, bade set pe `ZRANGE 0 -1`, ya Redis ko paise ka source of truth banana.
