**Ek line:** Feed Redis me precompute (post_ids), normal users ke liye push, celebrities ke liye pull + read-time merge (hybrid), cursor pagination.

- **Requirements:** post (text + media), follow/unfollow, home feed newest first; feed p99 < 200 ms, ~5 sec freshness.
- **Scale:** 300M DAU, ~600 posts/sec, ~35K feed reads/sec (peak 150K), fan-out ~120K inserts/sec, feed cache ~1.2 TB.
- **Components:** Post Service (Cassandra), SQS + fan-out workers, Follow Graph, Feed Service, Redis feed, S3 + CDN.
- **Hybrid over pure push/pull:** push = celebrity ke 100M writes; pull = 200 queries per open.
- **Celebrity pull:** user chand celebrities follow karta hai, isliye read-time merge sasta; inactive users ko fan-out skip.
- **Redis post_ids only over full post:** edit/delete ek jagah, ~500x kam memory; hydrate via MGET.
- **Cursor over offset:** Snowflake `post_id < cursor`, naye posts se duplicates nahi.
- **SQS over Kafka:** ~600 events/sec, retries + DLQ; Kafka tab jab 3+ consumers aur replay.
- **Failure:** fan-out lag → queue depth autoscale, oldest-message age alert; duplicate message → ZSET member = post_id.
- **Senior signal:** peak 3K posts/sec x 200 = 600K Redis writes/sec; active users ki feed pehle fan-out.

**Interview me bolo:** "Read-heavy hai, isliye feed Redis me precompute. Normal users push, celebrities pull aur read pe merge; pagination cursor se."

**Galti mat karna:** Pure push bolke celebrity ke 10 crore writes ignore mat karo; offset pagination mat do.
