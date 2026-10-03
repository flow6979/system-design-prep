**In one line:** Pick SQL for relations, transactions and strong consistency; pick NoSQL for massive scale, simple access patterns or flexible schema.

- **SQL:** ACID, joins, fixed schema. A tuned Postgres handles ~10K+ writes/sec and TBs.
- **Key-value:** Redis, DynamoDB. Cache, sessions, counters, URL mapping.
- **Document:** MongoDB. Catalogs, profiles, flexible/nested schema.
- **Wide-column:** Cassandra. Write-heavy, time-ordered, chat. Tables are designed per query.
- **Graph:** Neo4j. Friends-of-friends, multi-hop traversal.
- **Payments, orders, bookings:** Postgres/MySQL (ACID, UNIQUE constraint, multi-row txn).
- **Elasticsearch:** a search index, not a primary DB.
- **Justify with 3 things:** access pattern, consistency need, scale numbers.
- **Name one rejected option:** "Mongo would work, but we have many joins/transactions."
- **Polyglot:** Postgres + Redis + ES + Cassandra in one system is normal.

| | SQL | NoSQL |
|---|---|---|
| Joins / txn | Yes, full ACID | No / single partition only |
| Scale | Vertical + replicas | Built-in horizontal |

**Say in the interview:** "Postgres for bookings: I need multi-row transactions and a UNIQUE constraint, load is ~100/sec. Cassandra for messages: write-heavy, access by chat_id + time, linear scale."

**Avoid:** "NoSQL because it will scale" with no numbers. An eventual store for money data, or ES/Redis as source of truth.
