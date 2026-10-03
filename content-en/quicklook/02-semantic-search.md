**In one line:** Semantic search turns text into embeddings (numbers) so items with the same meaning land close, even when the words differ.

- **Keyword (BM25):** exact tokens; strong on error codes and SKUs, misses synonyms.
- **Semantic (dense):** matches meaning, catches synonyms; weak on codes and IDs.
- **They fail differently:** so production systems use hybrid.
- **Embedding:** a fixed-length vector; close in meaning means close in vector space.
- **Query path:** embed the query with the same model, ANN search, top-K, optional filter or rerank.
- **Bi-encoder:** encodes query and doc separately; doc vectors are built offline, so it is fast.
- **Two-stage:** bi-encoder for recall, cross-encoder for precision; the bi-encoder's top-1 is not always right.
- **Model choice:** evaluate on your own data; MTEB is only a start. Hindi/Hinglish users need a multilingual model (e5, bge-m3).
- **Check:** dimensions, max input tokens (above chunk size), hosting, cost and 429s, domain.

**Say in the interview:** "I would build a golden set of 50-100 real queries, compare recall@5 for 2-3 models, then pick on cost and latency."

**Avoid:** Embedding queries and docs with different models; treating semantic search as a strict upgrade over keyword.
