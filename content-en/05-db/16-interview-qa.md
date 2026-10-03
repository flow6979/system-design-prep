---
title: Database Interview Rapid-fire
order: 16
time: 30
---

# Database Interview Rapid-fire

Read this file the day before the interview. Every question has a 2–4 line answer; say that. For SQL query questions, write your own answer first, then compare. Each DB has its own page for details.

## ⭐ All DB types in one table

| Type | Data model | Consistency | Scale | Query power | Best for | Avoid when | Examples |
|---|---|---|---|---|---|---|---|
| Relational (SQL) | tables, rows, FKs | strong, ACID | vertical + read replicas, manual sharding | very high: joins, aggregates | orders, payments, users, inventory | schema-less data or 100k+ writes/s on one table | PostgreSQL, MySQL |
| Key-value | key → value | strong (single node) / tunable | horizontal, easy | key lookup only | cache, sessions, rate limits, counters | relations or range/ad-hoc queries | Redis, DynamoDB, Memcached |
| Document | JSON documents | single-doc atomic, tunable | horizontal (sharding) | rich queries inside a doc, weak joins | catalogs, CMS, user profiles | many cross-entity transactions | MongoDB, Firestore, Couchbase |
| Wide-column | partition key + clustering cols | tunable, eventual by default | massive horizontal, write-heavy | partition key only, query-first modeling | chat messages, IoT, time-ordered events | ad-hoc queries, joins, transactions | Cassandra, ScyllaDB, HBase, Bigtable |
| Search | inverted index | near real-time (~1 s) | horizontal (shards) | full-text, fuzzy, facets | product search, log search | source of truth, transactions | Elasticsearch, OpenSearch, Solr |
| Time-series | (time, series, value) | append-mostly | horizontal, compression | time-window aggregates, downsampling | metrics, IoT, stock ticks | random updates, relations | Prometheus, InfluxDB, TimescaleDB |
| Graph | nodes + edges | ACID (Neo4j) | mostly vertical, hard to shard | multi-hop traversal | social graph, fraud rings, recommendations | simple CRUD, aggregates | Neo4j, Neptune |
| Vector | embeddings + metadata | eventual (most) | horizontal | ANN similarity search | semantic search, RAG, recommendations | exact match / transactions | Pinecone, Milvus, pgvector, Qdrant |
| Columnar / OLAP | column-wise storage | batch / eventual | horizontal, MPP | huge scans + aggregates | analytics, dashboards, BI | point lookups, frequent updates | ClickHouse, BigQuery, Snowflake, Redshift |
| NewSQL | relational, auto-sharded | strong, serializable | horizontal + multi-region | full SQL | global payments, multi-region ACID | small apps, low-latency simple KV | CockroachDB, Spanner, YugabyteDB, TiDB |
| Object storage | bucket + key → blob | strong read-after-write (S3) | practically unlimited | key/prefix only | images, video, backups, data lake | small updatable records | S3, GCS, Azure Blob, MinIO |

## ⭐ Choosing a DB

### Q: How do you choose between SQL and NoSQL?
By access pattern and consistency. Relations, transactions, ad-hoc queries (orders, payments) → SQL. Very high write scale, simple key-based access, flexible schema (chat messages, events) → NoSQL. Say Postgres by default, and NoSQL only for a specific reason. Details: [Choosing a Database](01-choosing-a-database.md).

### Q: Should a system have only one DB?
No, **polyglot persistence** is normal. Swiggy: orders in Postgres, menu search in Elasticsearch, session/cart in Redis, rider location in Redis GEO, analytics in ClickHouse, photos in S3. Keep one source of truth, sync the rest via CDC.

### Q: Which DB for a payment system?
Relational (Postgres/MySQL), or Spanner/CockroachDB if multi-region is needed. Because of ACID, a double-entry ledger, idempotency keys via unique constraints, and audit queries. An eventually consistent store is the wrong answer for a ledger.

### Q: Which DB for chat messages (WhatsApp)?
Cassandra/ScyllaDB (or HBase). Write-heavy, `chat_id` as partition key, `message_id` (time-based) clustering DESC, so "last 50 messages" is a sequential read of one partition. No need for joins/transactions.

### Q: Which DB for a product catalog?
A document DB (MongoDB) fits well: each category has different attributes (RAM for phones, size for kurtas). Add Elasticsearch for search. Transactional price/stock can also live in a relational DB.

### Q: Which DB for a leaderboard?
Redis Sorted Set: `ZINCRBY` to update a score, `ZREVRANGE 0 9` for the top 10, `ZREVRANK` for a user's rank, all O(log n). Keep a durable copy in a DB; Redis serves the read path. At huge scale, sharded sorted sets or approximate ranks.

