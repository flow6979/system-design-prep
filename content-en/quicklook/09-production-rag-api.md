**In one line:** Production RAG ingests via an async queue, streams answers over SSE, filters permissions inside retrieval, and controls cost and latency with caching, rate limits and observability.

- **Async ingestion:** never ingest inside the upload request; queue a job and return `202 Accepted` + `job_id`.
- **Partial failure:** if OCR fails on page 47, do not fail the whole job; keep per-page status.
- **SSE streaming:** retrieval + rerank takes ~0.5-1.3 s, so stream tokens; time-to-first-token matters most.
- **SSE vs WebSocket:** RAG is one-way so SSE is enough; set Nginx `proxy_buffering off` and `X-Accel-Buffering: no`.
- **429s:** batch (~8000 tokens), cap concurrency with a semaphore (~10), exponential backoff with jitter.
- **Embedding cache:** ~28% of chunks were duplicates; key = SHA-256(text | model | version).
- **Semantic cache:** return a past answer at cosine > ~0.95; a bad threshold returns wrong answers.
- **Access control:** `tenant_id` and `acl_groups` on every chunk, pre-filter in retrieval; the LLM never sees a chunk the user cannot.
- **Prompt injection:** treat retrieved text as untrusted data; delimiters, system rules, output checks.
- **Freshness:** delete old chunks by doc_id and upsert; on an embedding model change build a new index and switch an alias.
- **Latency budget:** retrieval 100-350 ms, rerank 200-500 ms, LLM first token 0.5-1.5 s; deploy API and workers separately.

**Say in the interview:** "The permission check is a filter inside retrieval, and ingestion is an async job with a status endpoint, since no single timeout serves both normal requests and 10-minute ingestion."

**Avoid:** Synchronous ingestion; putting all tenants in one index without filters and trusting the prompt to hide data.
