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

**Ek line me:** users servers (guilds) join karte hain, har server me channels hote hain, aur channel me real-time messages aate hain. Core challenge ye hai ki **ek message 1 lakh+ members wale channel me sabko turant dikhe**, aur purani history fast load ho.

**Is question me interviewer kya check karta hai:** WhatsApp se farak samajhna (group bahut bada, history read-heavy), WebSocket gateway design, per-channel fan-out, Cassandra/ScyllaDB partition design, unread counts, aur presence ko scale pe sasta rakhna.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Scope me servers, text channels, DMs, mentions? Voice/video?" | Text core, voice high level | Voice ke liye alag SFU path, text pe focus |
| "Ek server me max kitne members? Ek channel kitna bada?" | Kuch servers 10 lakh+ members, channel 1 lakh+ online | WhatsApp jaisa per-user inbox nahi, per-channel fan-out |
| "Message history kitni purani rakhni hai?" | Hamesha, scroll back kar sako | Time-bucketed partitions, cold data cheap storage |
| "Ordering kitni strict?" | Ek channel ke andar ordered | Snowflake ID per message, channel ke andar sort |
| "Unread count aur @mentions chahiye?" | Haan, badge dikhna chahiye | Read state per user per channel |
| "Presence (online/offline) sabka dikhana hai?" | Sirf jo member list visible hai | Lazy presence, sabko broadcast nahi |
| "Search, permissions/roles?" | Haan | Elasticsearch, role bitmask |

> **Bolo:** "Ye WhatsApp se alag hai. WhatsApp me groups chhote hain aur har user ka inbox hota hai. Yahan channels bahut bade hain aur history shared hai, isliye main message ek baar channel me store karunga aur fan-out sirf online logon ko live push ke liye karunga."

## Step 2: Requirements

**Functional**
1. User server join karke channel me message bhej sake, aur jinke paas permission hai unhe real-time dikhe
2. User channel history scroll kar sake (pagination, purana bhi)
3. User unread / @mention badges aur visible members ki presence dekh sake
4. User apne servers me messages search kar sake (sirf jo channels woh dekh sakta hai)

**Out of scope:** voice/video internals (sirf SFU high level), DMs, threads, bots, file upload pipeline, moderation ML.

**Non-functional (priority order me)**
1. **Durability:** acknowledged message kabhi lost nahi
2. **Latency:** message delivery p99 < 300ms online members tak
3. **Availability:** 99.99% send/receive, history read-heavy
4. **Scale:** ~100M MAU, ~10M concurrent WebSockets, ~60K msgs/sec avg (peak ~180K)
5. **Ordering:** sirf ek channel ke andar

**CAP choice:** **AP** with per-channel ordering. Partition me thoda late message chalega, send fail nahi. Strong consistency sirf Postgres wale metadata (roles, membership) me.

## Step 3: Estimation (sirf jo design badle)

- ~10M concurrent connections. Ek gateway server ~100K connections → **~100+ gateway servers**. Sticky WebSocket, stateful layer.
- ~5B messages/day ≈ **60K writes/sec** avg, peak 3x. Single SQL DB nahi chalega → Cassandra/ScyllaDB.
- Storage: 5B × 1KB ≈ **5TB/day**, saalon ka data petabytes me. Purana data cold tier pe.
- Fan-out: 1 message × 1 lakh online members = 1 lakh pushes. Ek bada server 1 msg/sec bhi kare to 1 lakh pushes/sec. **Hot guild hi asli problem hai.**

> **Bolo:** "Write throughput ke liye wide-column store chahiye, aur bade channels me fan-out cost message count se nahi, member count se decide hoti hai."

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

> **Bolo:** "Send REST se karta hoon (rate limit aur auth simple), aur receive WebSocket gateway se. `nonce` client-generated hai, isse retry pe duplicate message nahi banta."

## Step 6: High-level design

**Simple v1 pehle:** client → API → ek Postgres (messages table), aur ek WebSocket server jo naya message us channel ke connected users ko push kare. Chhote Slack workspace ke liye ye chal jaata hai. Ise todte hain: **10M concurrent connections** (100+ gateways, to kis gateway ko bhejna hai ye kisi ko pata hona chahiye → Guild Service), **60K writes/sec + PBs history** (ScyllaDB), **1 lakh member channels** (store once, push to online), aur **search** (Elasticsearch).

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

