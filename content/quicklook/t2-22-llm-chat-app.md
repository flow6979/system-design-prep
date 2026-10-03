**Ek line:** POST → SSE token stream; GPU mehenga bottleneck hai, isliye router, priority queue + admission control, prefix KV cache, rate limits.

- **Requirements:** token-by-token streaming, conversation save, RAG/moderation; GPU cost control.
- **Scale:** ~6K req/sec avg (peak 20K), ~2 lakh concurrent streams, ~3,000+ GPUs, ~1.5 TB/day messages.
- **Components:** Chat Service (context build), moderation, model Router, in-memory priority queue, inference nodes, DynamoDB/Cassandra, Kafka usage events, Redis limits.
- **SSE over WebSocket/polling:** one-way, simple HTTP, auto-reconnect; stop ke liye alag POST.
- **In-memory priority queue + admission control over direct GPU/Kafka:** spike pe OOM nahi; paid priority.
- **Model routing small vs large:** 5-10x bachat; galat route = weak jawab.
- **Summary + recent turns over full history:** token cost kam; summary lossy.
- **Prefix/KV cache + sticky routing over random LB:** TTFT kam; hot nodes ka risk.
- **DynamoDB/Cassandra for messages, Kafka for usage (3 consumers):** billing sync nahi.
- **Failure:** node crash mid-stream → doosre node pe retry; moderation down → high-risk pe fail closed.
- **Senior signal:** concurrency KV-cache memory se limited hai, FLOPs se nahi; admission control KV headroom pe.

**Interview me bolo:** "Storage aur API servers saste hain; GPU bottleneck aur cost hai. Isliye focus routing, caching, batching aur rate limits pe."

**Galti mat karna:** Har request seedha GPU pe mat bhejo; poori chat history har turn mat bhejo.
