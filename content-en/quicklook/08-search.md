**In one line:** Elasticsearch gives full-text search and relevance via an inverted index, but it is a derived read model, not a source of truth.

- **Inverted index:** term to document list; work happens at index time, query time is just a lookup.
- **LIKE '%x%':** no B-tree use, full scan, no relevance or typo tolerance; that is why ES.
- **text vs keyword:** `text` is analyzed (search); `keyword` is exact (filter, sort, agg).
- **Analyzer:** same at index and query time; for autocomplete, `edge_ngram` at index, `standard` at search.
- **Mapping/analyzer change:** new index + `_reindex` + alias swap, zero downtime.
- **Scoring:** BM25 default; filter context skips scoring and is cached, so don't put everything in `must`.
- **Shards:** data size / ~30 GB; 50 shards for 5 GB is waste; use time-based indices + ILM for logs.
- **Near-real-time:** refresh ~1 sec; new docs aren't instantly visible; don't use `refresh=true` on every write.
- **Deep paging:** `search_after` + PIT, not `from/size`; index with `_bulk`.
- **Sync:** CDC (Debezium, Kafka, `_bulk` indexer), not dual write; rebuild from the DB if ES is lost.
- **OpenSearch:** AWS fork of ES 7.10; same concepts.

**Say in the interview:** "Elasticsearch for search via an inverted index; Postgres is the source of truth, synced by CDC, so a small lag is acceptable."

**Avoid:** Making ES the primary DB (price/stock at checkout), or dual writing with `db.save(); es.index();`.
