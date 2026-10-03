**In one line:** Long URL becomes a 7-char Base62 code via range allocation, redirect with 302, reads served by cache + sharded KV, clicks flow async through Kafka to ClickHouse.

- **Requirements:** create short URL (optional alias/expiry), redirect, basic analytics; redirect p99 < 50 ms, 99.99%.
- **Scale:** 100M URLs/day (~1.2K writes/sec), 100:1 reads (~120K/sec, peak 500K), ~180 TB, ~10B clicks/day.
- **Components:** Write Service, Redirect Service, etcd range counter, DynamoDB/Cassandra by code, Redis, Kafka, ClickHouse.
- **Range allocation over hash/counter:** hash collides, single counter is a bottleneck; 1000-id blocks, ~5 calls/sec.
- **Not Redis INCRBY:** async failover can repeat a range, giving duplicate codes.
- **302 over 301:** 301 is browser-cached, so analytics and delete/expiry are missed.
- **DynamoDB/Cassandra over Postgres:** pure key lookup, 180 TB, built-in sharding by short_code.
- **Read path:** local cache (Caffeine) then Redis then DB; negative-cache missing codes.
- **Bottleneck:** cache stampede on a viral link; fix with single-flight, local cache, TTL jitter.
- **Senior signal:** bijective shuffle (Feistel/XOR) before Base62 for non-guessable codes; alias = conditional insert, 409.

**Say in the interview:** "It is 100:1 read-heavy, so I use range allocation for collision-free 7-char codes, 302 redirects, and local cache + Redis + a sharded KV. Clicks go async via Kafka to ClickHouse."

**Avoid:** Saying "first 7 chars of a hash" and ignoring collisions; choosing 301 and forgetting analytics.
