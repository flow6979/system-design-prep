**In one line:** Store each message once in ScyllaDB, send via REST and receive via WebSocket, fan out through a guild-sharded Guild Service, with a relay tree for hot guilds.

- **Requirements:** guild → channels → real-time messages; instant delivery to 100K+ member channels, fast history.
- **Scale:** ~10M connections (~100+ gateways), ~60K writes/sec, ~5 TB/day, 1 msg x 100K online = 100K pushes.
- **Components:** Gateways (WebSocket), Message Service, Guild Service (by guild_id), ScyllaDB, Redis presence, Kafka, ES search, SFU voice.
- **ScyllaDB `(channel_id, bucket)` over Postgres:** 60K writes/sec; buckets keep partitions bounded.
- **Store once + push to online over per-user inbox:** avoids 100K copies; offline users pull.
- **Guild-sharded service + direct RPC over broadcast/pubsub:** state in one place, simple ordering.
- **REST send + WebSocket receive:** simpler auth, rate limiting, retries.
- **Snowflake IDs over UUID:** time-sortable, coordination-free.
- **Lazy presence + member list ranges over broadcast:** avoids N^2 events.
- **SFU over MCU/P2P for voice:** no mixing, cheap CPU.
- **Senior signal:** hot guild fan-out plus a 10M-client reconnect storm after outages; relay tree, jittered backoff, `RESUME` with last sequence.

**Say in the interview:** "Fan-out cost is set by member count, not message count. I store each message once, push to online members, and use a relay tree for hot guilds."

**Avoid:** Per-user inbox copies; reconnect logic without jitter.
