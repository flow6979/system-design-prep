**Ek line:** Bahut servers par bina coordination ke unique, ho sake to time-sorted IDs: Snowflake, UUID v7 ya range allocation.

- **Auto-increment kyun nahi:** single DB bottleneck, sharding pe duplicates, guessable, merge mushkil.
- **UUID v4:** random 128 bit; B-tree page splits, index fat, writes slow.
- **UUID v7:** 48-bit ms timestamp + random; sortable, modern default.
- **Snowflake:** 64 bit = 1 sign + 41 timestamp (~69 saal) + 10 machine (1024) + 12 sequence (4096/ms).
- **Snowflake fayde:** har machine khud banati hai, no network call, time-sorted.
- **Clock skew:** clock peeche gayi to duplicate; wait ya error. Machine ID ZooKeeper/etcd/pod ordinal se.
- **Range/ticket server:** 1000 IDs ki range lo, memory me use; central load 1000x kam. Crash pe range waste theek.
- **Base62 short codes:** 6 char ≈ 56 billion, 7 char ≈ 3.5 trillion. Counter → Base62.
- **Sequential guessable:** shuffle/bijective mapping ya random 7 char + UNIQUE + retry.
- **Sorted IDs:** cursor pagination `WHERE id < last LIMIT 20`, append-only index.

**Interview me bolo:** "Snowflake-style 64-bit: 41 bit timestamp, 10 bit machine, 12 bit sequence. Koi central bottleneck nahi, time-sorted to cursor pagination free. Short URL ke liye range allocation + Base62, 7 char = 3.5 trillion."

**Galti mat karna:** Sharded system me DB auto-increment. Snowflake bolna par bit layout aur clock skew na bata paana.
