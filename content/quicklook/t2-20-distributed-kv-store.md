**Ek line:** Dynamo-style leaderless ring: consistent hashing + vnodes, N=3, tunable quorum, gossip, hinted handoff, Merkle repair, LSM storage.

- **Requirements:** put/get, durable, machine gire to bhi chale, single-digit ms latency.
- **Scale:** 100 TB x RF 3 = 300 TB, ~150 nodes, 1M QPS (~15K ops/sec/node); node failure roz ka case.
- **Components:** ring (~256 vnodes/node), coordinator, replicas across racks, gossip, LSM (WAL, memtable, SSTable, bloom filter).
- **Consistent hashing + vnodes over hash mod N:** ~1/N data move; range scans nahi milte.
- **Leaderless N=3 over Raft leader:** write availability; no linearizability.
- **Tunable quorum:** R + W > N = latest read (sloppy quorum me nahi); ALL slow, ONE stale.
- **LWW default, vector clocks for critical data:** simple vs merge burden.
- **Gossip over ZooKeeper heartbeat:** decentralized, no SPOF.
- **Merkle anti-entropy over full compare:** sirf alag ranges sync.
- **LSM over B-tree:** sequential writes, compaction IO ka cost.
- **Senior signal:** QUORUM strong nahi (sloppy quorum + LWW); repair gc_grace ke andar nahi chala to deleted data wapas aata hai.

**Interview me bolo:** "Failure daily hai, isliye detection, hinted handoff, read repair aur Merkle repair built-in hain. Default AP, aur R/W quorum per use case tune hota hai."

**Galti mat karna:** QUORUM ko strong consistency mat bolo; repair lag ko ignore mat karo (tombstones wapas aate hain).
