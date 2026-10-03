**In one line:** Indexes make reads fast (no full scan); replication keeps copies so reads scale and one dead machine does not lose data.

- **B-tree:** the default, point and range queries. Read-optimized, updated on every write.
- **LSM tree:** write-optimized (memtable → SSTables, compaction). Bloom filters help reads. Cassandra, RocksDB.
- **Hash index:** exact match only, O(1).
- **Index cost:** slower writes, extra storage. Index only WHERE/ORDER BY columns.
- **Composite index:** leftmost prefix rule. Equality columns first, range/sort last.
- **Sync vs async:** sync = no loss but slow; async = fast but last writes can be lost. Middle ground: semi-sync.
- **Multi-leader:** low global write latency, but write conflicts (LWW, CRDT, app merge).
- **Replication lag:** for read-your-writes, route recent writers to the leader. Critical reads (balance, booking) always go to the leader.
- **Monotonic reads:** pin a user to one replica.
- **Failover:** heartbeat timeout → promote the most up-to-date follower. Risks: data loss, split brain (fencing token/epoch).
- **Timeout:** short = false failovers, long = long downtime.

**Say in the interview:** "Postgres leader-follower, writes to the leader, reads on 2–3 replicas. Read-your-writes from the leader to handle lag. Patroni/RDS Multi-AZ failover with a semi-sync replica so we don't lose data."

**Avoid:** Indexing every column, or putting the range column first. Mentioning replicas without lag, or reading payment status from a replica.
