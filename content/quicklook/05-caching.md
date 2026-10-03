**Ek line:** Baar baar padha jaane wala data Redis me rakho taaki DB load aur latency kam ho; pattern, TTL aur invalidation bolna zaroori hai.

- **Cache-aside:** default. Miss → DB se padh ke cache me; write pe DB update phir cache DELETE (update nahi).
- **Write-through:** cache + DB dono me; fresh par writes slow.
- **Write-back:** sirf cache me, DB baad me; fast par cache mara to loss. Counters, likes.
- **Write-around:** seedha DB; logs, uploads jo turant padhe nahi jaate.
- **Eviction:** LRU default, LFU stable popular items ke liye, TTL hamesha safety net.
- **TTL:** menu 10 min, stock 5 sec, profile 1 hr.
- **Invalidation:** TTL, write pe delete, ya CDC (DB → Kafka → delete) multi-service ke liye.
- **Stampede:** request coalescing (`SET NX PX`), TTL jitter, early refresh.
- **Hot key:** local in-process cache 1–5 sec, key replicate (`score#1..10`), Redis read replicas.
- **CDN:** static + same-for-all responses; versioned URLs best, purge slow.
- **Redis vs Memcached:** Redis almost hamesha (data types, persistence, cluster); Memcached sirf simple KV.
- **Cache mat karo:** har request pe badalta data, strong consistency, kam read:write.

**Interview me bolo:** "Redis me cache-aside, TTL 10 min with jitter, write pe DB update ke baad key delete. Stampede ke liye request coalescing, hot keys ke liye local cache."

**Galti mat karna:** "Cache laga denge" bina pattern/TTL/invalidation. Sab keys ka same TTL, ya cache ko source of truth maanna.
