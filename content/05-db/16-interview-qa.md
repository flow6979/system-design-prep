---
title: Database Interview Rapid-fire
order: 16
time: 30
---

# Database Interview Rapid-fire

Interview se ek din pehle ye file padho. Har sawal ka 2–4 line ka jawab hai, wahi bolo. SQL query wale sawal pe pehle khud likho, phir milao. Detail ke liye har DB ki apni file hai.

## ⭐ Saare DB types ek table me

| Type | Data model | Consistency | Scale | Query power | Best for | Avoid when | Examples |
|---|---|---|---|---|---|---|---|
| Relational (SQL) | tables, rows, FK | strong, ACID | vertical + read replicas, sharding manual | bahut zyada: joins, aggregates | orders, payments, users, inventory | schema-less ya 100k+ writes/s ek table pe | PostgreSQL, MySQL |
| Key-value | key → value | strong (single node) / tunable | horizontal, easy | sirf key lookup | cache, session, rate limit, counters | relations ya range/ad-hoc queries | Redis, DynamoDB, Memcached |
| Document | JSON documents | single-doc atomic, tunable | horizontal (sharding) | doc ke andar rich queries, joins weak | catalogs, CMS, user profiles | bahut saare cross-entity transactions | MongoDB, Firestore, Couchbase |
| Wide-column | partition key + clustering cols | tunable, eventual default | massive horizontal, write-heavy | sirf partition key se, query-first modeling | chat messages, IoT, time-ordered events | ad-hoc queries, joins, transactions | Cassandra, ScyllaDB, HBase, Bigtable |
| Search | inverted index | near real-time (~1 s) | horizontal (shards) | full-text, fuzzy, facets | product search, log search | source of truth, transactions | Elasticsearch, OpenSearch, Solr |
| Time-series | (time, series, value) | append-mostly | horizontal, compression | time-window aggregates, downsampling | metrics, IoT, stock ticks | random updates, relations | Prometheus, InfluxDB, TimescaleDB |
| Graph | nodes + edges | ACID (Neo4j) | mostly vertical, hard to shard | multi-hop traversal | social graph, fraud rings, recommendations | simple CRUD, aggregates | Neo4j, Neptune |
| Vector | embeddings + metadata | eventual (most) | horizontal | ANN similarity search | semantic search, RAG, recommendations | exact match / transactions | Pinecone, Milvus, pgvector, Qdrant |
| Columnar / OLAP | column-wise storage | batch / eventual | horizontal, MPP | huge scans + aggregates | analytics, dashboards, BI | point lookups, frequent updates | ClickHouse, BigQuery, Snowflake, Redshift |
| NewSQL | relational, auto-sharded | strong, serializable | horizontal + multi-region | full SQL | global payments, multi-region ACID | small apps, low-latency simple KV | CockroachDB, Spanner, YugabyteDB, TiDB |
| Object storage | bucket + key → blob | strong read-after-write (S3) | practically unlimited | key/prefix only | images, video, backups, data lake | small updatable records | S3, GCS, Azure Blob, MinIO |

## ⭐ Choosing a DB

### Q: SQL vs NoSQL kaise choose karoge?
Access pattern aur consistency se. Relations, transactions, ad-hoc queries chahiye (orders, payments) → SQL. Bahut high write scale, simple key-based access, flexible schema (chat messages, events) → NoSQL. Default Postgres bolo, aur NoSQL tab jab koi specific reason ho. Detail: [Choosing a Database](01-choosing-a-database.md).

### Q: Ek system me ek hi DB hona chahiye?
Nahi, **polyglot persistence** normal hai. Swiggy: orders Postgres, menu search Elasticsearch, session/cart Redis, rider location Redis GEO, analytics ClickHouse, photos S3. Source of truth ek rakho, baaki CDC se sync.

### Q: Payment system ke liye kaunsa DB?
Relational (Postgres/MySQL) ya multi-region chahiye to Spanner/CockroachDB. Kyunki ACID, double-entry ledger, unique constraint se idempotency key, aur audit queries. Eventually consistent store ledger ke liye galat jawab hai.

