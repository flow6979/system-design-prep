**Ek line:** Network partition pe system ko chunna padta hai: consistency (sabko latest data) ya availability (har request ka jawab, thoda stale).

- **P mandatory:** partition real hai, asli choice partition ke time C ya A.
- **CP:** requests reject/wait par galat data nahi. Postgres single leader, Spanner, ZooKeeper, etcd.
- **AP:** jawab hamesha, stale ho sakta hai. Cassandra, DynamoDB default, DNS, CDN.
- **PACELC:** normal time pe bhi latency vs consistency trade-off.
- **Levels:** strong → read-your-writes → monotonic → causal → eventual.
- **Quorum:** N replicas, W writes, R reads; **R + W > N** to latest value milti hai. N=3, W=2, R=2 balanced.
- **Payments, ledger, booking path:** CP/strong (double charge/booking nahi).
- **Feed, likes, views, cart:** AP/eventual.
- **Chat:** AP + per-chat ordering.
- **Leader election, config:** CP (etcd, ZooKeeper).
- **Per-feature choice:** BookMyShow me search eventual, booking strong.

**Interview me bolo:** "Booking path pe consistency chunta hoon, double booking ka cost downtime se zyada hai. Search/browse pe availability, eventual chalega. Cassandra N=3, critical ops QUORUM."

**Galti mat karna:** "CA system banayenge" bolna. CAP ka C aur ACID ka C mix karna, ya poore system ke liye ek hi level bolna.
