**Ek line:** Metadata (sharded SQL) aur bytes (S3) alag; 4 MB chunks + SHA-256 se delta sync aur dedup; conflict pe conflicted copy.

- **Requirements:** upload, multi-device sync, sharing, versions; do devices ke edit pe data lose nahi.
- **Scale:** ~1 EB storage, ~250B chunks, ~200M changes/day (~2.5K/sec), fan-out 2-3 devices.
- **Components:** Metadata service (sharded SQL by owner), S3 + pre-signed URLs, change_log, Redis pub/sub, long poll.
- **Chunks 4 MB + hash over whole file:** delta sync, dedup, parallel + resumable; cost client CPU.
- **Content hash as S3 key over UUID:** same content ek baar; existence-leak risk.
- **Sharded SQL over Cassandra:** move/rename txn, unique names, strong consistency.
- **change_log + Redis pub/sub + long poll over Kafka/polling:** ~2.5K/sec, cursor replay; Kafka tab jab naye consumers.
- **Optimistic concurrency + conflicted copy over LWW/lock:** `baseVersion` → 409, data lose nahi.
- **Failure:** chunks upload par commit fail → orphans, GC (unreferenced + 7 din); notification miss → cursor `/changes`.
- **Senior signal:** company-wide shared folder = hot shard + fan-out; use apna namespace.

**Interview me bolo:** "Bytes blob store me, metadata transactional SQL me. Chunk hashes se sirf missing chunks upload hote hain, aur conflict pe conflicted copy banti hai."

**Galti mat karna:** Last-write-wins mat bolo (silent data loss); orphan chunk GC bhoolna nahi.
