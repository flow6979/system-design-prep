**In one line:** Pre-signed S3 upload + Kafka image processing + CDN, hybrid fan-out feed in Redis, Cassandra for posts/likes/comments, Redis counters.

- **Requirements:** photo upload, follow, feed, likes/comments, 24 hr stories; must work for a 500M-follower celebrity.
- **Scale:** ~1,200 uploads/sec, ~250 TB/day, feed ~60K QPS (peak 150K), ~1M+ image req/sec, likes ~60K writes/sec.
- **Components:** S3 direct upload, Kafka + Image Processor, CDN, Cassandra, sharded MySQL follows, Redis feed + counters.
- **Pre-signed URL over upload proxy:** 250 TB/day never touches app servers; they handle metadata only.
- **Kafka async processing over in-request resize:** 2+ consumers, replay, per-author ordering.
- **Hybrid fan-out over pure push/pull:** a celebrity post means crores of writes; pure pull means 200+ merges.
- **Cassandra over sharded Postgres:** like volume, ~36 TB/yr; follows in sharded MySQL (no Neo4j, no multi-hop needed).
- **Redis counters + flush over `count+1`:** avoids hot-row contention; flush absolute values, not deltas.
- **Stories TTL over cron delete:** automatic expiry, lazy delete via read filter.
- **Senior signal:** a viral celebrity post is hot in three places (Cassandra partition, counter key, CDN miss); sharded counters, `(post_id, bucket)`, origin shield.

**Say in the interview:** "Media bytes never go through app servers: direct S3 upload, CDN for reads. The feed uses hybrid fan-out and likes use Redis counters."

**Avoid:** Proxying uploads through app servers; proposing pure push for celebrities.
