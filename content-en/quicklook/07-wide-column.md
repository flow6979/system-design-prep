**In one line:** Wide-column stores (Cassandra/Scylla) are masterless LSM stores: query-first modeling, distribution by partition key, massive writes, tunable consistency.

- **Keys:** partition key = which node holds the data; clustering key = order inside the partition.
- **Query-first:** list queries first, one denormalized table per query; no joins.
- **Bucket:** use a time bucket (like `chat_id + month`) to keep partitions bounded.
- **Ring:** Murmur3 token, vnodes; masterless, so no single point of failure.
- **Tunable consistency:** RF = copies; `QUORUM` + `QUORUM` gives read-your-writes; `LOCAL_QUORUM` across DCs.
- **Why writes are fast:** commit log append + memtable, no read-before-write; SSTable flush later.
- **Tombstones:** delete marker is purged at compaction after `gc_grace_seconds` (10 days); avoid queue patterns.
- **LWT:** `IF NOT EXISTS` is Paxos and costly; use on rare paths like signup.
- **ScyllaDB:** C++ rewrite, same CQL, stable p99; doesn't fix a bad partition key.
- **HBase/Bigtable:** master-based, row-sorted, strong per row; a timestamp-prefixed row key is a hotspot.
- **Cassandra vs DynamoDB:** DynamoDB is managed/zero ops; Cassandra for huge scale, multi-cloud, cost control.

**Say in the interview:** "The query is always by `chat_id`, so partition key `chat_id`, clustering `message_time desc`, with a bucket to bound partition size."

**Avoid:** A low-cardinality partition key, `ALLOW FILTERING`, or putting a read-heavy workload on Cassandra.