**Har component kyun:**
- **Gateway servers:** 10M connections ÷ ~100K per server = 100+ servers. Stateful, isliye sirf connection + subscription, business logic nahi.
- **Message Service:** permission check, Snowflake ID, ScyllaDB me write, phir Guild Service ko RPC.
- **Guild Service (sharded by guild_id):** ek guild ka state (online sessions, kaun kaunsa channel dekh raha) ek process me, yahi decide karta hai kis gateway ko kya bhejna hai. Simpler option "har gateway har message sune" = 60K msgs/sec × 100+ gateways, waste. Beech me alag pub/sub layer nahi rakhi: owner process consistent hashing se pata hai, seedha RPC ek hop kam.
- **ScyllaDB:** 60K writes/sec (peak 180K), 5TB/day. `(channel_id, bucket)` partition se history fast. Postgres pe itna write + PBs = manual sharding pain.
- **Postgres:** guilds, roles, members. Relational, kam writes, strong consistency chahiye.
- **Presence (Redis):** 10M users × heartbeat/40s ≈ 250K writes/sec, TTL wala ephemeral data. DB me likhna bekar.
- **Kafka → ES / Read State:** ~180K msgs/sec peak, **do independent consumer groups** (search indexer, mention counter), aur naya index banane ke liye **replay**. SQS me replay aur multi-consumer nahi. Kafka produce Scylla write ke baad, fail pe retry (ya ScyllaDB CDC se).
- **Elasticsearch:** FR4, PBs pe full-text search, index sharded by guild_id. Scylla me text search possible nahi.
- **Voice SFU:** media alag path pe, text system pe load nahi (high level only).

**FR → component:** FR1 → API + Message Service + ScyllaDB + Guild Service + Gateways. FR2 → ScyllaDB buckets. FR3 → Kafka + Read State + Presence Redis. FR4 → Kafka + Elasticsearch.

## Step 7: Main flow: channel me message bhejna

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

Guild Service har gateway ko **ek hi batch** bhejta hai (us gateway ke saare receivers ki list ke saath). 1 lakh individual calls nahi, ~100 calls.

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

- **Snowflake ID** (41-bit time + worker + sequence): globally unique, time-sortable. `ORDER BY message_id` = time order, alag `created_at` index ki zarurat nahi.
- **Time bucket** kyun: bina bucket ke ek busy channel ka partition saalon me GBs ka ho jaata hai (hot, bada partition). 10-day bucket se partition size bounded rehta hai.
- History load: latest bucket se `message_id < before LIMIT 50`, khali ho to pichla bucket.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 WhatsApp se kya alag hai? Fan-out kaise?
**NFR:** p99 < 300ms delivery, 1 lakh member channels.
- WhatsApp: group max ~1K, har message har member ke inbox me copy (fan-out on write). Offline user baad me apna inbox padhta hai.
- Discord: channel me 1 lakh+ members. Har ek ke liye copy = storage explosion. Isliye **message ek baar channel me store**, aur fan-out sirf **online + us guild ke subscribed sessions** ko live push.
- Offline user aaye to channel history `before/after` se padh leta hai. Inbox ki zarurat nahi.
- Guild-based sharding: `guild_id` hash se Guild Service ka ek process (consistent hashing). Saare events us guild ke ek jagah se nikalte hain, ordering simple.

> **Bolo:** "Chhote groups me fan-out on write theek hai, par bade channels me main store once, push to online karta hoon. Offline users pull karte hain."

**Trade-off:** offline user ko "inbox" nahi milta, history fetch karni padti hai. Badle me storage N copies se 1 copy.

### 9.2 Hot guilds (10 lakh members wala server)
**NFR:** latency + availability ek hot guild ke load me bhi.
- Ek Guild process overload ho jaata hai. **Relay layer:** Guild process message ko 10–20 relay nodes ko deta hai, har relay kuch gateways ko sambhalta hai (tree fan-out).
- **Lazy guilds:** bade servers me client ko poori member list nahi bhejte. Client sirf channel aur member list ka visible range subscribe karta hai (`memberListRange 0-99`).
- Typing/presence events bade guilds me **throttle ya band**.
- Per-channel slow mode (1 msg / 10 sec per user) aur message rate limit.

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

