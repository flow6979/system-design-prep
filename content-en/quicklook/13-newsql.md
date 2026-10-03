**In one line:** NewSQL (Spanner, CockroachDB, TiDB, Yugabyte) gives SQL + ACID with horizontal scale, at the latency cost of Raft consensus.

- **Problem:** single-node SQL has a scale limit; NoSQL has weak transactions; NewSQL wants both.
- **CAP:** CP side; during a partition the minority side rejects writes, data stays correct.
- **How:** key-range chunks, each replicated on 3/5 nodes via Raft, 2PC-like protocol for multi-range transactions.
- **Latency:** a write = round trip to the nearest majority; ~5-10 ms in one region, ~100 ms+ cross-region.
- **Spanner:** external consistency via TrueTime; atomic clocks keep uncertainty bounded.
- **Hotspot:** monotonic PK (timestamp, `SERIAL`) makes one range hot; use UUID or a hash-sharded index.
- **CockroachDB:** Postgres wire protocol, SERIALIZABLE by default, so the app needs a retry loop.
- **NTP:** can drift 100+ ms; Cockroach shuts a node down past the offset limit.
- **YugabyteDB:** Postgres query layer + DocDB tablets replicated via Raft.
- **Vitess/TiDB:** Vitess is a sharding layer (MySQL stays), not NewSQL.
- **When:** global scale + strong consistency; otherwise Postgres + replicas + sharding.

**Say in the interview:** "NewSQL is CP: Raft gives strong consistency but raises write latency, so we pin data to a home region."

**Avoid:** Calling NewSQL as fast as Postgres or "magic", or using an auto-increment primary key.
