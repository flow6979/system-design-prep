**In one line:** Precompute feeds in Redis (post_ids), push for normal users, pull + read-time merge for celebrities (hybrid), cursor pagination.

- **Requirements:** post (text + media), follow/unfollow, home feed newest first; feed p99 < 200 ms, ~5 sec freshness.
- **Scale:** 300M DAU, ~600 posts/sec, ~35K feed reads/sec (peak 150K), fan-out ~120K inserts/sec, feed cache ~1.2 TB.
- **Components:** Post Service (Cassandra), SQS + fan-out workers, Follow Graph, Feed Service, Redis feed, S3 + CDN.
- **Hybrid over pure push/pull:** pure push = 100M writes per celebrity post; pure pull = 200 queries per open.
- **Celebrity pull:** users follow only a few celebrities, so read-time merge is cheap; skip fan-out for inactive users.
- **Redis post_ids only over full posts:** edit/delete in one place, ~500x less memory; hydrate via MGET.
- **Cursor over offset:** Snowflake `post_id < cursor` avoids duplicates when new posts arrive.
- **SQS over Kafka:** ~600 events/sec, retries + DLQ; use Kafka once there are 3+ consumers and replay is needed.
- **Failure:** fan-out lag → autoscale on queue depth, alert on oldest-message age; duplicates → ZSET member = post_id.
- **Senior signal:** peak 3K posts/sec x 200 = 600K Redis writes/sec; fan out to active users first.

**Say in the interview:** "It is read-heavy, so I precompute feeds in Redis. Normal users get push, celebrities are pulled and merged at read time, with cursor pagination."

**Avoid:** Proposing pure push and ignoring 100M writes per celebrity post; using offset pagination.
