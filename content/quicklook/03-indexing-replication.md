**Ek line:** Index se reads fast (full scan nahi), replication se copies bante hain taaki reads scale hon aur ek machine mare to data bache.

- **B-tree:** default, point + range query. Read-optimized, har write pe tree update.
- **LSM tree:** write-optimized (memtable → SSTables, compaction). Bloom filters reads ke liye. Cassandra, RocksDB.
- **Hash index:** sirf exact match, O(1).
- **Index cost:** writes slow, extra storage. Sirf WHERE/ORDER BY columns pe.
- **Composite index:** leftmost prefix rule. Equality columns pehle, range/sort last.
- **Sync vs async:** sync = no loss par slow; async = fast par last writes jaa sakte hain. Middle: semi-sync.
- **Multi-leader:** low write latency globally, par write conflicts (LWW, CRDT, app merge).
- **Replication lag:** read-your-writes ke liye recent writer ki reads leader se. Critical reads (balance, booking) hamesha leader.
- **Monotonic reads:** user ko same replica pe bhejo.
- **Failover:** heartbeat timeout → up-to-date follower promote. Risk: data loss, split brain (fencing token/epoch).
- **Timeout:** chhota = false failover, bada = lamba downtime.

**Interview me bolo:** "Postgres leader-follower, writes leader pe, reads 2–3 replicas pe. Lag ke liye read-your-writes leader se. Patroni/RDS Multi-AZ failover, semi-sync replica taaki data loss na ho."

**Galti mat karna:** Har column pe index, ya range column pehle rakhna. Replicas bolna par lag ka zikr na karna, payment status replica se padhna.
