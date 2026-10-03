**Ek line:** DB ko is order me scale karo: indexes + vertical, cache + read replicas, partitioning + archiving, service-wise split, last me sharding.

- **Pehle vertical:** ek modern machine ~10k-50k writes/sec aur kai TB le leti hai; sharding sabse aakhri step.
- **Read replicas:** sirf reads scale hote hain, writes ek primary pe; async = lag + last writes lost ka risk.
- **Lag fixes:** read-your-writes ke liye apni writes ke baad primary se padho ya LSN track karo; monotonic reads ke liye sticky replica.
- **Topologies:** leader-follower (simple), multi-leader (conflicts), leaderless (`W + R > N` quorum).
- **Sharding strategies:** range (hotspot), hash (even, scatter-gather), directory (flexible), geo (residency).
- **Shard key:** high cardinality, even, aur main query single-shard; monotonic key se bacho.
- **Resharding:** `hash % N` me almost sab keys move; consistent hashing ~1/N; fixed logical partitions (1024).
- **Hot partition:** salting (`key#0..9`), split, cache, write buffering, dedicated shard.
- **Connection pool:** chhota pool better (~cores x 2); PgBouncer transaction mode; pool 200 mat karo.
- **Partitioning vs sharding:** partitioning ek server, `DROP PARTITION` se purana data; query me partition key do.
- **Backup:** PITR = base backup + WAL; RPO/RTO bolo; Multi-AZ failover; split brain se bacho (fencing).

**Interview me bolo:** "Indexes aur vertical, phir cache aur replicas, partitioning aur archiving, service split, aur last me `customer_id` se sharding. Har step ka trigger metric se."

**Galti mat karna:** Sharding ko pehla step bolna, ya sharding ke baad joins, unique constraints aur global IDs ka plan na dena.
