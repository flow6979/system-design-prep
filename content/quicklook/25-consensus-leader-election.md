**Ek line:** Consensus = machines crash/partition ke baad bhi ek value ya ek leader pe agree karna; Raft/etcd/ZooKeeper use karo, apna mat likho.

- **Quorum:** f failures ke liye 2f+1 nodes, majority f+1; do majorities overlap karti hain.
- **Nodes:** 3 → 1 fail, 5 → 2 fail; 4 ka fayda nahi. Odd rakho; zyada nodes = writes slow.
- **Raft roles:** Follower, Candidate, Leader; time terms me, term me max ek leader.
- **Election:** heartbeat ~50–100 ms; randomized timeout 150–300 ms pe candidate; ek term me ek vote; majority = leader.
- **Log:** entry majority me aaye to committed; committed data kabhi nahi khota.
- **Paxos:** same guarantees, samajhna mushkil; interview me Raft explain karo.
- **ZK/etcd primitives:** ephemeral node, sequential node, lease (TTL + renew), watch.
- **DB lease:** chhote system me row renew har 3 sec; DB SPOF, clock skew.
- **Split brain:** quorum minority ko rokta hai; purane leader (GC pause) ke liye **fencing token** (Raft term, zxid); storage purana token reject kare.
- **Gossip:** membership/failure detection (Cassandra), O(log N) rounds, eventually consistent; strong agreement ke liye nahi.
- **Use:** K8s etcd, Kafka KRaft, CockroachDB/TiDB Raft per range, Spanner Paxos.

**Interview me bolo:** "Scheduler ke 3 replicas, trigger sirf leader; leader election etcd lease se, har few sec renew. Har write ke saath fencing token taaki GC se jaaga purana leader kuch na bigaade. Replication Raft: 5 nodes, majority 3."

**Galti mat karna:** 2 ya 4 node cluster, ya heartbeat se leader maanna bina quorum ke. Lease bina fencing token, ya membership bhi consensus se.