### Q: Design the schema: URL shortener
`urls(short_code PK, long_url, user_id, created_at, expires_at)`. Lookups are by `short_code` only, so a KV store or DynamoDB is also perfect. `short_code` = base62 of a unique ID. Cache hot codes in Redis. Click analytics go to a separate table/stream. Details: [URL Shortener](../02-questions/t1-01-url-shortener.md).

## ⭐ SQL & Transactions

### Q: What is ACID?
**Atomicity:** all or nothing (undo/WAL). **Consistency:** constraints are never broken. **Isolation:** concurrent transactions do not see each other's bad intermediate state (MVCC/locks). **Durability:** data survives a crash after commit (WAL fsync). Details: [Transactions & ACID](03-transactions-acid.md).

### Q: Isolation levels and their anomalies?
Read Uncommitted (dirty reads), Read Committed (non-repeatable reads; Postgres default), Repeatable Read (phantoms in the SQL standard; MySQL InnoDB default, snapshot in Postgres), Serializable (no anomalies). Higher level = more correctness, at the cost of throughput/retries.

### Q: What is MVCC?
Every update creates a new row version, and readers read an older consistent snapshot. So readers do not block writers. In Postgres, VACUUM cleans old versions; MySQL rebuilds old versions from the undo log.

### Q: Optimistic vs pessimistic locking?
Pessimistic: `SELECT ... FOR UPDATE`, a row lock, for high contention (the last 10 seats). Optimistic: a `version` column, `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`, retry if 0 rows were updated. For low contention. Details: [Locks](../01-topics/09-locks-and-contention.md).

### Q: How do you prevent double booking (BookMyShow)?
```sql
UPDATE seats SET status = 'HELD', held_by = :user, held_until = now() + interval '10 min'
WHERE show_id = :show AND seat_no = :seat
  AND (status = 'FREE' OR held_until < now());
-- 1 row updated = you got it, 0 = someone else took it
```
Plus `UNIQUE (show_id, seat_no)` on the bookings table as the last safety net.

### Q: What is the WAL?
Write-Ahead Log: before a data page changes, the change is fsynced to a sequential log. On crash, replay the log to recover. The same log is the basis of (streaming) replication and PITR.

### Q: Normalization vs denormalization?
Normalization (3NF): no duplicate data, safe updates, but more joins. Denormalization: fast reads, but duplicates must be updated. Normalize for OLTP; denormalize hot read paths and analytics (or use a materialized view).

### Q: SQL: second highest salary
```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
-- Nth highest (treating duplicates as one)
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;
```

### Q: SQL: top 3 earners in each department
```sql
SELECT * FROM (
  SELECT e.*, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees e
) t WHERE rnk <= 3;
```
`ROW_NUMBER` breaks ties, `RANK` leaves gaps (1,1,3), `DENSE_RANK` has no gaps (1,1,2).

### Q: SQL: find and delete duplicate emails (keep the lowest id)
```sql
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

DELETE FROM users u USING users d
WHERE u.email = d.email AND u.id > d.id;   -- Postgres
```

### Q: SQL: customers who never placed an order
```sql
SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
-- or NOT EXISTS (NOT IN gives wrong results with NULLs)
```

### Q: SQL: running total per user and revenue per month
```sql
SELECT user_id, created_at, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total
FROM orders;

SELECT date_trunc('month', created_at) AS month, SUM(amount)
FROM orders GROUP BY 1 ORDER BY 1;
```

### Q: Design the schema: BookMyShow
`movies`, `theatres`, `screens(theatre_id)`, `seats(screen_id, seat_no, type)`, `shows(movie_id, screen_id, starts_at)`, `show_seats(show_id, seat_id, status, price, held_until, booking_id)` with `UNIQUE(show_id, seat_id)`, `bookings(id, user_id, show_id, status, amount, idempotency_key UNIQUE)`. Lock seats with a conditional UPDATE on `show_seats`. Details: [BookMyShow](../02-questions/t1-05-bookmyshow.md).

## ⭐ Indexes

### Q: How does an index work, and why a B-tree?
A B+tree keeps keys sorted with high fan-out (hundreds of keys per node), so 3–4 levels cover tens of millions of rows. Equality, range and `ORDER BY` are all O(log n). Leaf nodes are linked, so range scans are fast. Details: [Indexes](04-indexes.md).

### Q: Which queries can use a composite index `(a, b, c)`?
Leftmost prefix rule: `a`, `a,b`, `a,b,c` yes; `b` or `c` alone no. `WHERE a = ? AND b > ? ORDER BY b` works. Equality columns first, the range column last.

