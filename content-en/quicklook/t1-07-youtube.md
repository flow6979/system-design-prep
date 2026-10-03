**In one line:** Direct multipart upload to S3, chunked transcoding via SQS workers, HLS/DASH segments served from CDN; the bottleneck is bandwidth and storage.

- **Requirements:** upload, multiple resolutions, buffering-free playback, views/metadata.
- **Scale:** ~1 PB raw/day, ~12K watch starts/sec, ~15+ Tbps delivery, ~18K transcode tasks/sec.
- **Components:** Upload (pre-signed S3), SQS + transcode workers (DAG), S3, CDN, sharded SQL metadata, Redis counters.
- **Pre-signed multipart over via app server:** saves app server bandwidth; resumable via `ListParts`.
- **SQS + workers over Kafka/sync:** built-in retry, visibility timeout, DLQ; no replay needed.
- **HLS/DASH segments over one MP4:** adaptive bitrate, CDN-friendly; costs ~3x storage.
- **CDN over origin:** pre-push popular videos, pull long-tail, add origin shield.
- **Sharded SQL over Cassandra:** relations + status consistency; Redis cache for hot metadata.
- **Views:** Redis `INCR`, batch flush every 30 sec; ~1000x fewer DB writes.
- **Failure:** worker crash → idempotent retry; poison video → DLQ; viral CDN miss storm → origin shield.
- **Senior signal:** cost sits in CDN bandwidth and storage, not compute.

**Say in the interview:** "The bottleneck is bandwidth and storage, not QPS. Blob storage + CDN sit at the center; app servers only serve metadata and URLs."

**Avoid:** Proxying video through app servers; leaving poison videos looping without a DLQ.
