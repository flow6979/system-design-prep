**Ek line:** Post ko followers tak pahunchane ke liye push (likhte waqt) ya pull (padhte waqt); real answer hybrid.

- **Push (on write):** post ID har follower ki Redis timeline me; read O(1) fast, write = followers count.
- **Pull (on read):** sirf ek write; read pe following ke 500 lookups + merge, slow.
- **Celebrity problem:** 27 crore followers = 27 crore writes; push fail.
- **Hybrid:** normal users (< ~10K followers) push; celebrities pull + merge + rank at read time.
- **Inactive users (30 din):** push skip, aane pe pull se feed banao.
- **Timeline:** `timeline:{userId}` me sirf post IDs, `LPUSH` + `LTRIM 0 799`.
- **Memory:** 800 × 8 B ≈ 6.4 KB/user; 100M users ≈ 640 GB, shard by userId.
- **Deleted post:** timeline se hatao nahi, read pe filter.
- **Math:** 200M DAU × 2 posts × 200 followers ≈ 1M Redis writes/sec; ek 50M celebrity post queue block karega.
- **Async:** fan-out Kafka + workers se, post API me sync nahi.

**Interview me bolo:** "Hybrid fan-out: normal users ki post Kafka ke through workers followers ki Redis timeline me push karte hain. 10K+ followers wale celebrities pull aur read time pe merge, taaki write storm na aaye."

**Galti mat karna:** Sirf push bolna aur celebrity problem miss karna. Timeline me poora post object rakhna, ya LTRIM na lagana.
