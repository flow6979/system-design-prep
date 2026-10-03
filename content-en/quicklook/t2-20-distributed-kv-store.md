**In one line:** A Dynamo-style leaderless ring: consistent hashing + vnodes, N=3, tunable quorum, gossip, hinted handoff, Merkle repair, LSM storage.

- **Requirements:** put/get, durable, survives machine failures, single-digit ms latency.
- **Scale:** 100 TB x RF 3 = 300 TB, ~150 nodes, 1M QPS (~15K ops/sec/node); node failure is a daily event.
- **Components:** ring (~256 vnodes/node), coordinator, replicas across racks, gossip, LSM (WAL, memtable, SSTable, bloom filter).
- **Consistent hashing + vnodes over hash mod N:** only ~1/N of data moves; no range scans.
- **Leaderless N=3 over Raft leader:** write availability; no linearizability.
- **Tunable quorum:** R + W > N gives latest read (not with sloppy quorum); ALL is slow, ONE can be stale.
- **LWW default, vector clocks for critical data:** simplicity vs merge burden.
- **Gossip over ZooKeeper heartbeats:** decentralized, no SPOF.
- **Merkle anti-entropy over full compare:** syncs only differing ranges.
- **LSM over B-tree:** sequential writes; cost is compaction IO.
- **Senior signal:** QUORUM is not strong (sloppy quorum + LWW); if repair misses gc_grace, deleted data resurrects.

**Say in the interview:** "Failure is daily, so detection, hinted handoff, read repair and Merkle repair are built in. Default is AP, with R/W quorum tuned per use case."

**Avoid:** Calling QUORUM strong consistency; ignoring repair lag (tombstones come back).
