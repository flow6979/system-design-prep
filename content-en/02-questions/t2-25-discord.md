---
title: Design Discord / Slack
order: 25
tier: 2
time: 25
patterns: [WebSocket gateway, Fan-out, Pub/sub, Wide-column storage, Snowflake IDs, Lazy presence]
topics: [08-real-time-communication, 18-fan-out, 07-message-queues-kafka, 04-sharding-consistent-hashing, 17-unique-id-generation, 02-sql-vs-nosql, 14-search-indexing, 11-rate-limiting]
askedAt: [Discord, Slack, Microsoft, Atlassian, Amazon, Meta]
---

# Design Discord / Slack

**In one line:** Users join servers (guilds), each server has channels, and messages arrive in a channel in real time. The core challenge is that **a message must show up instantly for everyone in a channel with 100K+ members**, and old history must load fast.

**What the interviewer checks in this question:** understanding how this differs from WhatsApp (groups are huge, history is read-heavy), WebSocket gateway design, per-channel fan-out, Cassandra/ScyllaDB partition design, unread counts, and keeping presence cheap at scale.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Are servers, text channels, DMs and mentions in scope? Voice/video?" | Text is core, voice at a high level | A separate SFU path for voice, focus on text |
| "Max members in one server? How big can one channel be?" | Some servers have 1M+ members, 100K+ online in a channel | No per-user inbox like WhatsApp, per-channel fan-out |
| "How old should message history go?" | Forever, users can scroll back | Time-bucketed partitions, cold data on cheap storage |
| "How strict is ordering?" | Ordered within a channel | Snowflake ID per message, sorted within the channel |
| "Do we need unread counts and @mentions?" | Yes, the badge must show | Read state per user per channel |
| "Do we show everyone's presence (online/offline)?" | Only for the visible member list | Lazy presence, no broadcast to everyone |
| "Search, permissions/roles?" | Yes | Elasticsearch, role bitmask |

> **Say:** "This is different from WhatsApp. In WhatsApp groups are small and each user has an inbox. Here channels are huge and history is shared, so I will store a message once in the channel and fan out only to online people for the live push."

## Step 2: Requirements

**Functional**
1. Users should be able to join a server and send a message in a channel that everyone with permission sees in real time
2. Users should be able to scroll through channel history (pagination, including old messages)
3. Users should be able to see unread / @mention badges and the presence of visible members
4. Users should be able to search messages in their servers (only channels they can see)

**Out of scope:** voice/video internals (SFU at a high level only), DMs, threads, bots, the file upload pipeline, moderation ML.

**Non-functional (in priority order)**
1. **Durability:** an acknowledged message is never lost
2. **Latency:** message delivery p99 < 300ms to online members
3. **Availability:** 99.99% for send/receive, history is read-heavy
4. **Scale:** ~100M MAU, ~10M concurrent WebSockets, ~60K msgs/sec avg (peak ~180K)
5. **Ordering:** only within one channel

**CAP choice:** **AP** with per-channel ordering. A slightly late message during a partition is fine, a failed send is not. Strong consistency only for the Postgres metadata (roles, membership).

## Step 3: Estimation (only what changes the design)

- ~10M concurrent connections. One gateway server handles ~100K connections → **~100+ gateway servers**. Sticky WebSocket, a stateful layer.
- ~5B messages/day ≈ **60K writes/sec** avg, peak 3x. A single SQL DB will not work → Cassandra/ScyllaDB.
- Storage: 5B × 1KB ≈ **5TB/day**, years of data in petabytes. Old data goes to a cold tier.
- Fan-out: 1 message × 100K online members = 100K pushes. Even if one big server sends just 1 msg/sec, that is 100K pushes/sec. **The hot guild is the real problem.**

> **Say:** "We need a wide-column store for write throughput, and in big channels the fan-out cost is decided by the member count, not the message count."

## Step 4: Core entities

- **Guild (server)**: id, name, owner_id, member_count
- **Channel**: id, guild_id, type (`TEXT`, `VOICE`), name, permission_overwrites
- **Member**: guild_id, user_id, role_ids, joined_at
- **Role**: id, guild_id, permissions (bitmask), position
- **Message**: channel_id, bucket, message_id (Snowflake), author_id, content, mentions, attachments
- **ReadState**: user_id, channel_id, last_read_message_id, mention_count

## Step 5: APIs

```http
POST /guilds/{guildId}/channels            {name, type}            → {channelId}
POST /channels/{channelId}/messages        {content, nonce}        → {messageId}
GET  /channels/{channelId}/messages?before=<msgId>&limit=50        → [messages]
POST /channels/{channelId}/ack             {messageId}             → 204
GET  /search?guild=1&q=deploy&author=7                             → [messages]
WS   wss://gateway.app/?v=10   events: MESSAGE_CREATE, TYPING_START, PRESENCE_UPDATE
     client → GUILD_SUBSCRIBE {guildId, channelIds, memberListRange}
```

