**Ek line:** NewSQL (Spanner, CockroachDB, TiDB, Yugabyte) SQL + ACID ke saath horizontal scale deta hai, Raft consensus ki latency cost par.

- **Problem:** single-node SQL me scale limit; NoSQL me weak transactions; NewSQL dono chahta hai.
- **CAP:** CP side; partition me minority side writes reject karta hai, data galat nahi.
- **Kaise:** key-range chunks, har ek 3/5 replicas pe Raft, multi-range transaction pe 2PC jaisa protocol.
- **Latency:** write = nearest majority tak round trip; ~5-10 ms single region, ~100 ms+ cross-region.
- **Spanner:** TrueTime se external consistency; atomic clocks uncertainty bounded rakhte hain.
- **Hotspot:** monotonic PK (timestamp, `SERIAL`) = ek range hot; UUID ya hash-sharded index.
- **CockroachDB:** Postgres wire protocol, SERIALIZABLE default, isliye app me retry loop.
- **NTP:** 100+ ms drift ho sakta hai; Cockroach offset limit pe node band kar deta hai.
- **YugabyteDB:** Postgres query layer + DocDB tablets Raft se.
- **Vitess/TiDB:** Vitess sharding layer hai (MySQL rehta hai), NewSQL nahi.
- **Kab:** global scale + strong consistency chahiye; warna Postgres + replicas + sharding.

**Interview me bolo:** "NewSQL CP hai: Raft consensus se strong consistency milti hai, par write latency badhti hai, isliye home region pin karte hain."

**Galti mat karna:** NewSQL ko Postgres jitna fast ya "magic" bolna, ya auto-increment primary key rakhna.
