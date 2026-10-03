**In one line:** Make text search fast with an inverted index (word → doc list), and prefix autocomplete with a trie holding precomputed top-K.

- **Inverted index:** word → posting list; a query is an intersection of sorted lists. `LIKE '%x%'` is a full scan.
- **Analyzer:** tokenize, lowercase, stop words, stemming, synonyms/n-grams; run the same analyzer at query time.
- **Ranking:** BM25 (ES default) plus business signals (rating, distance, freshness).
- **Elasticsearch:** index = shards (Lucene), replicas for reads and safety; scatter-gather. ~10–50 GB per shard.
- **Shard count:** hard to change later (reindex).
- **Near real-time:** ~1 sec refresh. Not a source of truth.
- **DB → ES sync:** CDC is best (Debezium → Kafka → idempotent indexer). Avoid dual write; batch jobs miss deletes.
- **Trie:** top 5–10 precomputed per node; lookup O(prefix length).
- **Trie updates:** logs → Kafka → hourly/daily Spark → swap in a new trie; never per keystroke.
- **Small scale:** Postgres `tsvector` + GIN. Exact match by id/email = normal index.

**Say in the interview:** "Elasticsearch for search, Postgres stays the source of truth, synced via CDC. No dual write, since partial failure desyncs data. Autocomplete via a trie with precomputed top-K, rebuilt offline."

**Avoid:** Calling `LIKE '%term%'` a search solution, or making ES the primary DB. Traversing the trie subtree on every query.