### Q: Chat messages (WhatsApp) ke liye kaunsa DB?
Cassandra/ScyllaDB (ya HBase). Write-heavy, `chat_id` partition key, `message_id` (time-based) clustering DESC, "last 50 messages" ek partition ka sequential read. Joins/transactions ki zarurat nahi.

### Q: Product catalog ke liye?
Document DB (MongoDB) achha fit: har category ke alag attributes (phone ka RAM, kurta ka size). Search ke liye saath me Elasticsearch. Price/stock jo transactional hai woh relational me bhi rakh sakte ho.

### Q: Leaderboard ke liye?
Redis Sorted Set: `ZINCRBY` score update, `ZREVRANGE 0 9` top 10, `ZREVRANK` user ka rank, sab O(log n). Durable copy DB me, Redis read path ke liye. Bahut bade scale pe sharded sorted sets ya approximate ranks.

### Q: Design the schema: URL shortener
`urls(short_code PK, long_url, user_id, created_at, expires_at)`. Lookup sirf `short_code` se, isliye KV ya DynamoDB bhi perfect. `short_code` base62 of unique ID. Hot codes Redis me cache. Analytics clicks alag table/stream me. Detail: [URL Shortener](../02-questions/t1-01-url-shortener.md).

## ⭐ SQL & Transactions

### Q: ACID kya hai?
**Atomicity:** sab ya kuch nahi (undo/WAL). **Consistency:** constraints kabhi nahi tootenge. **Isolation:** concurrent transactions ek dusre ko galat state nahi dikhate (MVCC/locks). **Durability:** commit ke baad crash pe bhi data (WAL fsync). Detail: [Transactions & ACID](03-transactions-acid.md).

### Q: Isolation levels aur unke anomalies?
Read Uncommitted (dirty read), Read Committed (non-repeatable read; Postgres default), Repeatable Read (phantoms SQL standard me; MySQL InnoDB default, Postgres me snapshot), Serializable (koi anomaly nahi). Level badhao to correctness badhti hai, throughput/retries ka cost.

### Q: MVCC kya hai?
Har update row ka naya version banata hai, readers purana consistent snapshot padhte hain. Isliye readers writers ko block nahi karte. Postgres me purane versions VACUUM saaf karta hai; MySQL undo log se purana version banata hai.

### Q: Optimistic vs pessimistic locking?
Pessimistic: `SELECT ... FOR UPDATE`, row lock, high contention ke liye (last 10 seats). Optimistic: `version` column, `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`, 0 rows updated to retry. Low contention ke liye. Detail: [Locks](../01-topics/09-locks-and-contention.md).

### Q: Double booking kaise rokoge (BookMyShow)?
```sql
UPDATE seats SET status = 'HELD', held_by = :user, held_until = now() + interval '10 min'
WHERE show_id = :show AND seat_no = :seat
  AND (status = 'FREE' OR held_until < now());
-- 1 row updated = mila, 0 = kisi aur ne le liya
```
Saath me `UNIQUE (show_id, seat_no)` bookings table pe, last safety net.

### Q: WAL kya hai?
Write-Ahead Log: data page badalne se pehle change sequential log me fsync hota hai. Crash pe log replay karke recover. Yahi log replication (streaming) aur PITR ka base hai.

### Q: Normalization vs denormalization?
Normalization (3NF): duplicate data nahi, updates safe, par joins zyada. Denormalization: read fast, par duplicate update karna padta. OLTP me normalize, hot read paths aur analytics me denormalize (ya materialized view).

### Q: SQL: second highest salary
```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
-- Nth highest (duplicates ko ek maan ke)
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;
```

### Q: SQL: har department ke top 3 earners
```sql
SELECT * FROM (
  SELECT e.*, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees e
) t WHERE rnk <= 3;
```
`ROW_NUMBER` ties tod deta hai, `RANK` gaps chhodta hai (1,1,3), `DENSE_RANK` gaps nahi (1,1,2).

