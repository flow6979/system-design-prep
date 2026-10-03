**Ek line:** WebSocket connection servers + Redis session registry se routing, per-chat seq_no ke saath Cassandra me persist, at-least-once + clientMsgId dedup.

- **Requirements:** 1:1 + group (max 1000), offline + push, sent/delivered/read ticks, presence, media; "sent" ke baad kabhi loss nahi.
- **Scale:** 500M DAU, ~200M connections (~1,000 servers), 600K msgs/sec (peak 1.5M), ~10 TB/day, ~300K async events/sec.
- **Components:** L4 LB, Connection Servers, stateless Message Service, Redis (registry + seq), Cassandra, Kafka, S3 + CDN.
- **WebSocket over polling/SSE:** bidirectional, ek connection; price: stateful servers, reconnect storms.
- **Registry + direct RPC over broadcast:** targeted delivery; Pub/Sub fire-and-forget hai, durability DB se.
- **Per-chat seq_no over timestamps/global seq:** client clocks alag, global seq bottleneck; gap detection free.
- **At-least-once + dedup over exactly-once:** `clientMsgId` pe `IF NOT EXISTS`, receiver `message_id` se dedup.
- **Receipts:** `last_delivered_seq`/`last_read_seq` per user per chat, per-message row nahi.
- **Groups:** ek copy store, fan-out on write via Kafka by chat_id; presence = heartbeat + TTL 30s.
- **Senior signal:** Redis failover pe seq repeat ho sakta hai; `(chat_id, seq) IF NOT EXISTS` fail → naya seq lo.

**Interview me bolo:** "Pehle DB me persist, phir sent tick, phir registry se receiver server pe route. Offline ho to Kafka se push, reconnect pe afterSeq sync."

**Galti mat karna:** Global ordering mat maango, per-chat chahiye; message ko routing pe depend mat karo, durability DB se.
