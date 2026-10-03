**Ek line:** Direct multipart upload S3 me, chunked transcoding SQS workers se, HLS/DASH segments CDN se; bottleneck bandwidth + storage hai.

- **Requirements:** upload, multiple resolutions, buffering-free playback, views/metadata.
- **Scale:** ~1 PB raw/day, ~12K watch starts/sec, ~15+ Tbps delivery, ~18K transcode tasks/sec.
- **Components:** Upload (pre-signed S3), SQS + transcode workers (DAG), S3, CDN, sharded SQL metadata, Redis counters.
- **Pre-signed multipart over via app server:** app server bandwidth bachti hai; resumable, `ListParts` se resume.
- **SQS + workers over Kafka/sync:** retry, visibility timeout, DLQ built-in; replay nahi chahiye.
- **HLS/DASH segments over ek MP4:** adaptive bitrate, CDN-friendly; cost ~3x storage.
- **CDN over origin:** popular pre-push, long-tail pull + origin shield.
- **Sharded SQL over Cassandra:** relations + status consistency; Redis cache for hot metadata.
- **Views:** Redis `INCR`, har 30 sec batch flush; DB writes ~1000x kam.
- **Failure:** worker crash → retry idempotent; poison video → DLQ; viral CDN miss storm → origin shield.
- **Senior signal:** cost CDN bandwidth + storage me hai, compute me nahi.

**Interview me bolo:** "QPS nahi, bandwidth aur storage bottleneck hai. Blob storage + CDN centre me, app servers sirf metadata aur URLs dete hain."

**Galti mat karna:** Video app server se proxy mat karo; poison video DLQ ke bina loop me chhodna.
