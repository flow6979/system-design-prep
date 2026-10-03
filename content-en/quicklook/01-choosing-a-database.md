**In one line:** Pick a DB by data shape, access pattern, consistency, and scale, not by popularity.

- **5 questions:** data shape, query pattern, consistency, scale, OLTP vs OLAP.
- **Access pattern first:** write "last 50 orders of a user", then name the DB.
- **Default:** when unsure, PostgreSQL; JSONB, full-text, pgvector cover a lot.
- **Payments/inventory:** Postgres/MySQL with ACID and row locks (`SELECT ... FOR UPDATE`); no eventual consistency.
- **Chat/high writes:** Cassandra, partition `chat_id`, clustering time desc; LSM-tree is write-fast.
- **Key lookup/cache/session:** Redis or DynamoDB; leaderboard = Redis Sorted Set.
- **Search:** Elasticsearch (derived store); analytics: ClickHouse/BigQuery; files: S3 plus URL in DB.
- **B-tree vs LSM:** B-tree for reads/ranges; LSM for write-heavy (commit log + memtable).
- **SQL vs NoSQL:** SQL = joins + ACID; NoSQL = query-first modeling, horizontal scale.
- **Polyglot:** one source of truth (Postgres), the rest derived; sync via CDC or outbox, never dual write.
- **Template:** access pattern, requirement, DB, tradeoff, mitigation, in that order.

**Say in the interview:** "The access pattern here needs ACID, so Postgres. The tradeoff is the single-primary write limit, which I'd handle with sharding and a cache."

**Avoid:** Saying "NoSQL scales, SQL doesn't", or naming a DB with no "why". Don't dual-write either.
