---
title: Design a ChatGPT-style LLM Chat App
order: 22
tier: 2
time: 22
patterns: [Streaming, Request queueing, Rate limiting, Caching, RAG, Model routing]
topics: [08-real-time-communication, 11-rate-limiting, 05-caching, 07-message-queues-kafka, 20-reliability-observability, 02-sql-vs-nosql]
askedAt: [OpenAI, Anthropic, Google, Microsoft, Meta, Amazon]
---

# Design a ChatGPT-style LLM Chat App

**In one line:** The user sends a message, the LLM **streams the answer token by token**, and the whole conversation is saved. The core challenge is that **GPUs are expensive and limited**, so you must use them well with queueing, rate limits, caching and routing.

**What the interviewer checks in this question:** streaming (SSE), context window management, scheduling and backpressure on the GPU fleet, per-tier rate limits, cost control, and the safety layer. This is a very common question in 2026.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Do we host the model ourselves or use a third-party API?" | Self-hosted, GPU fleet | We must design inference scheduling |
| "Should the response stream?" | Yes, token by token | SSE, long-lived connections |
| "Do we save conversation history? How long?" | Yes, unlimited threads | Need context window management |
| "Are there free and paid tiers?" | Yes, free/plus/enterprise | Per-tier rate limits and a priority queue |
| "Do we need file upload / knowledge base (RAG)?" | Basic RAG | Vector DB + retrieval step |
| "Images, voice, agents/tools?" | Out of scope | Mention them and move on |

> **Say:** "I will focus on 3 things: the chat streaming flow, using GPU capacity fairly and cheaply, and conversation + context management. I will also cover safety and observability."

## Step 2: Requirements

**Functional**
1. Users should be able to start a new chat, send a message, and get the answer streamed
2. Users should be able to list old conversations and continue them
3. Users should be able to stop a response midway and regenerate it
4. Users should be able to upload documents and ask questions about them (basic RAG)

**Out of scope:** images, voice, agents/tools, fine-tuning, chat sharing.

**Non-functional (in priority order)**
1. **TTFT (time to first token):** p50 < 1s, p99 < 3s for paid tiers
2. **Streaming:** ~30+ tokens/sec per user, smooth
3. **Availability:** 99.9%. Degrade gracefully under overload (queue/smaller model/429), do not crash
4. **Durability:** completed message history is never lost
5. **Cost:** high GPU utilization, low cost per query (the GPU is the bill)
6. **Safety:** block harmful input/output
7. **Scale:** 50M DAU, peak ~20K messages/sec, ~200K concurrent streams

**CAP choice:** **availability** for conversation history + read-your-writes within a conversation (same partition key). Usage/billing and rate-limit counters can be **eventual/approximate**: if the rate limiter is down, fail open with local limits.

## Step 3: Estimation (only what changes the design)

- 50M DAU × 10 messages = 500M/day ≈ **~6K req/sec avg, peak ~20K**.
- Each response is ~500 output tokens, ~10 sec of streaming. At peak, **~200K concurrent streams** are open.
- One GPU (H100 class) with batching gives ~2–3K output tokens/sec, so one GPU handles ~50–100 streams. For peak we need **~3,000+ GPUs**. GPU cost is the real bill.
- Conversation storage: 500M user + 500M assistant messages × ~1.5KB ≈ **~1.5TB/day** (~0.5PB/year), ~12K message writes/sec avg + partial checkpoints. Cheap, but too big for one Postgres → DynamoDB/Cassandra.
- Usage events: ~20K/sec at peak, with 3 consumers: billing, analytics, abuse detection.

> **Say:** "Storage and API servers are the cheap part. The bottleneck and the cost is the GPU, so most of my design is about using the GPU less and more smartly: routing, caching, batching, and rate limits."

## Step 4: Core entities

- **User**: id, tier (`FREE`, `PLUS`, `ENTERPRISE`), token quota
- **Conversation**: id, user_id, title, model, summary, created_at, updated_at
- **Message**: conversation_id, message_id, role (`user`, `assistant`, `system`), content, token_count, status (`STREAMING`, `DONE`, `STOPPED`, `FAILED`)
- **Document chunk** (RAG): id, user_id, doc_id, text, embedding
- **Usage record**: user_id, model, input_tokens, output_tokens, cost, ts

## Step 5: APIs

```http
POST /conversations                                → {conversationId}
GET  /conversations?cursor=...                     → list
GET  /conversations/{id}/messages?cursor=...       → messages
POST /conversations/{id}/messages {content, model?}
     Accept: text/event-stream
     → SSE stream: data: {"delta":"Hello"} ... data: {"done":true,"usage":{...}}
POST /conversations/{id}/messages/{msgId}/stop
POST /files {file}                                  → {fileId} (async indexing)
```

