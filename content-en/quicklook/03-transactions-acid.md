**In one line:** A transaction is a multi-statement unit that is all-or-nothing; correctness comes from ACID, isolation levels, and locks.

- **ACID:** Atomicity, Consistency, Isolation, Durability; invariants come from app logic and transactions together.
- **Durability:** WAL is fsynced before the commit ack; replayed after a crash; a sync replica survives node loss.
- **Boundary:** in every write flow, say where the transaction starts and ends.
- **Isolation default:** Read Committed; `FOR UPDATE` or atomic UPDATE on critical paths; Serializable + retry for key invariants.
- **RR myth:** Repeatable Read does not stop write skew; only Serializable does.
- **MVCC:** every update creates a new row version; readers don't block writers, but writes still take row locks.
- **Long transaction:** blocks vacuum, causes bloat and ID wraparound risk.
- **Check-then-act:** unlocked `SELECT` then `UPDATE` = lost update; use `FOR UPDATE` or `UPDATE ... WHERE stock > 0`.
- **Flash sale:** gate with Redis `DECR`, then an atomic UPDATE in the DB.
- **Deadlock:** a cycle; DB aborts one; retry the whole transaction.
- **Microservices:** local ACID + saga + outbox + idempotency; 2PC is rare.

**Say in the interview:** "Read Committed by default, row locks or atomic UPDATE on critical paths, and saga plus outbox across services."

**Avoid:** Making a network/payment call inside a transaction, or flatly saying "NoSQL has no transactions".
