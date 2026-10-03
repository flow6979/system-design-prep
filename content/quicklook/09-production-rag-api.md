**Ek line:** Production RAG mein ingestion async queue pe, answers SSE se stream, permissions retrieval ke andar filter, aur cache/rate-limit/observability se cost aur latency control.

- **Async ingestion:** upload request mein ingest nahi; job queue pe daalo, `202 Accepted` + `job_id` lautao.
- **Partial failure:** page 47 pe OCR fail ho to poora job fail mat karo; per-page status rakho.
- **SSE streaming:** retrieval + rerank ~0.5-1.3 s, isliye tokens stream karo; time-to-first-token sabse important.
- **SSE vs WebSocket:** RAG one-way hai, SSE kaafi; Nginx `proxy_buffering off` + `X-Accel-Buffering: no`.
- **429s:** batch (~8000 tokens), semaphore (~10), exponential backoff + jitter.
- **Embedding cache:** ~28% chunks duplicate (notes mein); key = SHA-256(text | model | version).
- **Semantic cache:** cosine > ~0.95 pe purana answer; threshold galat ho to galat jawab.
- **Access control:** `tenant_id`, `acl_groups` har chunk pe, retrieval mein pre-filter; LLM kabhi na dekhe jo user nahi dekh sakta.
- **Prompt injection:** retrieved text ko untrusted data maano; delimiters, system rules, output check.
- **Freshness:** doc_id se purane chunks delete + upsert; model badle to naya index, phir alias switch.
- **Latency budget:** retrieval 100-350 ms, rerank 200-500 ms, LLM first token 0.5-1.5 s; API aur workers alag deploy.

**Interview me bolo:** "Permission check retrieval ke andar filter hai; ingestion ke liye async job + status endpoint, kyunki ek timeout normal request aur 10-minute ingestion dono nahi sambhal sakta."

**Galti mat karna:** Synchronous ingestion, aur sab tenants ka data ek index mein bina filter ke "LLM ko bol denge".
