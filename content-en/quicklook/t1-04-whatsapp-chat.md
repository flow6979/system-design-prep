**In one line:** WebSocket connection servers plus a Redis session registry for routing, messages persisted in Cassandra with a per-chat seq_no, at-least-once delivery with clientMsgId dedup.

- **Requirements:** 1:1 + group (max 1000), offline + push, sent/delivered/read ticks, presence, media; no loss after "sent".
- **Scale:** 500M DAU, ~200M connections (~1,000 servers), 600K msgs/sec (peak 1.5M), ~10 TB/day, ~300K async events/sec.
- **Components:** L4 LB, Connection Servers, stateless Message Service, Redis (registry + seq), Cassandra, Kafka, S3 + CDN.
- **WebSocket over polling/SSE:** bidirectional, one connection; cost is stateful servers and reconnect storms.
- **Registry + direct RPC over broadcast:** targeted delivery; Pub/Sub is fire-and-forget, so durability comes from the DB.
- **Per-chat seq_no over timestamps/global seq:** client clocks differ, global seq is a bottleneck; gap detection comes free.
- **At-least-once + dedup over exactly-once:** `IF NOT EXISTS` on `clientMsgId`, receiver dedups by `message_id`.
- **Receipts:** `last_delivered_seq`/`last_read_seq` per user per chat, not per-message rows.
- **Groups:** one stored copy, fan-out on write via Kafka keyed by chat_id; presence = heartbeat + 30s TTL.
- **Senior signal:** Redis failover can repeat a seq; `(chat_id, seq) IF NOT EXISTS` fails → take a new seq.

**Say in the interview:** "I persist first, then send the sent tick, then route via the registry to the receiver's server. If offline, Kafka drives push and the client syncs with afterSeq on reconnect."

**Avoid:** Asking for global ordering when per-chat is enough; making delivery depend on routing instead of the DB.
