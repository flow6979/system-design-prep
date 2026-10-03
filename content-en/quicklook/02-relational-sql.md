**In one line:** Relational DB = tables + keys + SQL, the default choice in system design; start with Postgres and keep the SQL patterns ready.

- **Keys:** PK is unique + NOT NULL; FK enforces referential integrity; M:N needs a junction table.
- **PK choice:** `BIGINT` on a single DB; UUIDv7/Snowflake when distributed, not random UUIDv4.
- **Normalization:** normalize by default, denormalize for specific read paths, and state the update path of the copy.
- **Joins:** put right-table filters of a LEFT JOIN in `ON`, not `WHERE` (it turns into INNER).
- **NOT IN vs NOT EXISTS:** one NULL in the subquery makes `NOT IN` return empty; use `NOT EXISTS`.
- **WHERE vs HAVING:** WHERE filters before grouping (can use index), HAVING after.
- **Money:** `NUMERIC` or integer paise; never FLOAT.
- **Postgres vs MySQL:** Postgres leads on features/correctness; in InnoDB the PK is the physical order.
- **Postgres bloat:** every UPDATE creates a new tuple; tune vacuum.
- **WAL:** commit only fsyncs the WAL, not data files; redo after a crash (the D in ACID).
- **Top N per group / 2nd highest:** window function (`DENSE_RANK`) + outer filter; `OFFSET 1` breaks on ties.

**Say in the interview:** "I'll start with Postgres, and shard by `user_id` once write throughput hits the limit."

**Avoid:** Designing sharding on day one, or using `SELECT *` and FLOAT for money.
