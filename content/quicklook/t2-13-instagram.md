**Ek line:** Pre-signed S3 upload + Kafka image processing + CDN, hybrid fan-out feed in Redis, Cassandra for posts/likes/comments, Redis counters.

- **Requirements:** photo upload, follow, feed, likes/comments, 24 hr stories; celebrity (50 crore followers) pe bhi chale.
- **Scale:** ~1,200 uploads/sec, ~250 TB/day, feed ~60K QPS (peak 150K), ~1M+ image req/sec, likes ~60K writes/sec.
- **Components:** S3 direct upload, Kafka + Image Processor, CDN, Cassandra, sharded MySQL follows, Redis feed + counters.
- **Pre-signed URL over upload proxy:** 250 TB/day app servers se nahi; app sirf metadata.
- **Kafka async processing over in-request resize:** 2+ consumers, replay, per-author order.
- **Hybrid fan-out over pure push/pull:** celebrity post = crores writes; pure pull = 200+ merges.
- **Cassandra over sharded Postgres:** likes volume, ~36 TB/yr; follows sharded MySQL (Neo4j nahi, multi-hop nahi chahiye).
- **Redis counters + flush over `count+1`:** hot row contention nahi; flush absolute value, delta nahi.
- **Stories TTL over cron delete:** auto expiry, read filter se lazy delete.
- **Senior signal:** viral celebrity post teen jagah hot (Cassandra partition, counter key, CDN miss); sharded counters, `(post_id, bucket)`, origin shield.

**Interview me bolo:** "Media bytes app servers se nahi jaate: S3 direct upload, CDN se read. Feed hybrid fan-out se, aur likes Redis counters se."

**Galti mat karna:** Upload app server se proxy mat karo; celebrity ke liye pure push mat batao.
