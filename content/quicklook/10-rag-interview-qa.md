**Ek line:** RAG chatbot design = offline ingestion + online query (retrieve, rerank, LLM with citations), aur permissions + eval khud uthao.

- **Requirements:** docs/users, freshness, first token < ~2 s, permissions, languages.
- **Ingestion:** connectors + webhooks, async queue, parse/OCR, structure-aware chunks 300-800 tokens, embed with cache, upsert with ACL metadata.
- **Index:** vector (HNSW) + BM25; chhote scale pe pgvector kaafi.
- **Query:** rewrite, hybrid top-50 with ACL pre-filter, rerank to 5, "sirf context se, cite karo, pata na ho to bolo".
- **Serve:** SSE, per-tenant semantic cache, per-user rate limit.
- **Hallucination kyun:** galat/adhura context, conflicting context, ya model training knowledge pe gira.
- **Chunk size:** 300-800 tokens, 10-20% overlap; final decision golden set ke recall@k se.
- **Reranker:** jab sahi chunk top-50 mein par top-5 mein nahi; 30-50 candidates rerank karo.
- **Embedding model badla:** purane aur naye vectors comparable nahi; naya index, eval, alias switch.
- **Cost kam karna:** embedding cache, semantic cache, kam context tokens, simple queries pe chhota model.
- **Vector DB kab nahi:** kuch hazaar chunks pe pgvector; bahut chhota corpus long context mein.

**Interview me bolo:** "Do pipelines: offline ingestion aur online query. Permissions retrieval mein pre-filter hoti hain aur golden set se recall@k, nDCG aur faithfulness naapta hoon."

**Galti mat karna:** Sirf "LangChain + Pinecone" bol ke ruk jana, bina ingestion, ACL aur eval ke.
