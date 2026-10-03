**Ek line:** Document DB (MongoDB, Firestore) nested JSON docs rakhta hai; jo saath padha jaata hai wo saath store karo, modeling reads ke hisaab se.

- **Schemaless myth:** schema code aur access patterns me rehta hai; design nahi hota aisa nahi.
- **Embed vs reference:** saath padha jaane wala embed; bada, shared, unbounded reference.
- **Unbounded array:** embed mat karo; document 16 MB tak badhta hai, updates slow.
- **Extended reference:** baar-baar badalne wale fields duplicate mat karo; fan-out update mehenga.
- **Indexes:** B-tree jaise, leftmost prefix + ESR rule; `explain("executionStats")` me `nReturned` vs `totalDocsExamined`.
- **Transactions:** single doc atomic; multi-doc ACID 4.0+ par slow; embedding se zyada tar bach jaate hain.
- **Read-your-writes:** write concern `majority` + primary read; `w:1` + secondary read stale deta hai.
- **Sharding:** default ObjectId `_id` monotonic = ek shard hot; hashed key lo.
- **Firestore:** har query indexed, cost per document read; security rules filter nahi, query me `where userId == uid`.
- **Kab nahi:** ledger, many-to-many, heavy reporting; joins app me banane padte hain.
- **Boundary:** catalog document DB me, transactions SQL me, search Elasticsearch, cache Redis.

**Interview me bolo:** "Menu ek unit ki tarah padha jaata hai aur attributes alag hain, isliye document model; orders aur payments Postgres me."

**Galti mat karna:** "MongoDB kyunki scale karta hai" bolna, ya SQL ki tarah collections + `$lookup` use karna.