### Q: SQL: duplicate emails dhoondho aur delete karo (lowest id rakho)
```sql
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

DELETE FROM users u USING users d
WHERE u.email = d.email AND u.id > d.id;   -- Postgres
```

### Q: SQL: customers jinhone kabhi order nahi kiya
```sql
SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
-- ya NOT EXISTS (NOT IN NULL ke saath galat result deta hai)
```

### Q: SQL: har user ka running total aur month-wise revenue
```sql
SELECT user_id, created_at, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total
FROM orders;

SELECT date_trunc('month', created_at) AS month, SUM(amount)
FROM orders GROUP BY 1 ORDER BY 1;
```

### Q: Design the schema: BookMyShow
`movies`, `theatres`, `screens(theatre_id)`, `seats(screen_id, seat_no, type)`, `shows(movie_id, screen_id, starts_at)`, `show_seats(show_id, seat_id, status, price, held_until, booking_id)` with `UNIQUE(show_id, seat_id)`, `bookings(id, user_id, show_id, status, amount, idempotency_key UNIQUE)`. Seat lock `show_seats` pe conditional UPDATE se. Detail: [BookMyShow](../02-questions/t1-05-bookmyshow.md).

## ⭐ Indexes

### Q: Index kaise kaam karta hai, B-tree kyun?
B+tree sorted keys rakhta hai, high fan-out (har node me sau keys), isliye 3–4 levels me crore rows. Equality, range, `ORDER BY` sab O(log n). Leaf nodes linked hain, range scan fast. Detail: [Indexes](04-indexes.md).

### Q: Composite index `(a, b, c)` kin queries pe chalega?
Leftmost prefix rule: `a`, `a,b`, `a,b,c` pe haan; sirf `b` ya `c` pe nahi. `WHERE a = ? AND b > ? ORDER BY b` chalega. Equality columns pehle, range column last.

### Q: Covering index kya hai?
Index me query ke saare columns hain, isliye table (heap) padhni hi nahi padti: index-only scan. Postgres `CREATE INDEX ... (user_id) INCLUDE (status, amount)`.

### Q: Index hamesha achha kyun nahi?
Har index har write pe update hota hai (write slow), disk/memory leta hai. Low selectivity column (`gender`) pe planner use hi nahi karega. Sirf real query patterns ke liye banao, `EXPLAIN ANALYZE` se verify.

### Q: Index hone ke baad bhi query slow, kyun?
Column pe function (`WHERE lower(email) = ...` bina expression index), implicit type cast, leading `%` wala `LIKE '%abc'`, `OR` conditions, galat column order, ya stale statistics (`ANALYZE`). `EXPLAIN ANALYZE` me Seq Scan dekho.

### Q: B-tree vs LSM tree?
B-tree: in-place updates, reads fast, random writes (Postgres, MySQL). LSM: writes memtable + sequential SSTables, background compaction; writes bahut fast, reads ko kai files dekhni padti (bloom filters help). Cassandra, RocksDB, ScyllaDB LSM use karte hain.

### Q: Clustered vs non-clustered index?
Clustered: table data khud index order me stored (MySQL InnoDB ka primary key), ek hi ho sakta hai. Non-clustered: alag structure jo row ka pointer/PK rakhta hai. InnoDB secondary index → PK → row, isliye chhota PK rakho.

## NoSQL (KV, Document, Wide-column)

### Q: Redis itna fast kyun hai?
In-memory, single-threaded command execution (no locks), efficient data structures, I/O multiplexing (epoll). ~100k+ ops/sec ek node pe. Persistence RDB snapshot ya AOF se, par primary use cache/ephemeral state. Detail: [Key-Value](05-key-value.md).

### Q: Redis me rate limiter kaise?
Fixed window: `INCR rl:user:42:202610031200` + `EXPIRE 60`; count > limit to reject. Sliding window: sorted set me timestamps, `ZREMRANGEBYSCORE` purane hatao, `ZCARD` count. Atomic rakhne ke liye Lua script. Detail: [Rate Limiter](../02-questions/t1-02-rate-limiter.md).

