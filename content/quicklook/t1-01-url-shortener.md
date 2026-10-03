**Ek line:** Lamba URL → 7-char Base62 code, redirect 302 se; unique code range allocation se, reads Redis + sharded KV se, clicks Kafka → ClickHouse async.

- **Requirements:** create short URL (alias/expiry optional), redirect, basic analytics; redirect p99 < 50 ms, 99.99%.
- **Scale:** 100M URLs/day (~1.2K writes/sec), 100:1 reads (~120K/sec, peak 500K), ~180 TB, ~10B clicks/day.
- **Components:** Write Service, Redirect Service, etcd range counter, DynamoDB/Cassandra by code, Redis, Kafka, ClickHouse.
- **Range allocation over hash/counter:** hash me collision, single counter bottleneck; 1000-id block, ~5 calls/sec.
- **Redis INCRBY nahi:** async failover pe range repeat → duplicate codes.
- **302 over 301:** 301 browser cache karta hai, analytics aur delete/expiry miss.
- **DynamoDB/Cassandra over Postgres:** sirf key lookup, 180 TB, built-in sharding by short_code.
- **Read path:** local cache (Caffeine) → Redis → DB; missing codes ka negative caching.
- **Bottleneck:** viral link ka cache stampede; fix single-flight, local cache, TTL jitter.
- **Senior signal:** non-guessable codes ke liye Base62 se pehle bijective shuffle (Feistel/XOR); alias = conditional insert, 409.

**Interview me bolo:** "Read-heavy 100:1 hai, isliye range allocation se collision-free 7-char code, 302 redirect, aur local cache + Redis + sharded KV. Clicks async Kafka se ClickHouse me."

**Galti mat karna:** Hash first-7-chars bolke collision ignore mat karo; 301 bolke analytics bhool mat jao.
