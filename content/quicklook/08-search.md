**Ek line:** Elasticsearch inverted index se full-text search aur relevance deta hai, par ye derived read model hai, source of truth nahi.

- **Inverted index:** term se documents ki list; index time pe kaam, query time pe sirf lookup.
- **LIKE '%x%':** B-tree use nahi hota, full scan, relevance/typo nahi; isliye ES.
- **text vs keyword:** `text` analyze hota hai (search); `keyword` exact (filter, sort, agg).
- **Analyzer:** index aur query dono pe same; autocomplete me `edge_ngram` index pe, `standard` search pe.
- **Mapping/analyzer change:** nayi index + `_reindex` + alias swap, zero downtime.
- **Scoring:** BM25 default; filter context score nahi karta aur cached hai, `must` me sab mat daalo.
- **Shards:** data size / ~30 GB; 5 GB ke liye 50 shards waste; logs ke liye time-based index + ILM.
- **Near-real-time:** refresh ~1 sec; naya doc turant nahi dikhta; har write pe `refresh=true` mat karo.
- **Deep paging:** `search_after` + PIT, `from/size` nahi; bulk indexing `_bulk` se.
- **Sync:** CDC (Debezium, Kafka, `_bulk` indexer), dual write nahi; ES udd jaaye to DB se rebuild.
- **OpenSearch:** AWS fork of ES 7.10; concepts same.

**Interview me bolo:** "Search ke liye Elasticsearch inverted index; Postgres source of truth hai, CDC se sync, to thoda lag acceptable hai."

**Galti mat karna:** ES ko primary DB banana (price/stock checkout), ya `db.save(); es.index();` dual write.
