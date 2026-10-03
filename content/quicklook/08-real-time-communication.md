**Ek line:** Server ke paas naya data aate hi client tak turant pahunchana, bina client ke baar-baar poochhe: polling, SSE ya WebSocket.

- **Short polling:** har N sec GET; rare updates, simple (order status).
- **Long polling:** request open jab tak data na aaye; fallback, default nahi.
- **SSE:** server → client only, auto-reconnect, plain HTTP. Live score, notifications, LLM streaming.
- **WebSocket:** full-duplex. Chat, games, collaborative editing.
- **Gateway layer:** WebSocket stateful hai; gateways sirf connections (50K–1M each), logic stateless chat service me.
- **Session registry:** Redis `user → gateway`, TTL ke saath.
- **Cross-gateway routing:** registry + RPC, Redis Pub/Sub, ya consistent hashing. Pub/Sub durable nahi, pehle DB me save.
- **Offline:** DB + push (APNs/FCM); reconnect pe `last_seen_msg_id` se sync.
- **Presence:** ~30 sec heartbeat, Redis TTL 60 sec; expire = offline. Presence sirf contacts ko fan-out.
- **Scale:** 10M users / 100K per server ≈ 100 gateways, L4 LB, event-loop servers.
- **Reconnect storm:** client pe exponential backoff + jitter; deploy me slow drain.

**Interview me bolo:** "Chat dono taraf hai to WebSocket, alag gateway layer aur Redis registry. Cross-gateway Redis Pub/Sub, par message pehle DB me persist. One-way push ke liye SSE kaafi."

**Galti mat karna:** Har cheez ke liye WebSocket, ya Redis Pub/Sub ko durable maanna. Presence bina heartbeat + TTL ke.
