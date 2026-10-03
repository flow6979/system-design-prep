**In one line:** POST → SSE token stream; the GPU is the expensive bottleneck, so use a router, priority queue + admission control, prefix KV cache and rate limits.

- **Requirements:** token-by-token streaming, saved conversations, RAG/moderation; GPU cost control.
- **Scale:** ~6K req/sec avg (peak 20K), ~200K concurrent streams, ~3,000+ GPUs, ~1.5 TB/day of messages.
- **Components:** Chat Service (context build), moderation, model Router, in-memory priority queue, inference nodes, DynamoDB/Cassandra, Kafka usage events, Redis limits.
- **SSE over WebSocket/polling:** one-way, plain HTTP, auto-reconnect; separate POST to stop.
- **In-memory priority queue + admission control over direct GPU/Kafka:** no OOM on spikes; paid priority.
- **Model routing small vs large:** 5-10x savings; a wrong route gives a weak answer.
- **Summary + recent turns over full history:** lower token cost; summary is lossy.
- **Prefix/KV cache + sticky routing over random LB:** lower TTFT; risk of hot nodes.
- **DynamoDB/Cassandra for messages, Kafka for usage (3 consumers):** billing is not synchronous.
- **Failure:** node crash mid-stream → retry on another node; moderation down → fail closed on high-risk categories.
- **Senior signal:** GPU concurrency is limited by KV-cache memory, not FLOPs; admit based on KV headroom.

**Say in the interview:** "Storage and API servers are cheap; the GPU is the bottleneck and the cost. So I focus on routing, caching, batching and rate limits."

**Avoid:** Sending every request straight to the GPU; resending the full chat history each turn.