> **Say:** "I send via REST (rate limit and auth are simple), and receive via the WebSocket gateway. The `nonce` is client-generated, so a retry does not create a duplicate message."

## Step 6: High-level design

**Start with a simple v1:** client → API → one Postgres (a messages table), plus one WebSocket server that pushes a new message to the users connected to that channel. This works for a small Slack workspace. What breaks it: **10M concurrent connections** (100+ gateways, so something must know which gateway to send to → Guild Service), **60K writes/sec + PBs of history** (ScyllaDB), **100K-member channels** (store once, push to online), and **search** (Elasticsearch).

```mermaid
flowchart LR
  C["Client app"] --> LB["Load Balancer"]
  LB --> API["API Service (REST)"]
  LB --> GW["Gateway Servers (WebSocket)"]
  API --> MS["Message Service"]
  MS --> DB[("ScyllaDB messages")]
  MS -- "RPC routed by guild_id hash" --> GS["Guild Service (sharded by guild_id)"]
  GS --> GW
  API --> PG[("Postgres guilds, roles, members")]
  GW --> PR["Presence Service (Redis)"]
  MS --> K[["Kafka"]]
  K --> ES[("Elasticsearch search")]
  K --> RS["Read State Service"]
  C --> SFU["Voice SFU (WebRTC)"]
```

**Why each component:**
- **Gateway servers:** 10M connections ÷ ~100K per server = 100+ servers. Stateful, so only connections + subscriptions, no business logic.
- **Message Service:** permission check, Snowflake ID, write to ScyllaDB, then an RPC to the Guild Service.
- **Guild Service (sharded by guild_id):** one guild's state (online sessions, who is viewing which channel) lives in one process, and it decides what to send to which gateway. The simpler option "every gateway hears every message" = 60K msgs/sec × 100+ gateways, wasted. No separate pub/sub layer in between: the owner process is known via consistent hashing, so a direct RPC saves a hop.
- **ScyllaDB:** 60K writes/sec (peak 180K), 5TB/day. Fast history with the `(channel_id, bucket)` partition. In Postgres this write rate + PBs = manual sharding pain.
- **Postgres:** guilds, roles, members. Relational, few writes, needs strong consistency.
- **Presence (Redis):** 10M users × a heartbeat every 40s ≈ 250K writes/sec, ephemeral data with TTL. Writing it to a DB is waste.
- **Kafka → ES / Read State:** ~180K msgs/sec peak, **two independent consumer groups** (search indexer, mention counter), and **replay** to build a new index. SQS has neither replay nor multi-consumer. Produce to Kafka after the Scylla write, retry on failure (or use ScyllaDB CDC).
- **Elasticsearch:** FR4, full-text search over PBs, index sharded by guild_id. Scylla cannot do text search.
- **Voice SFU:** media on a separate path, no load on the text system (high level only).

**FR → component:** FR1 → API + Message Service + ScyllaDB + Guild Service + Gateways. FR2 → ScyllaDB buckets. FR3 → Kafka + Read State + Presence Redis. FR4 → Kafka + Elasticsearch.

## Step 7: Main flow: sending a message in a channel

```mermaid
sequenceDiagram
  participant U as Sender
  participant A as API Service
  participant M as Message Service
  participant DB as ScyllaDB
  participant G as Guild Service
  participant W as Gateway Servers
  participant R as Receivers
  U->>A: POST message, nonce n1
  A->>M: check permission SEND_MESSAGES
  M->>DB: INSERT channel 42, bucket, snowflake id
  DB-->>M: OK
  M-->>U: 200 messageId
  M->>G: RPC MESSAGE_CREATE to owner of guild 9
  G->>G: find online sessions who can view channel 42
  G->>W: batch send per gateway server
  W->>R: WebSocket push MESSAGE_CREATE
```

The Guild Service sends **a single batch** to each gateway (with the list of all receivers on that gateway). Not 100K individual calls, but ~100 calls.

## Step 8: Data model & DB choice

```sql
-- ScyllaDB / Cassandra
messages(
  channel_id bigint, bucket int, message_id bigint,
  author_id bigint, content text, mentions list<bigint>, attachments text,
  PRIMARY KEY ((channel_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
-- bucket = message_id timestamp / 10 days

read_states(user_id bigint, channel_id bigint, last_read_id bigint, mention_count int,
  PRIMARY KEY (user_id, channel_id));
```

```sql
-- Postgres
guilds(id PK, name, owner_id)
channels(id PK, guild_id, type, name, position)
members(guild_id, user_id, role_ids[], PRIMARY KEY(guild_id, user_id))
roles(id PK, guild_id, permissions BIGINT, position)
```

