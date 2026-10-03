**Ek line:** Text search fast karne ke liye inverted index (word → doc list) banao, aur prefix autocomplete ke liye trie with precomputed top-K.

- **Inverted index:** word → posting list; query = sorted lists ka intersection. `LIKE '%x%'` full scan hai.
- **Analyzer:** tokenize, lowercase, stop words, stemming, synonyms/n-grams; query pe same analyzer.
- **Ranking:** BM25 (ES default) + business signals (rating, distance, freshness).
- **Elasticsearch:** index = shards (Lucene), replicas for reads + safety; scatter-gather. ~10–50 GB per shard.
- **Shard count:** baad me badalna mushkil (reindex).
- **Near real-time:** ~1 sec refresh. Source of truth nahi.
- **DB → ES sync:** CDC best (Debezium → Kafka → indexer upsert). Dual write avoid; batch me deletes miss.
- **Trie:** node pe top 5–10 precomputed; lookup O(prefix length).
- **Trie update:** logs → Kafka → hourly/daily Spark → naya trie swap; har keystroke pe nahi.
- **Chhota scale:** Postgres `tsvector` + GIN. Exact match id/email = normal index.

**Interview me bolo:** "Search ke liye Elasticsearch, source of truth Postgres, sync CDC se. Dual write nahi, partial failure me out of sync. Autocomplete ke liye trie with precomputed top-K, offline rebuild."

**Galti mat karna:** `LIKE '%term%'` ko search solution bolna, ya ES ko primary DB banana. Har query pe trie subtree traverse karna.