### Q: What is a covering index?
The index contains every column the query needs, so the table (heap) is never read: an index-only scan. Postgres: `CREATE INDEX ... (user_id) INCLUDE (status, amount)`.

### Q: Why is an index not always good?
Every index is updated on every write (slower writes) and uses disk/memory. The planner will not even use one on a low-selectivity column (`gender`). Create them only for real query patterns and verify with `EXPLAIN ANALYZE`.

### Q: The query is slow even with an index, why?
A function on the column (`WHERE lower(email) = ...` without an expression index), an implicit type cast, a leading-wildcard `LIKE '%abc'`, `OR` conditions, the wrong column order, or stale statistics (`ANALYZE`). Look for a Seq Scan in `EXPLAIN ANALYZE`.

### Q: B-tree vs LSM tree?
B-tree: in-place updates, fast reads, random writes (Postgres, MySQL). LSM: writes go to a memtable + sequential SSTables with background compaction; very fast writes, but reads may check many files (bloom filters help). Cassandra, RocksDB and ScyllaDB use LSM.

### Q: Clustered vs non-clustered index?
Clustered: the table data itself is stored in index order (the MySQL InnoDB primary key); there can be only one. Non-clustered: a separate structure holding a pointer/PK to the row. An InnoDB secondary index → PK → row, so keep the PK small.

## NoSQL (KV, Document, Wide-column)

### Q: Why is Redis so fast?
In-memory, single-threaded command execution (no locks), efficient data structures, I/O multiplexing (epoll). ~100k+ ops/sec on one node. Persistence via RDB snapshots or AOF, but the main use is cache/ephemeral state. Details: [Key-Value](05-key-value.md).

### Q: How do you build a rate limiter in Redis?
Fixed window: `INCR rl:user:42:202610031200` + `EXPIRE 60`; reject when count > limit. Sliding window: timestamps in a sorted set, remove old ones with `ZREMRANGEBYSCORE`, count with `ZCARD`. Use a Lua script to keep it atomic. Details: [Rate Limiter](../02-questions/t1-02-rate-limiter.md).

### Q: Partition key and sort key in DynamoDB?
The partition key is hashed to pick the partition; the sort key orders items inside the partition and allows range queries (`begins_with`, `between`). Write the access patterns first, then the keys. Use a GSI for another access pattern; in single-table design, `PK = USER#42`, `SK = ORDER#2026-10-03`.

