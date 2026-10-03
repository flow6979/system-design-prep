**In one line:** Keep frequently read data in Redis to cut DB load and latency; always state the pattern, TTL and invalidation.

- **Cache-aside:** the default. Miss → read DB, fill cache; on write update DB then DELETE the key (don't update it).
- **Write-through:** write to cache and DB together; fresh but slower writes.
- **Write-back:** write to cache only, DB later; fast but data loss if the cache dies. Counters, likes.
- **Write-around:** write straight to DB; logs, uploads not read soon.
- **Eviction:** LRU default, LFU for stable popular items, always add TTL as a safety net.
- **TTL:** menu 10 min, stock 5 sec, profile 1 hr.
- **Invalidation:** TTL, delete on write, or CDC (DB → Kafka → delete) for multiple services.
- **Stampede:** request coalescing (`SET NX PX`), TTL jitter, early refresh.
- **Hot key:** local in-process cache for 1–5 sec, replicate the key (`score#1..10`), Redis read replicas.
- **CDN:** static plus same-for-everyone responses; versioned URLs are best, purge is slow.
- **Redis vs Memcached:** Redis almost always (data types, persistence, cluster); Memcached only for plain KV.
- **Don't cache:** data that changes every request, strong-consistency reads, low read:write ratio.

**Say in the interview:** "Redis cache-aside, 10 min TTL with jitter, delete the key after the DB update. Request coalescing against stampede and a small local cache for hot keys."

**Avoid:** "We'll add a cache" with no pattern, TTL or invalidation. Same TTL on all keys, or treating the cache as source of truth.
