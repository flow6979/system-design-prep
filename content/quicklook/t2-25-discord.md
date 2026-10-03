**Ek line:** ScyllaDB me message ek baar store, REST send / WebSocket receive, guild-sharded Guild Service fan-out; hot guild pe relay tree.

- **Requirements:** guild → channels → real-time messages; 1 lakh+ member channel me turant delivery, fast history.
- **Scale:** ~10M connections (~100+ gateways), ~60K writes/sec, ~5 TB/day, 1 msg x 1 lakh online = 1 lakh pushes.
- **Components:** Gateways (WebSocket), Message Service, Guild Service (by guild_id), ScyllaDB, Redis presence, Kafka, ES search, SFU voice.
- **ScyllaDB `(channel_id, bucket)` over Postgres:** 60K writes/sec; bucket partition ko bounded rakhta hai.
- **Store once + push to online over per-user inbox:** 1 lakh copies nahi; offline pull karega.
- **Guild-sharded service + direct RPC over broadcast/pubsub:** state ek jagah, simple ordering.
- **REST send + WebSocket receive:** auth, rate limit, retry simple.
- **Snowflake IDs over UUID:** time-sortable, coordination-free.
- **Lazy presence + member list ranges over broadcast:** N^2 events nahi.
- **SFU over MCU/P2P for voice:** no mixing, CPU sasta.
- **Senior signal:** hot guild fan-out + outage ke baad 10M reconnect storm; relay tree, jittered backoff, `RESUME` with last sequence.

**Interview me bolo:** "Fan-out cost member count se tay hoti hai, message count se nahi. Message ek baar store, online members ko push, aur hot guilds ke liye relay tree."

**Galti mat karna:** Per-user inbox copy mat banao; reconnect storm ke bina jitter ke mat chhodo.