**Trade-off:** relay tree ek extra hop (thodi latency) jodta hai, aur bade guilds me typing/presence features kam ho jaate hain.

### 9.3 Unread counts aur mentions
**NFR:** scale, badges ke liye har member pe write nahi.
- **Unread dot:** client ke paas channel ka `last_message_id` hai. Agar `last_message_id > read_state.last_read_id` to unread. Count store nahi karna padta.
- **Mention badge:** message me `@user` ho to Read State Service (Kafka consumer) us user ka `mention_count++`. `@everyone` bade server me har member ka counter nahi badhate, client side compute ya cap karo.
- User channel kholta hai → `POST /ack` → `last_read_id` update, `mention_count = 0`. Writes batch/debounce karo.

**Trade-off:** mention badge async hai, kuch seconds late aa sakta hai.

### 9.4 Presence at scale
**NFR:** scale, presence events N² na hon.
- Naive: har status change sabke friends + guild members ko → 10 lakh member guild me ek user online hua to 10 lakh events. Impossible.
- **Lazy presence:** sirf un clients ko bhejo jinhone us member list range ko subscribe kiya hai (screen pe dikh raha hai). Baaki ke liye on-demand fetch.
- Heartbeat har ~40 sec. Miss hua to grace period ke baad offline. Redis me `presence:{userId}` with TTL.

**Trade-off:** off-screen members ka status turant updated nahi, on-demand fetch hota hai.

### 9.5 Permissions, voice, search (short)
**NFR:** correctness (sirf allowed log dekhein) + FR4.
- **Permissions:** role ka `permissions` ek 64-bit bitmask (VIEW_CHANNEL, SEND_MESSAGES...). Effective = guild roles OR, fir channel overwrites (deny/allow) apply. Guild Service me cached, fan-out time pe check.
- **Voice:** client WebRTC se nearest **SFU** media server se connect karta hai. SFU har speaker ka stream forward karta hai (mix nahi karta). Signaling gateway se, media UDP pe SFU se. Text path pe zero load.
- **Search:** Kafka → indexer → Elasticsearch, index sharded by guild_id. Permission filter query time pe (sirf visible channels).

**Trade-off:** search index seconds peeche ho sakta hai, naya message turant search me nahi.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **ScyllaDB, partition `(channel_id, bucket)`** | 60K writes/sec, partition bounded, range scan fast | **Postgres:** 60K writes/sec aur PBs pe manual sharding. **Sirf channel_id partition:** hot, unbounded. Sacrifice: joins/transactions nahi, query patterns fixed |
| **Store once, push to online** | Bade channels me storage aur writes bachte hain | **Per-user inbox (WhatsApp style):** 1 lakh copies per message. Sacrifice: offline user history pull kare |
| **Guild-sharded Guild Service, direct RPC** | Ek guild ka state ek jagah, ordering aur permission check simple | **Har gateway sab sune:** waste. **Pub/sub topic per guild:** extra hop, owner pehle se pata. Sacrifice: hot guild ek process pe, relay tree chahiye |
| **Kafka for search + mentions** | ~180K/sec peak, 2 consumer groups, replay for reindex | **SQS:** replay nahi, har consumer ke liye alag copy. **Sync in send path:** latency badhe. Sacrifice: Kafka ops, search seconds late |
| **Redis for presence** | ~250K heartbeats/sec, TTL se auto offline | **Postgres/Scylla:** ephemeral data pe durable writes waste. Sacrifice: Redis restart pe presence rebuild (heartbeats se) |
| **Snowflake IDs** | Time-sortable, coordination-free, pagination simple | **UUID:** sort nahi hota. **DB auto-increment:** distributed nahi. Sacrifice: clock skew ka dhyan |
| **Lazy presence + member list ranges** | Events sirf visible logon ko | **Broadcast presence:** N² events. Sacrifice: off-screen status stale |
| **REST send, WebSocket receive** | Auth, rate limit, retry simple | **Sab WebSocket pe:** gateway heavy. Sacrifice: send pe thoda extra latency |
| **SFU for voice** | Server pe mixing nahi, CPU sasta | **MCU:** mixing costly. **P2P mesh:** 5+ log me bandwidth khatam. Sacrifice: client pe zyada download |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Gateway server crash | 100K users disconnect | Client exponential backoff + jitter se reconnect, `RESUME` with last sequence se missed events replay |
| Guild Service process down | Us guild ke live events ruk gaye | Dusre node pe restart, state Postgres/cache se rebuild. Clients history fetch karke fill karein |
| Hot guild | Ek process overload | Relay tree, lazy member list, typing/presence off |
| ScyllaDB hot partition | Ek busy channel slow | Time buckets, read cache for latest messages, request coalescing |
| Thundering herd after outage | Sab ek saath reconnect | Jittered backoff, gateway pe connection rate limit |
| Spam / raid | Channel flood | Per-user, per-channel rate limits, slow mode, new-account limits |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Data services layer** ScyllaDB ke aage: same channel ki parallel reads ko coalesce karna (Discord ne yahi kiya)
- Purane buckets ko cold storage (S3 + Parquet) pe move karna, latest ScyllaDB me
- Multi-region gateways, users nearest region se connect
- Moderation pipeline: Kafka se ML spam/abuse detection

