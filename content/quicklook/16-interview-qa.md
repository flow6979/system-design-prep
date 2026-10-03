**Ek line:** DB rapid-fire: har sawal pe access pattern, consistency need aur tradeoff bolo; payment SQL, chat Cassandra, search ES, cache Redis.

- **Default:** Postgres; NoSQL jab specific access pattern ya write scale chahiye; polyglot normal, source of truth ek.
- **Payments:** Postgres/MySQL (ya Spanner/Cockroach multi-region), ACID, ledger, unique constraint se idempotency.
- **Chat:** Cassandra, `chat_id` partition, `message_id` desc clustering, bucket se partition bounded.
- **Leaderboard:** Redis Sorted Set (`ZINCRBY`, `ZREVRANGE`, `ZREVRANK`); durable copy DB me.
- **Isolation:** RC (Postgres default), RR (MySQL default), Serializable; MVCC = readers block nahi.
- **Locking:** pessimistic `FOR UPDATE` high contention pe; optimistic `version` column low contention pe.
- **Double booking:** `FOR UPDATE` + `UNIQUE (show_id, seat_no)` last safety net.
- **Index slow kyun:** function on column, type cast, leading `%`, stale stats; `EXPLAIN ANALYZE`.
- **Partitioning vs sharding:** pehle partitioning (ek server), phir sharding; hot partition = salting/cache/split.
- **CAP/consistency:** CP vs AP, PACELC; Cassandra `QUORUM` + `QUORUM`, multi-DC me `LOCAL_QUORUM`.
- **Cross-service:** 2PC nahi; saga + outbox + idempotent consumers.
- **Specialised:** ES = inverted index, derived; OLAP = columnar; graph = multi-hop; vector = HNSW/pgvector; NewSQL = consensus latency.

**Interview me bolo:** "Access pattern pehle, phir DB, tradeoff khud bolta hoon. Source of truth Postgres, baaki CDC se derived."

**Galti mat karna:** Bina "kyun" ke DB ka naam bolna, ya ES/Redis ko source of truth batana.
