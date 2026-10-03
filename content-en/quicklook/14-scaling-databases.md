**In one line:** Scale a DB in this order: indexes + vertical, cache + read replicas, partitioning + archiving, per-service split, and sharding last.

- **Vertical first:** one modern machine handles ~10k-50k writes/sec and many TB; sharding is the last step.
- **Read replicas:** scale reads only, writes stay on one primary; async means lag and risk of losing the last writes.
- **Lag fixes:** for read-your-writes, read from the primary after own writes or track LSN; sticky replica for monotonic reads.
- **Topologies:** leader-follower (simple), multi-leader (conflicts), leaderless (`W + R > N` quorum).
- **Sharding strategies:** range (hotspot), hash (even, scatter-gather), directory (flexible), geo (residency).
- **Shard key:** high cardinality, even, and the main query stays single-shard; avoid monotonic keys.
- **Resharding:** `hash % N` moves almost every key; consistent hashing ~1/N; fixed logical partitions (1024).
- **Hot partition:** salting (`key#0..9`), split, cache, write buffering, dedicated shard.
- **Connection pool:** smaller is better (~cores x 2); PgBouncer transaction mode; don't set pool to 200.
- **Partitioning vs sharding:** partitioning is one server, `DROP PARTITION` removes old data; filter on the partition key.
- **Backup:** PITR = base backup + WAL; state RPO/RTO; Multi-AZ failover; prevent split brain (fencing).

**Say in the interview:** "Indexes and vertical first, then cache and replicas, partitioning and archiving, service split, and finally sharding by `customer_id`. Each step is triggered by a metric."

**Avoid:** Calling sharding the first step, or sharding without a plan for joins, unique constraints, and global IDs.