### Q: Embed vs reference in MongoDB?
Embed when data is read together and bounded (an order's line items). Reference when it grows unbounded (lakhs of comments on a post) or is updated/queried separately. Remember the 16 MB document limit. Details: [Document](06-document.md).

### Q: Cassandra's write path?
Commit log (sequential, durability) → memtable (memory) → ack. When the memtable is full it is flushed to an immutable SSTable. Background compaction merges SSTables. That is why writes are very fast; deletes are tombstones. Details: [Wide-column](07-wide-column.md).

### Q: Tunable consistency in Cassandra?
Replication factor N=3. Write at `QUORUM` (2) + read at `QUORUM` (2) → `W + R > N`, strong-ish reads. `ONE` is fast but may be stale. In multi-DC use `LOCAL_QUORUM` to avoid cross-region latency.

### Q: Design the schema: WhatsApp messages in Cassandra
```sql
CREATE TABLE messages (
  chat_id    uuid,
  bucket     int,          -- month bucket, keeps the partition bounded
  message_id timeuuid,
  sender_id  uuid,
  body       text,
  PRIMARY KEY ((chat_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```
"Latest 50 messages" = one partition, sorted read. The bucket keeps partitions of mega-groups from growing unbounded.

## ⭐ Scaling & Replication

### Q: What is the problem with read replicas?
Replication lag: a user writes and immediately reads from a replica and sees old data (read-your-writes broken). Fix: read from the primary for a short while after the user's own writes, or track the LSN. Replicas do not scale writes. Details: [Scaling Databases](14-scaling-databases.md).

### Q: Partitioning vs sharding?
Partitioning: split a table into parts inside one DB (Postgres `PARTITION BY RANGE`), same server, normal transactions. Sharding: data on separate servers, writes scale but cross-shard joins/transactions are hard. Partition first, shard later.

### Q: What makes a good shard key?
High cardinality, even distribution, and the main query stays single-shard. `user_id` / `tenant_id` are common. Monotonic keys (timestamps) create hotspots with range sharding. Details: [Sharding](../01-topics/04-sharding-consistent-hashing.md).

### Q: Why consistent hashing?
With `hash % N`, changing N moves almost every key. On a ring only ~1/N of keys move, and virtual nodes even out load. DynamoDB, Cassandra and Memcached clients rely on it.

### Q: How do you fix a hot partition?
Salting (`key#0..9`, merge on read), split the hot range, cache in front, write aggregation (add counters in Redis, flush in batches), a dedicated shard for the celebrity. Detect it first: per-partition metrics.

### Q: CAP theorem in simple words?
Network partitions (P) will happen; then choose Consistency (error/wait, CP: Spanner, HBase) or Availability (serve possibly stale data, AP: Cassandra, DynamoDB by default). PACELC: even without a partition there is a Latency vs Consistency trade-off. Details: [CAP](../01-topics/06-cap-consistency.md).

### Q: Single-leader vs multi-leader vs leaderless?
Single-leader: simple, no conflicts, limited write scale. Multi-leader: writes in every region, conflicts must be resolved (LWW/CRDT). Leaderless: quorum W + R > N, high availability, read repair/hinted handoff (Cassandra, Dynamo).

### Q: How do you update the DBs of two services together (distributed transaction)?
Avoid 2PC (blocking, coordinator is a SPOF). Use a **Saga**: local transactions + compensating actions, and a **transactional outbox** (business row + event in one local transaction, a relay publishes to Kafka). Consumers are idempotent. Details: [Distributed Transactions](../01-topics/16-distributed-transactions.md).

## Specialised DBs (search, time-series, graph, vector, OLAP)

### Q: How does Elasticsearch do fast full-text search?
An **inverted index**: term → list of documents. A text analyzer (tokenize, lowercase, stemming) produces the terms, BM25 scores them. Shards search in parallel and results are merged. Near real-time: refresh every ~1 sec. Details: [Search](08-search.md).

### Q: Why not use Elasticsearch as the primary DB?
No transactions, no immediate reads because of refresh, reindex on mapping changes, a history of split-brain/data loss. Keep Postgres as the source of truth and sync ES via CDC. Details: [Search Indexing](../01-topics/14-search-indexing.md).

### Q: How is a time-series DB different from a normal DB?
Data is append-only and time-ordered, and queries run over time windows. Hence time-based partitioning (chunks), heavy compression (delta, Gorilla), retention policies and downsampling. Prometheus, TimescaleDB, InfluxDB. Details: [Time-series](09-time-series.md).

### Q: When a graph DB?
When the query is about multi-hop relations: "friends of friends who live in Bangalore", fraud rings (shared device/card). In SQL each hop is a self-join and it slows down with depth. Neo4j has index-free adjacency; Cypher: `MATCH (u)-[:FRIEND*2]->(f)`. Details: [Graph](10-graph.md).

### Q: Vector DB and HNSW?
Stores embeddings (e.g. 1536-dim) and serves approximate nearest neighbour search. HNSW: a multi-layer graph; jump through sparse upper layers, refine in the dense bottom layer; tune recall vs speed with `ef`. Used for RAG/semantic search. pgvector is enough at small scale. Details: [Vector](11-vector.md).

### Q: OLTP vs OLAP, and why is columnar fast?
OLTP: small transactions, row lookups (Postgres). OLAP: scan tens of millions of rows for aggregates (ClickHouse, BigQuery). Columnar reads only the needed columns, same-type data compresses very well, and execution is vectorized. Weak at point updates. Details: [Columnar / OLAP](12-columnar-olap.md).

### Q: What store for ad click aggregation?
Clicks into Kafka, stream processing (Flink) for per-minute aggregates, aggregates into ClickHouse/Druid (OLAP) for dashboards, raw clicks in S3 for reconciliation. Details: [Ad Click Aggregator](../02-questions/t2-17-ad-click-aggregator.md).

### Q: When NewSQL?
When you need ACID + horizontal write scale + multi-region (global payments, inventory). Cost: consensus latency on every write (~5–10 ms in one region, 100 ms+ across regions). For a normal app, just Postgres. Details: [NewSQL](13-newsql.md).

## Checklist

- [ ] I can recite the comparison table of all DB types (model, consistency, scale, best for)
- [ ] I can pick a DB for payments, chat, catalog, leaderboard and search with a one-line reason
- [ ] I can explain ACID, isolation levels and MVCC crisply
- [ ] I can write the SQL for second highest salary, top-N per group, deleting duplicates and an anti-join without looking
- [ ] I can explain the composite index leftmost prefix, covering indexes and B-tree vs LSM
- [ ] I can design the schema for BookMyShow (SQL) and WhatsApp (Cassandra)
- [ ] I can answer on replication lag, shard keys, consistent hashing and hot partitions
- [ ] I can say when to use search, time-series, graph, vector and OLAP DBs