### Q: DynamoDB me partition key aur sort key?
Partition key hash hoke partition decide karti hai; sort key partition ke andar order deti hai, range queries (`begins_with`, `between`). Access patterns pehle likho, phir keys. GSI se dusre access pattern, single-table design me `PK = USER#42`, `SK = ORDER#2026-10-03`.

### Q: MongoDB me embed vs reference?
Embed jab data saath padha jaata hai aur bounded hai (order ke line items). Reference jab unbounded grow kare (post ke lakhs comments) ya alag se update/query ho. 16 MB document limit yaad rakho. Detail: [Document](06-document.md).

### Q: Cassandra ka write path?
Commit log (sequential, durability) → memtable (memory) → ack. Memtable full → immutable SSTable flush. Background compaction SSTables merge karta hai. Isliye writes bahut fast; deletes tombstones hain. Detail: [Wide-column](07-wide-column.md).

### Q: Cassandra me tunable consistency?
Replication factor N=3. Write `QUORUM` (2) + read `QUORUM` (2) → `W + R > N`, strong-ish reads. `ONE` fast par stale ho sakta hai. Multi-DC me `LOCAL_QUORUM` taaki cross-region latency na lage.

### Q: Design the schema: WhatsApp messages in Cassandra
```sql
CREATE TABLE messages (
  chat_id    uuid,
  bucket     int,          -- month bucket, partition ko bounded rakhne ke liye
  message_id timeuuid,
  sender_id  uuid,
  body       text,
  PRIMARY KEY ((chat_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```
"Latest 50 messages" = ek partition, sorted read. Bucket se mega-groups ki partitions unbounded nahi hoti.

## ⭐ Scaling & Replication

### Q: Read replicas ki problem kya hai?
Replication lag: user ne likha aur turant replica se padha to purana data (read-your-writes toota). Fix: apni writes ke baad thodi der primary se padho, ya LSN track karo. Replicas writes scale nahi karte. Detail: [Scaling Databases](14-scaling-databases.md).

### Q: Partitioning vs sharding?
Partitioning: ek DB ke andar table ko parts me (Postgres `PARTITION BY RANGE`), same server, transactions normal. Sharding: data alag servers pe, writes scale hote hain par cross-shard joins/transactions mushkil. Pehle partitioning, phir sharding.

### Q: Achhi shard key kaisi hoti hai?
High cardinality, even distribution, aur main query single-shard rahe. `user_id` / `tenant_id` common. Monotonic keys (timestamp) range sharding me hotspot banate hain. Detail: [Sharding](../01-topics/04-sharding-consistent-hashing.md).

### Q: Consistent hashing kyun?
`hash % N` me N badla to almost saari keys move. Ring pe sirf ~1/N keys move hoti hain, virtual nodes se load even. DynamoDB, Cassandra, Memcached clients isi pe.

### Q: Hot partition ka fix?
Salting (`key#0..9`, reads merge), hot range split, cache in front, write aggregation (Redis me counter jodo, batch flush), celebrity ko dedicated shard. Pehle detect karo: per-partition metrics.

### Q: CAP theorem simple me?
Network partition (P) hoga hi; tab choose karo Consistency (error/wait, CP: Spanner, HBase) ya Availability (purana data de do, AP: Cassandra, DynamoDB default). PACELC: partition na ho tab bhi Latency vs Consistency ka trade-off. Detail: [CAP](../01-topics/06-cap-consistency.md).

### Q: Single-leader vs multi-leader vs leaderless?
Single-leader: simple, no conflicts, write scale limited. Multi-leader: har region me writes, conflicts resolve karne padte (LWW/CRDT). Leaderless: quorum W + R > N, high availability, read repair/hinted handoff (Cassandra, Dynamo).

