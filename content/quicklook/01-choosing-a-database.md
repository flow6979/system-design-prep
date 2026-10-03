**Ek line:** DB "popular" hone se nahi, data shape + access pattern + consistency + scale se choose hota hai.

- **5 sawal:** data ka shape, query pattern, consistency, scale, OLTP vs OLAP.
- **Pehle access pattern:** "user ke last 50 orders" likho, phir DB ka naam bolo.
- **Default:** shak ho to PostgreSQL; JSONB, full-text, pgvector sab thoda kar leta hai.
- **Payments/inventory:** Postgres/MySQL, ACID + row lock (`SELECT ... FOR UPDATE`); eventual consistency nahi chalti.
- **Chat/high writes:** Cassandra, partition `chat_id`, clustering time desc; LSM-tree write me fast.
- **Key lookup/cache/session:** Redis ya DynamoDB; leaderboard = Redis Sorted Set.
- **Search:** Elasticsearch (derived store); analytics: ClickHouse/BigQuery; files: S3 + DB me sirf URL.
- **B-tree vs LSM:** B-tree read/range ke liye; LSM write-heavy ke liye (commit log + memtable).
- **SQL vs NoSQL:** SQL = joins + ACID; NoSQL = query-first modeling, horizontal scale.
- **Polyglot:** ek source of truth (Postgres), baaki derived; sync CDC ya outbox se, dual write nahi.
- **Template:** access pattern, requirement, DB, tradeoff, mitigation, is order me.

**Interview me bolo:** "Is entity ka pattern ye hai, isme ACID chahiye, isliye Postgres. Tradeoff single-primary write limit hai, jise sharding aur cache se handle karunga."

**Galti mat karna:** "NoSQL scale karta hai, SQL nahi" bolna, ya DB ka naam bina "kyun" ke bolna. Dual write bhi mat bolna.
