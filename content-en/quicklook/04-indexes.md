**In one line:** An index turns O(n) lookups into O(log n) but costs writes, RAM, and disk; build it for real query patterns.

- **B+tree:** fan-out ~500 gives height 3-4; linked leaves make range scans fast; lookup is O(log n), not O(1).
- **Hash index:** equality only, no range/sort; a B-tree is usually fine.
- **LSM-tree:** memtable + log, flushed to immutable SSTables, background compaction; sequential writes make it fast.
- **LSM cost:** slower reads, compaction spikes, delete = tombstone; space is freed after compaction.
- **B-tree vs LSM:** reads/transactions = B+tree (Postgres); write-heavy chat = LSM (Cassandra).
- **Composite (a,b,c):** leftmost-prefix rule; equality columns, then sort, then range.
- **Covering index:** all needed columns in the index gives an index-only scan; avoid wide columns.
- **Partial/expression:** use an expression index for `lower(email)`; a function hides the column from a plain index.
- **Unique index:** enforce uniqueness in the DB, not with app-side SELECT-then-INSERT.
- **Clustered:** InnoDB stores rows in PK order; a UUID PK means page splits and repeats in every secondary index.
- **Not every column:** each write updates all indexes; low selectivity makes the planner pick a seq scan.
- **Production index:** Postgres `CREATE INDEX CONCURRENTLY`, then `EXPLAIN`.

**Say in the interview:** "I'd measure with EXPLAIN ANALYZE, add a composite index (equality, sort, range, include), verify the new plan, and check the write cost."

**Avoid:** Plain `CREATE INDEX` on a busy Postgres table, or expecting an `(a,b)` index to serve a filter on `b` alone.
