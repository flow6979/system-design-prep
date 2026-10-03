**In one line:** RAG = search + LLM: retrieve relevant chunks first, then tell the LLM "answer only from this context".

- **Why:** knowledge cutoff, private data, hallucination, and no citations.
- **RAG vs fine-tuning:** RAG gives new knowledge; fine-tuning teaches behaviour and style.
- **Long context:** only for tiny corpora (1-2 docs); does not fit big corpora and is costly per request.
- **Rule of thumb:** data changes or is private means RAG; output format must change means fine-tune.
- **Offline path:** ingest, chunk (300-800 tokens), embed, store (vector DB plus optional BM25).
- **Online path:** embed query, fetch top 20-50, cross-encoder rerank, top 3-5 to the LLM.
- **Prompt:** instructions + chunks + question; "stay within the context, cite sources".
- **Failures:** mostly retrieval, not the LLM (chunk cut mid-way, exact term missed, wrong position).
- **Measure:** retrieval (recall@k) and generation (faithfulness) separately.

**Say in the interview:** "RAG does not change the model's knowledge; it hands it the right open-book notes on every query. Indexing is offline, the query path is latency-critical."

**Avoid:** Thinking RAG makes hallucination zero; swapping in a bigger LLM before looking at the retrieved context.