- **Snowflake ID** (41-bit time + worker + sequence): globally unique, time-sortable. `ORDER BY message_id` = time order, so no separate `created_at` index is needed.
- **Why time buckets:** without a bucket, a busy channel's partition grows to GBs over the years (a hot, huge partition). A 10-day bucket keeps the partition size bounded.
- History load: `message_id < before LIMIT 50` from the latest bucket; if it is empty, go to the previous bucket.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 How is this different from WhatsApp? How does fan-out work?
**NFR:** p99 < 300ms delivery, 100K-member channels.
- WhatsApp: a group has max ~1K members, and each message is copied into every member's inbox (fan-out on write). An offline user reads their inbox later.
- Discord: a channel has 100K+ members. A copy for each one = storage explosion. So **the message is stored once in the channel**, and fan-out is only a live push to **online + subscribed sessions of that guild**.
- When an offline user comes back, they read the channel history with `before/after`. No inbox needed.
- Guild-based sharding: a hash of `guild_id` maps to one Guild Service process (consistent hashing). All events of that guild come out of one place, so ordering is simple.

> **Say:** "Fan-out on write is fine for small groups, but for big channels I store once and push to online users. Offline users pull."

**Trade-off:** an offline user gets no "inbox" and must fetch history. In return, storage goes from N copies to 1.

### 9.2 Hot guilds (a server with 1M members)
**NFR:** latency + availability even under one hot guild's load.
- One Guild process gets overloaded. **Relay layer:** the Guild process hands the message to 10–20 relay nodes, and each relay handles a few gateways (tree fan-out).
- **Lazy guilds:** in big servers we do not send the full member list to the client. The client subscribes only to the channel and the visible range of the member list (`memberListRange 0-99`).
- Typing/presence events are **throttled or turned off** in big guilds.
- Per-channel slow mode (1 msg / 10 sec per user) and a message rate limit.

```mermaid
flowchart TD
  M["Message in hot guild"] --> GP["Guild process"]
  GP --> R1["Relay 1"]
  GP --> R2["Relay 2"]
  GP --> R3["Relay N"]
  R1 --> G1["Gateways 1-10"]
  R2 --> G2["Gateways 11-20"]
  R3 --> G3["Gateways ..."]
```

**Trade-off:** the relay tree adds a hop (a little latency), and big guilds get fewer typing/presence features.

### 9.3 Unread counts and mentions
**NFR:** scale, no write per member for badges.
- **Unread dot:** the client has the channel's `last_message_id`. If `last_message_id > read_state.last_read_id`, it is unread. No need to store a count.
- **Mention badge:** if a message has `@user`, the Read State Service (a Kafka consumer) does `mention_count++` for that user. For `@everyone` in a big server, do not increase every member's counter; compute it on the client or cap it.
- The user opens the channel → `POST /ack` → update `last_read_id`, `mention_count = 0`. Batch/debounce these writes.

**Trade-off:** the mention badge is async and may arrive a few seconds late.

### 9.4 Presence at scale
**NFR:** scale, presence events must not be N².
- Naive: send every status change to all friends + guild members → in a 1M-member guild, one user coming online means 1M events. Impossible.
- **Lazy presence:** send only to clients that subscribed to that member list range (it is visible on their screen). Fetch on demand for the rest.
- Heartbeat every ~40 sec. If missed, mark offline after a grace period. `presence:{userId}` in Redis with a TTL.

**Trade-off:** off-screen members' status is not updated live, it is fetched on demand.

### 9.5 Permissions, voice, search (short)
**NFR:** correctness (only allowed people see it) + FR4.
- **Permissions:** a role's `permissions` is a 64-bit bitmask (VIEW_CHANNEL, SEND_MESSAGES...). Effective = OR of guild roles, then apply channel overwrites (deny/allow). Cached in the Guild Service, checked at fan-out time.
- **Voice:** the client connects to the nearest **SFU** media server with WebRTC. The SFU forwards each speaker's stream (it does not mix). Signaling goes through the gateway, media goes over UDP through the SFU. Zero load on the text path.
- **Search:** Kafka → indexer → Elasticsearch, index sharded by guild_id. Permission filter at query time (only visible channels).

**Trade-off:** the search index can lag by seconds, a new message is not searchable instantly.

