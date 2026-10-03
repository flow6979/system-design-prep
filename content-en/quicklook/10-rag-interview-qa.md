**In one line:** A RAG chatbot design is offline ingestion plus an online query path (retrieve, rerank, LLM with citations); raise permissions and eval yourself.

- **Requirements:** docs and users, freshness, first token under ~2 s, permissions, languages.
- **Ingestion:** connectors and webhooks, async queue, parse/OCR, structure-aware chunks of 300-800 tokens, embed with cache, upsert with ACL metadata.
- **Index:** vector (HNSW) plus BM25; pgvector is enough at small scale.
- **Query:** rewrite, hybrid top-50 with ACL pre-filter, rerank to 5, prompt "only from context, cite, say if you do not know".
- **Serve:** SSE, per-tenant semantic cache, per-user rate limit.
- **Why it still hallucinates:** wrong or partial context, conflicting context, or fallback to training knowledge.
- **Chunk size:** 300-800 tokens with 10-20% overlap; decide by recall@k on the golden set.
- **Reranker:** when the right chunk is in the top 50 but not the top 5; rerank 30-50 candidates.
- **Embedding model change:** old and new vectors are not comparable; new index, eval, switch an alias.
- **Cutting cost:** embedding cache, semantic cache, fewer context tokens, a smaller model for simple queries.
- **No vector DB needed:** pgvector for a few thousand chunks; a tiny corpus fits in long context.

**Say in the interview:** "Two pipelines: offline ingestion and online query. Permissions are a pre-filter in retrieval, and I measure recall@k, nDCG and faithfulness on a golden set."

**Avoid:** Saying "LangChain + Pinecone" and stopping, with no ingestion, ACL or eval.