## Step 13: Interviewer ke likely follow-up sawal

- "WhatsApp jaisa per-user inbox kyun nahi?" → bade channels me copies explode, store once + online push (Step 9.1)
- "User offline tha, wapas aaya, kya miss hua kaise pata?" → read state ka `last_read_id` vs channel ka latest id, history fetch
- "Message ordering kaise?" → Snowflake ID, ek channel ek guild process se, client ID se sort kare
- "Gateway crash pe events lost?" → session `RESUME` with sequence number, short buffer replay, nahi to history fetch
- "@everyone 10 lakh members pe?" → har counter mat badhao, client compute, bade servers me restrict
- "Voice kaise scale?" → SFU nodes regionally, ek voice channel ek SFU pe
- **Senior signal:** khud bolo ki asli bottleneck **hot guild fan-out** hai (1 msg × 1 lakh online = 1 lakh pushes, ek process pe) aur outage ke baad **10M clients ka reconnect storm**. Plan: relay tree, lazy member lists, typing/presence off, jittered backoff + gateway connection rate limit.

## 2-minute recap (interview se pehle ye padho)

> Discord ka model guild → channel → message hai. WhatsApp se farak: channels bahut bade aur history shared, isliye message ek baar ScyllaDB me `(channel_id, bucket)` partition aur Snowflake `message_id` clustering ke saath store hota hai. Send REST se, receive WebSocket gateways se. Message Service store karke guild ke owner Guild Service ko RPC karta hai (alag pub/sub nahi). Guild Service (sharded by guild_id) jaanta hai kaun online hai aur kaun channel dekh sakta hai, aur har gateway ko batch bhejta hai. Hot guilds ke liye relay tree, lazy member list, typing/presence throttle. Unread = last_message_id > last_read_id, mentions counter Kafka consumer se. Presence lazy, sirf visible members ki. Permissions role bitmask + channel overwrites. Search Elasticsearch via Kafka (180K/sec, 2 consumers, replay). Voice WebRTC SFU se, alag path.

## Checklist

- [ ] Discord aur WhatsApp ke fan-out ka farak samjha sakta hoon
- [ ] ScyllaDB partition key `(channel_id, bucket)` aur Snowflake ID kyun, bata sakta hoon
- [ ] Gateway → Guild Service → gateway batch fan-out flow bana sakta hoon
- [ ] Hot guild ke liye relay tree aur lazy member list explain kar sakta hoon
- [ ] Unread count aur mention badge ka logic bata sakta hoon
- [ ] Lazy presence kyun zaroori hai samjha sakta hoon
- [ ] Gateway crash pe RESUME aur reconnect strategy bata sakta hoon
- [ ] Voice ke liye SFU vs MCU vs P2P trade-off bol sakta hoon