> **Say:** "The response to the message POST is itself the SSE stream. We do not need WebSocket because the stream goes in only one direction: server to client. Stop is a separate small API."

## Step 6: High-level design

**Start with a simple v1:** client → Chat Service (SSE) → one inference server, history in one Postgres, usage in a table there too. Every FR works. But **~200K concurrent streams = ~3,000 GPUs** (→ Model Router + priority queue + admission control), sending every question to the large model costs 5–10x more (→ small/large routing), **~1.5TB/day of messages** (→ DynamoDB/Cassandra), tiers and abuse (→ gateway rate limits in Redis), and usage has 3 consumers (→ Kafka).

```mermaid
flowchart LR
  C["Web or mobile client"] --> G["API Gateway - auth + rate limit"]
  G --> RL[("Redis - rate limit counters")]
  G --> CS["Chat Service - SSE + context builder"]
  CS --> DB[("Messages - DynamoDB or Cassandra")]
  CS --> VDB[("Vector DB - pgvector")]
  CS --> MOD["Safety - Moderation"]
  CS --> RT["Model Router + scheduler"]
  RT --> Q["In-memory priority queue per model"]
  Q --> SM["Small model GPU pool"]
  Q --> LM["Large model GPU pool"]
  CS --> K[["Kafka - usage events"]]
  K --> BILL["Billing"]
  K --> AN[("Analytics - ClickHouse")]
```

**Why each component:**
- **API Gateway + Redis:** auth, per-user/tier rate limits (requests/min and tokens/day). 20K req/sec spread over many gateway nodes, so the shared counters live in Redis. With local in-memory limits a user could bypass the limit by hitting different nodes.
- **Chat Service:** holds the SSE connection, forwards tokens, saves the message. **The context builder is a module inside it**, not a separate service: there is no reason to scale it separately, it would only add a hop.
- **Safety / Moderation:** a small classifier model on input/output. A separate service because it runs on its own GPU/CPU pool and scales separately.
- **Model Router + scheduler:** picks the small or large model and admits requests based on the pools' KV-cache capacity. The cost NFR (5–10x) and the overload NFR come from here.
- **In-memory priority queue (per model):** priority by tier, waits are only seconds. **Not Kafka/SQS:** the request is interactive and the client is waiting on SSE. A durable queue would only add latency; on a crash the client just retries.
- **DynamoDB/Cassandra:** ~1.5TB/day, ~12K writes/sec, and the only access pattern is "messages of one conversation in order". Postgres would need heavy sharding.
- **Vector DB (pgvector):** basic RAG, every query is filtered by `user_id` onto a small set. We already run Postgres (accounts); a separate Pinecone/Milvus only when chunks reach billions.
- **Kafka → Billing + ClickHouse:** **~20K usage events/sec, 3 independent consumers** (billing, analytics, abuse detection), and billing needs **replay** after a bug. So Kafka, not SQS (one message, one consumer). Latency metrics (TTFT) go through Prometheus, not Kafka.

**FR → component:** FR1 → Gateway + Chat Service + Router + GPU pools, FR2 → DynamoDB/Cassandra, FR3 → Chat Service cancel → Router → GPU, FR4 → pgvector + context builder.

## Step 7: Main flow: sending a message and streaming

```mermaid
sequenceDiagram
  participant U as User
  participant CS as Chat Service
  participant DB as Messages DB
  participant M as Moderation
  participant Q as Queue
  participant GPU as Inference Server
  U->>CS: POST message, SSE open
  CS->>DB: load summary and last turns for conv 42
  DB-->>CS: history
  CS->>CS: build context, system prompt plus summary plus turns plus RAG chunks
  CS->>M: check input
  M-->>CS: safe
  CS->>Q: enqueue, priority by tier
  Q->>GPU: dispatch when slot free
  GPU-->>CS: token stream
  CS-->>U: data delta tokens
  CS->>CS: buffer full reply, output moderation on chunks
  CS->>DB: save assistant message DONE
  CS-->>U: data done with usage
```

## Step 8: Data model & DB choice

```
conversations   PK: user_id, SK: updated_at#conv_id     -- list chats newest first
messages        PK: conversation_id, SK: message_id (time-sortable, ULID)
usage           Kafka → ClickHouse/warehouse (analytics + billing)
doc_chunks      Vector DB (pgvector / Pinecone / Milvus), filter by user_id
```

**DynamoDB/Cassandra** for messages: ~1.5TB/day, ~12K writes/sec, simple access pattern (messages of one conversation in order), easy horizontal scale. No transactions needed. User accounts, billing plans and pgvector chunks go in Postgres (small, relational). `token_count` is also on the message, so usage coming through Kafka can be reconciled for billing.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 Streaming: SSE and connection handling
**NFR: TTFT + smooth streaming, no lost partial answers.**

