**In one line:** When data or writes outgrow one DB, split by key across shards; consistent hashing moves minimal data when shards are added or removed.

- **Why:** storage 10 TB+ or write throughput. Replicas don't scale writes.
- **Last resort:** try vertical scaling, replicas, cache, archiving first. Sharding adds big complexity.
- **Hash:** even spread, but range queries hit every shard and changing `% N` reshuffles everything.
- **Range:** fast range queries, but hot spots (today's date).
- **Directory:** full control, but the lookup is an extra hop and a SPOF.
- **Shard key:** high cardinality, even distribution, main query hits one shard. Chat = `chat_id`, orders = `user_id`.
- **Hot key:** key salting (`post#0..9`), cache, or a dedicated shard.
- **Resharding:** fixed logical shards (1024 mapped to 8 machines) or consistent hashing; double-write, backfill, verify, switch.
- **Consistent hashing:** ring, key goes to first node clockwise; adding a node moves ~1/N of data.
- **Virtual nodes:** 100–200 per server; evens load and spreads failure load across all nodes.
- **Cross-shard:** secondary index table, scatter-gather or analytics pipeline; keep 95% of queries single-shard.

**Say in the interview:** "Hash-shard messages by `chat_id`, using consistent hashing with vnodes so a new node moves only ~1/N of data. Key salting and cache for hot keys."

**Avoid:** Jumping to sharding when replicas and cache suffice, or `hash % N` with no resharding plan. Low-cardinality keys (`country`, `status`).
