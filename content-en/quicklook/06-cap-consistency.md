**In one line:** On a network partition a distributed system must choose consistency (everyone sees the latest data) or availability (every request answers, maybe stale).

- **P is mandatory:** partitions happen; the real choice is C or A during one.
- **CP:** reject/wait but never wrong data. Postgres single leader, Spanner, ZooKeeper, etcd.
- **AP:** always answer, possibly stale. Cassandra, DynamoDB default, DNS, CDN.
- **PACELC:** even without a partition there is a latency vs consistency trade-off.
- **Levels:** strong → read-your-writes → monotonic → causal → eventual.
- **Quorum:** N replicas, W writes, R reads; **R + W > N** gives the latest value. N=3, W=2, R=2 is balanced.
- **Payments, ledger, booking path:** CP/strong (no double charge or booking).
- **Feed, likes, views, cart:** AP/eventual.
- **Chat:** AP plus per-chat ordering.
- **Leader election, config:** CP (etcd, ZooKeeper).
- **Choose per feature:** BookMyShow search eventual, booking strong.

**Say in the interview:** "On the booking path I choose consistency, since double booking costs more than downtime. Search and browse are available with eventual consistency. Cassandra N=3, QUORUM for critical ops."

**Avoid:** Saying "we'll build a CA system". Mixing CAP's C with ACID's C, or naming one consistency level for the whole system.