- **SSE** (an HTTP response that stays open, `text/event-stream`). Friendly to proxies/CDNs, auto-reconnect built in, server → client only. WebSocket is overkill.
- A gRPC stream between the Chat Service and the inference server. The Chat Service forwards tokens and buffers them at the same time.
- Checkpoint the partial message to the DB every ~N tokens, so if the client disconnects, the partial answer shows on reload. Whether generation keeps running in the background or stops is a product decision.
- **Stop button:** stop API → Chat Service sends a cancel signal to inference → GPU slot is freed right away. This saves cost.

**Trade-off:** ~200K long-lived connections mean Chat Service nodes must handle connection limits and graceful drain.

### 9.2 Context window management
**NFR: cost + TTFT (every input token costs money and latency).**

The model's context is limited (like 128K tokens), and every input token costs money and latency.
- **Sliding window / truncation:** system prompt + the last K turns that fit in the token budget.
- **Summarization:** build a running summary of old turns (with a small model, async), and store it in `conversation.summary`. Context = system prompt + summary + recent turns.
- **RAG:** chunk the user's documents and store embeddings in a vector DB. When a query comes in, use the query embedding to fetch the top 5 chunks and put them in the context. Not the whole document.
- Token budget order: system prompt > current message > RAG chunks > recent turns > summary. On overflow, cut from the bottom.
- File upload: S3 + an SQS job → embedding worker (retry + DLQ). One consumer, task distribution, so no Kafka needed.

**Trade-off:** a summary is cheap but lossy. The model sometimes forgets an old detail.

### 9.3 GPU fleet, queueing and model routing
**NFR: 99.9% availability under overload + GPU cost.**

- **Continuous batching:** the inference server runs many requests together in a batch, and new requests join midway. GPU utilization goes up 2–5x.
- **Admission control:** each model pool has limited capacity (KV cache memory). Make requests wait in a queue; if the queue gets too long, give the free tier "high demand, try later" (429) or a smaller model. Backpressure, not a crash.
- **Priority:** enterprise > plus > free. The free tier has a max queue wait limit.
- **Model routing:** a small classifier or rules: "hi", simple factual questions, title generation → small model (10x cheaper). Coding/reasoning/long questions → large model. If the user picked a model explicitly, use that.
- **Autoscaling:** GPUs scale slowly (loading a model takes minutes), so scale on queue depth + pre-warm on the daily pattern. Reserved capacity for peak.

**Trade-off:** at peak we give the free tier a worse experience (429/small model) to protect paid users' TTFT.

### 9.4 Caching, rate limits, cost and safety
**NFR: cost, no GPU waste from abuse, safety.**

- **Prompt caching (prefix/KV cache):** the system prompt and the start of the conversation are the same on every turn. If the inference server keeps the KV cache for that prefix, the next turn computes only the new tokens. Both TTFT and cost go down. That is why we **sticky-route the same conversation to the same GPU node**.
- **Response cache:** a semantic cache for exactly the same question (like "what is GST"), only for generic queries. Not for personal chats.
- **Rate limits:** token bucket per user per tier, in two dimensions: requests/min and tokens/day. Done at the gateway with Redis. Org-level quota for enterprise.
- **Cost control:** max output tokens per tier, routing to the small model, cancel on stop, prompt caching, usage dashboards and per-user cost alerts.
- **Safety:** a fast classifier on input (jailbreak, harmful). On output, check chunks while streaming; if something unsafe is found, stop the stream and send a safe message. Flag/ban abusive users. Mask PII in logs.

**Trade-off:** sticky routing raises cache hits but can make some GPU nodes hot. Output moderation adds a bit of latency and cost.

