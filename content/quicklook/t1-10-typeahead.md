**Ek line:** Har prefix ka top-K offline precompute karke Redis/KV me (O(1) lookup), CDN + client debounce, batch + small stream pipeline se refresh.

- **Requirements:** har keystroke pe 100 ms me top 5-10 suggestions, popularity se fresh.
- **Scale:** ~46K QPS avg (peak 150K), ~1B prefix keys, ~300 GB, ~12K search-log events/sec.
- **Components:** CDN + local cache, prefix → top-K KV (hash-sharded), Kafka logs → S3 → Spark/Flink, Builder, version pointer.
- **Precomputed prefix → top-K over live trie/LIKE:** 300 GB ek box me nahi; read pe compute nahi.
- **Batch + small stream over live counters:** live = 250K+ writes/sec, hot keys; stream sirf trending.
- **Debounce + CDN over every-keystroke call:** 60-80% requests origin tak nahi; ~5 min stale.
- **Hash sharding over first-letter range:** "s" vs "x" skew nahi.
- **Versioned rebuild + pointer flip over in-place overwrite:** atomic switch, easy rollback.
- **KV over Elasticsearch:** fixed top-K ke liye sasta aur fast.
- **Failure:** batch fail → purana version serve; bad rebuild → pointer rollback; offensive term → blocklist + CDN purge.
- **Senior signal:** hot short prefixes ("i", "ip") → request coalescing + replicas; rebuild sanity checks.

**Interview me bolo:** "Read-heavy aur 100 ms, isliye read path pe compute nahi. Har prefix ka top-K precompute karke KV me, aur query O(1) lookup hai."

**Galti mat karna:** Har search pe live counter update mat batao; error ki jagah empty list do.
