**In one line:** Document DBs (MongoDB, Firestore) store nested JSON; keep what is read together stored together, and model for reads.

- **Schemaless myth:** the schema lives in code and access patterns; it still needs design.
- **Embed vs reference:** embed what is read together; reference what is large, shared, or unbounded.
- **Unbounded array:** never embed; the document grows toward 16 MB and updates slow down.
- **Extended reference:** don't duplicate fields that change often; the fan-out update is costly.
- **Indexes:** B-tree like SQL, leftmost prefix + ESR rule; compare `nReturned` vs `totalDocsExamined` in `explain("executionStats")`.
- **Transactions:** single doc is atomic; multi-doc ACID since 4.0 but slow; embedding avoids most of them.
- **Read-your-writes:** write concern `majority` + primary read; `w:1` + secondary read is stale.
- **Sharding:** default ObjectId `_id` is monotonic, so one shard gets hot; use a hashed key.
- **Firestore:** every query is indexed, billed per document read; rules are not filters, so the query needs `where userId == uid`.
- **When not:** ledgers, many-to-many, heavy reporting; you rebuild joins in app code.
- **Boundary:** catalog in the document DB, transactions in SQL, search in Elasticsearch, cache in Redis.

**Say in the interview:** "The menu is read as one unit with varying attributes, so a document model fits; orders and payments stay in Postgres."

**Avoid:** Saying "MongoDB because it scales", or using it like SQL with a collection per table and many `$lookup`s.
