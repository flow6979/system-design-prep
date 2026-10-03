**Ek line:** Wide-column (Cassandra/Scylla) masterless LSM store hai: query-first modeling, partition key se distribute, massive writes, tunable consistency.

- **Keys:** partition key = data kis node pe; clustering key = partition ke andar order.
- **Query-first:** pehle queries likho, har query ke liye ek denormalized table; joins nahi.
- **Bucket:** partition bounded rakhne ke liye time bucket (jaise `chat_id + month`).
- **Ring:** Murmur3 token, vnodes; masterless to koi single point of failure nahi.
- **Tunable consistency:** RF = copies; `QUORUM` + `QUORUM` = read-your-writes; multi-DC me `LOCAL_QUORUM`.
- **Write fast kyun:** commit log append + memtable, no read-before-write; baad me SSTable flush.
- **Tombstones:** delete marker `gc_grace_seconds` (10 din) baad compaction me hatta hai; queue pattern mat banao.
- **LWT:** `IF NOT EXISTS` Paxos hai, mehenga; sirf signup jaise rare paths pe.
- **ScyllaDB:** C++ rewrite, same CQL, stable p99; bad partition key fix nahi karta.
- **HBase/Bigtable:** master-based, row-sorted, strong per row; timestamp prefix row key = hotspot.
- **Cassandra vs DynamoDB:** DynamoDB managed/zero ops; Cassandra huge scale, multi-cloud, cost control.

**Interview me bolo:** "Query hamesha `chat_id` pe hai, to partition key `chat_id`, clustering `message_time desc`, aur partition bounded rakhne ke liye bucket."

**Galti mat karna:** Low-cardinality partition key, `ALLOW FILTERING`, ya read-heavy workload Cassandra pe daalna.
