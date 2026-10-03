**In one line:** DB rapid-fire: for every question state the access pattern, consistency need, and tradeoff; payments SQL, chat Cassandra, search ES, cache Redis.

- **Default:** Postgres; NoSQL when a specific access pattern or write scale demands it; polyglot is normal with one source of truth.
- **Payments:** Postgres/MySQL (or Spanner/Cockroach for multi-region), ACID, ledger, idempotency via unique constraint.
- **Chat:** Cassandra, `chat_id` partition, `message_id` desc clustering, bucket to bound partitions.
- **Leaderboard:** Redis Sorted Set (`ZINCRBY`, `ZREVRANGE`, `ZREVRANK`); durable copy in the DB.
- **Isolation:** RC (Postgres default), RR (MySQL default), Serializable; MVCC means readers don't block.
- **Locking:** pessimistic `FOR UPDATE` under high contention; optimistic `version` column under low contention.
- **Double booking:** `FOR UPDATE` + `UNIQUE (show_id, seat_no)` as the last safety net.
- **Slow despite index:** function on column, type cast, leading `%`, stale stats; use `EXPLAIN ANALYZE`.
- **Partitioning vs sharding:** partition first (one server), shard later; hot partition = salting/cache/split.
- **CAP/consistency:** CP vs AP, PACELC; Cassandra `QUORUM` + `QUORUM`, `LOCAL_QUORUM` across DCs.
- **Cross-service:** no 2PC; saga + outbox + idempotent consumers.
- **Specialised:** ES = inverted index, derived; OLAP = columnar; graph = multi-hop; vector = HNSW/pgvector; NewSQL = consensus latency.

**Say in the interview:** "Access pattern first, then the DB, and I state the tradeoff myself. Postgres is the source of truth, the rest are CDC-derived."

**Avoid:** Naming a DB with no "why", or presenting ES/Redis as the source of truth.