## Step 10: Decision table (what we chose, why, what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **SSE** for streaming | One-way stream, simple HTTP, works with proxies, auto-reconnect | **WebSocket:** we do not need bi-directional, more LB/infra complexity. **Polling:** will not feel token-by-token. Sacrifice: a separate POST for stop |
| **In-memory priority queue + admission control** | GPUs are limited, graceful degrade on overload, priority for paid users | **Straight to the GPU:** OOM/timeouts on a spike. **Kafka/SQS:** durability is useless for an interactive request, more latency. Sacrifice: on a router crash, queued requests must be retried by the client |
| **Model routing small vs large** | Many questions are simple, 5–10x cost saving | **Everything on large:** higher bill and latency. **Everything on small:** poor quality on hard questions. Sacrifice: a wrong route sometimes gives a weak answer |
| **Summary + recent turns** for context | Lower token cost, long chats still work | **Full history:** context overflow, every turn is expensive. Sacrifice: the summary is lossy |
| **Prefix/KV cache + sticky routing** | Saves compute on the repeated prefix, lower TTFT | **Random load balancing:** the full prefix is recomputed on every turn. Sacrifice: hot nodes, uneven load |
| **DynamoDB/Cassandra** for messages | ~1.5TB/day, ~12K writes/sec, simple key access | **Postgres:** heavy sharding at this scale, and we need no joins. Sacrifice: no ad-hoc queries/joins |
| **Kafka** for usage events | ~20K events/sec, 3 consumers, replay for billing | **SQS:** one message, one consumer, no replay. **Sync billing call:** slow billing makes chat slow. Sacrifice: ops cost of running a Kafka cluster |
| **Redis** for rate limits | Shared counters across many gateway nodes, sub-ms | **Local per-node limits:** users bypass them by switching nodes. Sacrifice: fail open when Redis is down, limits are approximate |
| **pgvector** for RAG | Basic RAG, small per-user set, we already run Postgres | **Pinecone/Milvus:** right for billions of chunks, an extra system today. Sacrifice: a migration at very large scale |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle it |
|---|---|---|
| GPU pool overload | Queue gets long, TTFT goes up | Small model or 429 for the free tier, autoscale, reserved capacity for enterprise |
| Inference node crash mid-stream | Answer stops midway | Chat Service retries on another node (continue after the partial or regenerate), mark message `FAILED` |
| Client disconnect | Stream breaks | Partial checkpoint in the DB, show it on reconnect. Configurable: cancel generation to free the GPU |
| Moderation service down | Safety risk | Fail closed for high-risk categories, or a simple rule-based fallback |
| Vector DB slow | RAG latency | Timeout, answer without RAG and tell the user |
| A user spams with a bot | GPU waste | Token bucket rate limit, CAPTCHA, abuse detection |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Speculative decoding:** a small model drafts tokens, the big one verifies them, tokens/sec goes up 2–3x
- **Multi-region GPU fleet** and region-aware routing; if one region runs out of GPU capacity, spill to another
- **Batch/offline tier:** non-urgent jobs (summaries, evals) on cheaper off-peak GPUs
- **Learned router:** a router trained on quality feedback (thumbs up/down) that decides small vs large better
- **Observability:** dashboards for TTFT p50/p99, tokens/sec, queue wait, GPU utilization, cost per 1K tokens per tier, cache hit rate, and quality evals
- **Memory feature:** store the user's long-term preferences separately, and put a small profile in the context

## Step 13: Likely follow-up questions

- "Why SSE vs WebSocket?" → the stream is one-way, SSE is simple and HTTP friendly. A separate POST is enough for stop
- "What if the conversation gets bigger than the context window?" → summary + recent turns + RAG, cut using the token budget order
- "What if traffic goes 5x and there are no GPUs?" → admission control, priority queue, small model for the free tier, tighter rate limits
- "How will you cut cost?" → model routing, prompt caching, max tokens, cancel on stop, batching
- "What is TTFT and how will you lower it?" → the time until the first token arrives. Less queue wait, prefix cache, shorter prompt, nearby region
- "What if harmful content appears in the response?" → output moderation on streaming chunks, stop the stream and send a safe message
- **Senior signal:** raise it yourself that GPU concurrency is limited by **KV-cache memory**, not FLOPs. Admission control should use KV-cache headroom, and hot nodes created by sticky routing need a fallback (send to another node and accept the prefix cache miss)

## 2-minute recap (read this before the interview)

> In a ChatGPT-like app, the real cost and bottleneck is the GPU. The client POSTs a message and the response streams over SSE. The Chat Service (with its built-in context builder) builds the context from the system prompt + conversation summary + recent turns + pgvector RAG chunks, runs input moderation, and uses the Model Router to pick the small or large model. The request goes into the Router's in-memory priority queue (based on tier; not Kafka, because the request is interactive), where admission control protects the GPU from overload. Inference servers use continuous batching and a prefix KV cache, so the same conversation is sticky-routed. Tokens stream out, output moderation runs on chunks, and the message is saved in DynamoDB/Cassandra. Usage events (~20K/sec, 3 consumers, replay needed) go via Kafka to billing and ClickHouse. Rate limits are per user per tier in Redis: requests/min and tokens/day. Under overload we degrade gracefully: small model, 429 for the free tier.

## Checklist

- [ ] I can explain the SSE streaming flow and how the stop button cancels the GPU work
- [ ] I can explain the GPU count estimate and why "the GPU is the bottleneck"
- [ ] I can explain truncation, summarization and RAG for the context window
- [ ] I can explain the priority queue, admission control and continuous batching
- [ ] I can explain cost control with model routing and prompt caching
- [ ] I can explain per-tier rate limits and the safety layer
- [ ] I can draw the HLD diagram in 5 min
- [ ] I can tell metrics like TTFT and tokens/sec