### Q: Do services ke DB me ek saath update kaise (distributed transaction)?
2PC avoid karo (blocking, coordinator SPOF). **Saga**: local transactions + compensating actions, aur **transactional outbox** (business row + event ek hi local transaction me, relay Kafka pe bhejta hai). Consumers idempotent. Detail: [Distributed Transactions](../01-topics/16-distributed-transactions.md).

## Specialised DBs (search, time-series, graph, vector, OLAP)

### Q: Elasticsearch fast full-text search kaise karta hai?
**Inverted index**: term → documents list. Text analyzer (tokenize, lowercase, stemming) se terms bante hain, BM25 se scoring. Shards me parallel search, results merge. Near real-time: refresh ~1 sec. Detail: [Search](08-search.md).

### Q: Elasticsearch ko primary DB kyun nahi?
Transactions nahi, refresh ki wajah se turant read nahi, mapping change pe reindex, split-brain/data loss history. Source of truth Postgres, ES me CDC se sync. Detail: [Search Indexing](../01-topics/14-search-indexing.md).

### Q: Time-series DB normal DB se alag kyun?
Data append-only, time-ordered, aur queries time windows pe. Isliye time-based partitioning (chunks), heavy compression (delta, Gorilla), retention policies, downsampling. Prometheus, TimescaleDB, InfluxDB. Detail: [Time-series](09-time-series.md).

### Q: Graph DB kab?
Jab query multi-hop relations ki ho: "friends of friends jo Bangalore me hain", fraud rings (same device/card shared). SQL me har hop ek self-join, depth badhte hi slow. Neo4j me index-free adjacency, Cypher: `MATCH (u)-[:FRIEND*2]->(f)`. Detail: [Graph](10-graph.md).

### Q: Vector DB aur HNSW?
Embeddings (e.g. 1536-dim) store karta hai aur approximate nearest neighbour search deta hai. HNSW: multi-layer graph, upar sparse layers se jump, neeche dense me refine; recall vs speed `ef` se tune. RAG/semantic search me use. Chhote scale pe pgvector kaafi. Detail: [Vector](11-vector.md).

### Q: OLTP vs OLAP, columnar fast kyun?
OLTP: chhoti transactions, row lookups (Postgres). OLAP: crore rows scan karke aggregates (ClickHouse, BigQuery). Columnar me sirf zaroori columns padhe jaate hain, same type ka data compress bahut hota hai, vectorized execution. Point updates me weak. Detail: [Columnar / OLAP](12-columnar-olap.md).

### Q: Ad click aggregation ke liye store?
Clicks Kafka me, stream processing (Flink) se per-minute aggregates, aggregates ClickHouse/Druid (OLAP) me dashboards ke liye, raw clicks S3 pe reconciliation ke liye. Detail: [Ad Click Aggregator](../02-questions/t2-17-ad-click-aggregator.md).

### Q: NewSQL kab?
Jab ACID + horizontal write scale + multi-region chahiye (global payments, inventory). Cost: har write pe consensus latency (single region ~5–10 ms, cross-region 100 ms+). Normal app ke liye Postgres hi. Detail: [NewSQL](13-newsql.md).

## Checklist

- [ ] Saare DB types ka comparison table (model, consistency, scale, best for) yaad se bol sakta hoon
- [ ] Payment, chat, catalog, leaderboard, search ke liye DB choice ek line ke reason ke saath de sakta hoon
- [ ] ACID, isolation levels aur MVCC crisp bata sakta hoon
- [ ] Second highest salary, top-N per group, duplicates delete, anti-join wali SQL bina dekhe likh sakta hoon
- [ ] Composite index leftmost prefix, covering index aur B-tree vs LSM samjha sakta hoon
- [ ] BookMyShow (SQL) aur WhatsApp (Cassandra) ka schema design kar sakta hoon
- [ ] Replication lag, sharding key, consistent hashing aur hot partitions pe jawab de sakta hoon
- [ ] Search, time-series, graph, vector, OLAP DB kab use karne hain bata sakta hoon
