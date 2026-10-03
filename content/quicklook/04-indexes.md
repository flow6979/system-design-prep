**Ek line:** Index lookup ko O(n) se O(log n) banata hai, par writes, RAM aur disk ki cost leta hai; query pattern ke hisaab se banao.

- **B+tree:** fan-out ~500 se height 3-4; leaves linked hain to range scan fast; lookup O(log n), O(1) nahi.
- **Hash index:** sirf equality, range/sort nahi; aksar B-tree hi theek hai.
- **LSM-tree:** memtable + log, phir immutable SSTables, background compaction; writes sequential isliye fast.
- **LSM cost:** reads, compaction spikes, delete = tombstone; space compaction ke baad free hota hai.
- **B-tree vs LSM:** read/transactions = B+tree (Postgres); write-heavy chat = LSM (Cassandra).
- **Composite (a,b,c):** leftmost prefix rule; equality columns, phir sort, phir range.
- **Covering index:** sab columns index me, to index-only scan; wide columns mat daalo.
- **Partial/expression:** `lower(email)` query ke liye expression index; function column ko plain index se chhupa deta hai.
- **Unique index:** uniqueness DB se enforce karo, app me SELECT-then-INSERT se nahi.
- **Clustered:** InnoDB me rows PK order me; UUID PK = page splits + har secondary index me repeat.
- **Har column pe nahi:** har write sab indexes update karta hai; low selectivity pe planner seq scan chunta hai.
- **Production index:** Postgres `CREATE INDEX CONCURRENTLY`, phir `EXPLAIN`.

**Interview me bolo:** "Pehle EXPLAIN ANALYZE se measure, phir composite index (equality, sort, range, include), naya plan verify, aur write cost check."

**Galti mat karna:** Busy Postgres table pe plain `CREATE INDEX`, ya `(a,b)` index se sirf `b` filter ki umeed.
