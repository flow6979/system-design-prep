**Ek line:** Relations, transactions, strong consistency chahiye to SQL; massive scale, simple access pattern ya flexible schema chahiye to NoSQL.

- **SQL:** ACID, joins, fixed schema. Tuned Postgres ~10K+ writes/sec aur TBs sambhalta hai.
- **Key-value:** Redis, DynamoDB. Cache, sessions, counters, URL mapping.
- **Document:** MongoDB. Catalog, profile, flexible/nested schema.
- **Wide-column:** Cassandra. Write-heavy, time-ordered, chat. Table query ke hisaab se banti hai.
- **Graph:** Neo4j. Friends-of-friends, multi-hop traversal.
- **Payments, orders, bookings:** Postgres/MySQL (ACID, UNIQUE constraint, multi-row txn).
- **Elasticsearch:** search index hai, primary DB nahi.
- **Justify 3 cheezein:** access pattern, consistency need, scale numbers.
- **Bolo ek "kya nahi chuna":** "Mongo bhi chalta, par joins/transactions zyada hain."
- **Polyglot:** Postgres + Redis + ES + Cassandra ek system me normal hai.

| | SQL | NoSQL |
|---|---|---|
| Joins / txn | Haan, full ACID | Nahi / single partition tak |
| Scale | Vertical + replicas | Built-in horizontal |

**Interview me bolo:** "Bookings ke liye Postgres: multi-row transaction aur UNIQUE constraint chahiye, load ~100/sec. Messages ke liye Cassandra: write-heavy, access pattern chat_id + time, linear scale."

**Galti mat karna:** "NoSQL kyunki scale hoga" bina numbers ke. Paise ke data ke liye eventual store, ya ES/Redis ko source of truth banana.
