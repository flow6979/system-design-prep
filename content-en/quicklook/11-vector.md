**In one line:** A vector DB finds the K nearest embeddings quickly using an ANN index; the base for RAG, semantic search, and recommendations.

- **Embedding:** a fixed-length float array (e.g. 1536) capturing meaning; close meaning = close vectors.
- **Model change:** re-embed the whole corpus, or old and new vectors live in different spaces.
- **Metrics:** cosine (direction, for text), dot, L2; keep index and query metric the same.
- **Exact vs ANN:** exact kNN is slow; ANN gets 95-99% recall and is far faster.
- **HNSW:** multi-layer graph like a skip list; tune recall vs latency with `ef_search`; needs RAM.
- **IVF/PQ/DiskANN:** at billion scale, clusters + compression, then re-rank the top 100.
- **SLO:** "p99 < 50 ms at recall@10 >= 0.95"; latency alone is incomplete.
- **Filtering:** selective filter = pre-filter + flat scan; post-filter in pgvector can return fewer results (`iterative_scan`).
- **Hybrid:** BM25 + vector merged with RRF; in RAG use hybrid retrieval + re-ranker.
- **pgvector:** if data is already in Postgres, start there at small-medium scale; Pinecone is overkill for 10k docs.
- **RAG:** quality comes from chunking and retrieval; deterministic chunk ids (`docId-chunkNo`), always apply ACL filters.

**Say in the interview:** "At small scale I'd start with pgvector, and move to a dedicated vector DB as QPS or corpus grows. Hybrid retrieval + re-ranker, and I'd measure recall@10."

**Avoid:** Forgetting the ACL filter, or benchmarking latency without measuring recall.