## Step 10: Decision table (what we chose, why, what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **ScyllaDB, partition `(channel_id, bucket)`** | 60K writes/sec, bounded partitions, fast range scans | **Postgres:** manual sharding at 60K writes/sec and PBs. **Partition by channel_id only:** hot, unbounded. Sacrifice: no joins/transactions, fixed query patterns |
| **Store once, push to online** | Saves storage and writes in big channels | **Per-user inbox (WhatsApp style):** 100K copies per message. Sacrifice: offline users pull history |
| **Guild-sharded Guild Service, direct RPC** | One guild's state in one place, simple ordering and permission checks | **Every gateway hears everything:** waste. **Pub/sub topic per guild:** an extra hop, the owner is already known. Sacrifice: a hot guild sits on one process, needs a relay tree |
| **Kafka for search + mentions** | ~180K/sec peak, 2 consumer groups, replay for reindex | **SQS:** no replay, a separate copy per consumer. **Sync in the send path:** higher latency. Sacrifice: Kafka ops, search seconds late |
| **Redis for presence** | ~250K heartbeats/sec, auto offline via TTL | **Postgres/Scylla:** durable writes for ephemeral data are waste. Sacrifice: presence rebuilt (from heartbeats) after a Redis restart |
| **Snowflake IDs** | Time-sortable, coordination-free, simple pagination | **UUID:** cannot be sorted. **DB auto-increment:** not distributed. Sacrifice: must watch clock skew |
| **Lazy presence + member list ranges** | Events go only to people who can see them | **Broadcast presence:** N² events. Sacrifice: off-screen status is stale |
| **REST send, WebSocket receive** | Simple auth, rate limit, retry | **Everything over WebSocket:** heavy gateway. Sacrifice: a little extra latency on send |
| **SFU for voice** | No mixing on the server, cheap CPU | **MCU:** mixing is costly. **P2P mesh:** bandwidth runs out with 5+ people. Sacrifice: more download on the client |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle it |
|---|---|---|
| Gateway server crash | 100K users disconnect | Client reconnects with exponential backoff + jitter, `RESUME` with the last sequence replays missed events |
| Guild Service process down | Live events for that guild stop | Restart on another node, rebuild state from Postgres/cache. Clients fill gaps by fetching history |
| Hot guild | One process overloaded | Relay tree, lazy member list, typing/presence off |
| ScyllaDB hot partition | One busy channel is slow | Time buckets, read cache for the latest messages, request coalescing |
| Thundering herd after an outage | Everyone reconnects at once | Jittered backoff, connection rate limit on the gateway |
| Spam / raid | Channel flood | Per-user, per-channel rate limits, slow mode, new-account limits |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- A **data services layer** in front of ScyllaDB: coalesce parallel reads of the same channel (this is what Discord did)
- Move old buckets to cold storage (S3 + Parquet), keep the latest in ScyllaDB
- Multi-region gateways, users connect to the nearest region
- Moderation pipeline: ML spam/abuse detection from Kafka

## Step 13: Likely follow-up questions

- "Why not a per-user inbox like WhatsApp?" → copies explode in big channels, so store once + push to online (Step 9.1)
- "The user was offline and came back, how do we know what they missed?" → read state's `last_read_id` vs the channel's latest id, then fetch history
- "How is message ordering handled?" → Snowflake ID, one channel goes through one guild process, the client sorts by ID
- "Are events lost on a gateway crash?" → session `RESUME` with the sequence number, replay from a short buffer, otherwise fetch history
- "@everyone with 1M members?" → do not increase every counter, compute on the client, restrict it in big servers
- "How does voice scale?" → SFU nodes per region, one voice channel on one SFU
- **Senior signal:** raise on your own that the real bottleneck is **hot guild fan-out** (1 msg × 100K online = 100K pushes, on one process) and the **reconnect storm of 10M clients** after an outage. Plan: relay tree, lazy member lists, typing/presence off, jittered backoff + a gateway connection rate limit.

## 2-minute recap (read this before the interview)

> Discord's model is guild → channel → message. The difference from WhatsApp: channels are huge and history is shared, so a message is stored once in ScyllaDB with a `(channel_id, bucket)` partition and Snowflake `message_id` clustering. Send via REST, receive via WebSocket gateways. The Message Service stores the message and sends an RPC to the guild's owner Guild Service (no separate pub/sub). The Guild Service (sharded by guild_id) knows who is online and who can see the channel, and sends a batch to each gateway. For hot guilds: relay tree, lazy member list, typing/presence throttling. Unread = last_message_id > last_read_id, the mentions counter comes from a Kafka consumer. Presence is lazy, only for visible members. Permissions are a role bitmask + channel overwrites. Search is Elasticsearch via Kafka (180K/sec, 2 consumers, replay). Voice goes through a WebRTC SFU, on a separate path.

## Checklist

- [ ] I can explain the fan-out difference between Discord and WhatsApp
- [ ] I can explain why the ScyllaDB partition key is `(channel_id, bucket)` and why Snowflake IDs
- [ ] I can draw the gateway → Guild Service → gateway batch fan-out flow
- [ ] I can explain the relay tree and lazy member list for hot guilds
- [ ] I can explain the logic for unread counts and mention badges
- [ ] I can explain why lazy presence is needed
- [ ] I can explain RESUME and the reconnect strategy on a gateway crash
- [ ] I can tell the SFU vs MCU vs P2P trade-off for voice
