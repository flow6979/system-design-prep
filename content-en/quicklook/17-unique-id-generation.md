**In one line:** Generate unique, ideally time-sorted IDs across many servers without coordination: Snowflake, UUID v7 or range allocation.

- **Why not auto-increment:** single-DB bottleneck, duplicates after sharding, guessable, hard to merge.
- **UUID v4:** random 128 bit; causes B-tree page splits, fat index, slower writes.
- **UUID v7:** 48-bit ms timestamp plus random; sortable, the modern default.
- **Snowflake:** 64 bit = 1 sign + 41 timestamp (~69 years) + 10 machine (1024) + 12 sequence (4096/ms).
- **Snowflake benefits:** each machine generates its own, no network call, time-sorted.
- **Clock skew:** a clock moving backwards can duplicate IDs; wait or error. Machine ID from ZooKeeper/etcd/pod ordinal.
- **Range/ticket server:** take a block of 1000 IDs and use from memory; 1000x less central load. Wasted range on crash is fine.
- **Base62 short codes:** 6 chars ≈ 56 billion, 7 chars ≈ 3.5 trillion. Counter → Base62.
- **Sequential is guessable:** shuffle (bijective mapping) or random 7 chars + UNIQUE + retry.
- **Sorted IDs:** cursor pagination `WHERE id < last LIMIT 20`, append-only index inserts.

**Say in the interview:** "Snowflake-style 64-bit: 41-bit timestamp, 10-bit machine, 12-bit sequence. No central bottleneck, and time-sorted IDs give cursor pagination for free. For short URLs, range allocation plus Base62; 7 chars = 3.5 trillion."

**Avoid:** DB auto-increment in a sharded system. Naming Snowflake without the bit layout and clock skew.
