**In one line:** Deliver a post to followers by push (at write time) or pull (at read time); the real answer is hybrid.

- **Push (on write):** post ID goes into every follower's Redis timeline; O(1) reads, writes = follower count.
- **Pull (on read):** one write only; reading costs ~500 lookups plus a merge, so it's slow.
- **Celebrity problem:** 270M followers = 270M writes; pure push fails.
- **Hybrid:** normal users (< ~10K followers) push; celebrities are pulled, merged and ranked at read time.
- **Inactive users (30 days):** skip push, build the feed by pull when they return.
- **Timeline:** `timeline:{userId}` holds post IDs only, `LPUSH` + `LTRIM 0 799`.
- **Memory:** 800 × 8 B ≈ 6.4 KB/user; 100M users ≈ 640 GB, shard by userId.
- **Deleted post:** don't remove from timelines, filter at read.
- **Math:** 200M DAU × 2 posts × 200 followers ≈ 1M Redis writes/sec; one 50M-follower post would block the queue.
- **Async:** fan-out via Kafka plus workers, never synchronous in the post API.

**Say in the interview:** "Hybrid fan-out: normal users' posts are pushed by workers via Kafka into followers' Redis timelines. Celebrities (10K+ followers) are pulled and merged at read time, so no write storm."

**Avoid:** Saying only push and missing the celebrity problem. Storing full post objects in the timeline, or skipping LTRIM.
