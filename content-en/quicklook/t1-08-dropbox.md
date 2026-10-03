**In one line:** Metadata (sharded SQL) and bytes (S3) are separate; 4 MB chunks + SHA-256 give delta sync and dedup; conflicts become a conflicted copy.

- **Requirements:** upload, multi-device sync, sharing, versions; no data loss when two devices edit.
- **Scale:** ~1 EB storage, ~250B chunks, ~200M changes/day (~2.5K/sec), fan-out to 2-3 devices.
- **Components:** Metadata service (sharded SQL by owner), S3 + pre-signed URLs, change_log, Redis pub/sub, long poll.
- **4 MB chunks + hash over whole file:** delta sync, dedup, parallel + resumable; costs client CPU.
- **Content hash as S3 key over UUID:** identical content stored once; existence-leak risk.
- **Sharded SQL over Cassandra:** move/rename transactions, unique names, strong consistency.
- **change_log + Redis pub/sub + long poll over Kafka/polling:** ~2.5K/sec, cursor replay; Kafka once new consumers appear.
- **Optimistic concurrency + conflicted copy over LWW/lock:** `baseVersion` → 409, no data loss.
- **Failure:** chunks uploaded but commit failed → orphans, GC (unreferenced + 7 days); missed notification → cursor `/changes`.
- **Senior signal:** a company-wide shared folder is a hot shard + fan-out; give it its own namespace.

**Say in the interview:** "Bytes go to blob storage, metadata to transactional SQL. Chunk hashes mean only missing chunks upload, and conflicts produce a conflicted copy."

**Avoid:** Last-write-wins (silent data loss); forgetting orphan chunk GC.
