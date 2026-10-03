**In one line:** Precompute top-K per prefix offline into Redis/KV (O(1) lookup), front it with CDN + client debounce, refresh via batch plus a small stream pipeline.

- **Requirements:** top 5-10 suggestions within 100 ms per keystroke, fresh by popularity.
- **Scale:** ~46K QPS avg (peak 150K), ~1B prefix keys, ~300 GB, ~12K search-log events/sec.
- **Components:** CDN + local cache, prefix → top-K KV (hash-sharded), Kafka logs → S3 → Spark/Flink, Builder, version pointer.
- **Precomputed prefix → top-K over live trie/LIKE:** 300 GB does not fit one box; no compute on the read path.
- **Batch + small stream over live counters:** live counters mean 250K+ writes/sec and hot keys; stream only for trending.
- **Debounce + CDN over a call per keystroke:** 60-80% of requests never reach origin; ~5 min stale.
- **Hash sharding over first-letter ranges:** avoids "s" vs "x" skew.
- **Versioned rebuild + pointer flip over in-place overwrite:** atomic switch, easy rollback.
- **KV over Elasticsearch:** cheaper and faster for fixed top-K.
- **Failure:** batch fails → serve old version; bad rebuild → roll back pointer; offensive term → blocklist + CDN purge.
- **Senior signal:** hot short prefixes ("i", "ip") → request coalescing + replicas; sanity checks on rebuilds.

**Say in the interview:** "It is read-heavy with a 100 ms budget, so nothing is computed on the read path. I precompute top-K per prefix in KV, making each query an O(1) lookup."

**Avoid:** Updating live counters on every search; returning an error instead of an empty list.
