**In one line:** Retrieval is for recall and reranking is for precision: fetch the top 50, rerank with a cross-encoder, pass the top 3-7 to the LLM.

- **Problem:** the right chunk is in the top 5 but at position 3-5; the LLM needs it at position 1.
- **Numbers:** N = 50 candidates, K = 3-7 (default 50 to 5, 10:1); N above 100 rarely helps.
- **N >> K is essential:** with N=10 and K=5 the reranker has no room to reshuffle.
- **Debug:** gold answer not in the top 50 is a retrieval problem; in the top 50 but scored low is a reranker problem.
- **Bi-encoder vs cross-encoder:** separate encoding (fast, precomputed) vs joint cross-attention (slow, accurate).
- **Cross-encoder scale:** only ~50-100 candidates, never the whole corpus.
- **FlashRank:** ~15-30 ms on CPU, ~85-90% of cross-encoder quality; start here.
- **MiniLM cross-encoder:** 100-250 ms on CPU, under 50 ms on GPU; bge-reranker-v2-m3 for Hindi.
- **Cohere Rerank:** no ops, 150-400 ms plus network; watch p99 spikes and cost.
- **LLM rerank (RankGPT):** 2-5 s, ~$0.01-0.03/query; only legal, medical or offline batch.
- **Skip when:** the corpus is small and the answer is already #1, or the latency budget cannot afford even 20 ms.

**Say in the interview:** "I retrieve the top 50, rerank with a cross-encoder and pass the top 5; I measure NDCG@5 before and after and check p95 latency."

**Avoid:** Reranking the top 5 down to the top 3; treating the reranker as a free lunch.
