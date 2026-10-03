**Ek line:** Vector DB embeddings ke nearest K neighbours ANN index se jaldi nikalta hai; RAG, semantic search aur recommendations ka base.

- **Embedding:** fixed-length float array (jaise 1536) jo meaning capture karta hai; paas meaning = paas vectors.
- **Model change:** poora corpus re-embed karo, warna purane/naye vectors alag space me.
- **Metrics:** cosine (direction, text ke liye), dot, L2; index aur query ka metric same rakho.
- **Exact vs ANN:** exact kNN slow; ANN 95-99% recall par bahut fast.
- **HNSW:** multi-layer graph, skip list jaisa; `ef_search` se recall vs latency; RAM chahiye.
- **IVF/PQ/DiskANN:** arab-scale par clusters + compression, phir top-100 re-rank.
- **SLO:** "p99 < 50 ms at recall@10 >= 0.95"; sirf latency bolna adhoora.
- **Filtering:** selective filter = pre-filter + flat scan; pgvector me post-filter kam results de sakta hai (`iterative_scan`).
- **Hybrid:** BM25 + vector, RRF se merge; RAG me hybrid retrieval + re-ranker.
- **pgvector:** data already Postgres me, chhote-medium scale ke liye pehle yahi; 10k docs ke liye Pinecone overkill.
- **RAG:** quality chunking aur retrieval se aati hai; deterministic chunk id (`docId-chunkNo`), ACL filter zaroor.

**Interview me bolo:** "Scale chhota hai to pgvector se shuru; QPS ya corpus badhe to dedicated vector DB. Hybrid retrieval + re-ranker, aur recall@10 naapunga."

**Galti mat karna:** ACL filter bhool jaana, ya sirf latency benchmark karke recall na naapna.
