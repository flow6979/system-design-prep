**In one line:** Consensus = agreeing on one value or one leader despite crashes and partitions; use Raft/etcd/ZooKeeper, don't write your own.

- **Quorum:** tolerate f failures with 2f+1 nodes, majority f+1; any two majorities overlap.
- **Nodes:** 3 → 1 failure, 5 → 2 failures; 4 gains nothing. Keep it odd; more nodes = slower writes.
- **Raft roles:** Follower, Candidate, Leader; time is split into terms, at most one leader per term.
- **Election:** heartbeat ~50–100 ms; randomized timeout 150–300 ms triggers candidacy; one vote per term; majority wins.
- **Log:** an entry is committed once on a majority; committed data is never lost.
- **Paxos:** same guarantees, harder to grasp; explain Raft in interviews.
- **ZK/etcd primitives:** ephemeral node, sequential node, lease (TTL + renew), watch.
- **DB lease:** for small systems, renew a row every 3 sec; the DB is a SPOF and clock skew matters.
- **Split brain:** quorum blocks the minority side; for a stale leader (GC pause) use a **fencing token** (Raft term, zxid); storage rejects older tokens.
- **Gossip:** membership/failure detection (Cassandra), O(log N) rounds, eventually consistent; not for strong agreement.
- **Used in:** K8s etcd, Kafka KRaft, CockroachDB/TiDB Raft per range, Spanner Paxos.

**Say in the interview:** "Three scheduler replicas, only the leader triggers; election via an etcd lease renewed every few seconds. A fencing token goes with every write so a stale leader waking from GC can't corrupt anything. Replication via Raft: 5 nodes, majority 3."

**Avoid:** A 2- or 4-node cluster, or electing a leader on heartbeats without quorum. A lease with no fencing token, or running membership through consensus.
