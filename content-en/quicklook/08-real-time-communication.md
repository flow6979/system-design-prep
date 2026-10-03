**In one line:** Get new server data to the client instantly without the client asking repeatedly: polling, SSE or WebSocket.

- **Short polling:** GET every N sec; rare updates, simple (order status).
- **Long polling:** request held open until data arrives; a fallback, not the default.
- **SSE:** server → client only, built-in reconnect, plain HTTP. Live scores, notifications, LLM streaming.
- **WebSocket:** full-duplex. Chat, games, collaborative editing.
- **Gateway layer:** WebSockets are stateful; gateways only hold connections (50K–1M each), logic lives in a stateless chat service.
- **Session registry:** Redis `user → gateway`, with TTL.
- **Cross-gateway routing:** registry + RPC, Redis Pub/Sub, or consistent hashing. Pub/Sub isn't durable, so save to DB first.
- **Offline:** DB plus push (APNs/FCM); on reconnect sync via `last_seen_msg_id`.
- **Presence:** ~30 sec heartbeat, Redis TTL 60 sec; expiry = offline. Fan out presence only to contacts.
- **Scale:** 10M users / 100K per server ≈ 100 gateways, L4 LB, event-loop servers.
- **Reconnect storm:** client exponential backoff + jitter; drain connections slowly on deploy.

**Say in the interview:** "Chat is bidirectional so WebSocket, with a separate gateway layer and a Redis registry. Cross-gateway via Redis Pub/Sub, but the message is persisted to DB first. SSE is enough for one-way push."

**Avoid:** WebSocket for everything, or treating Redis Pub/Sub as durable. Presence without heartbeat + TTL.
