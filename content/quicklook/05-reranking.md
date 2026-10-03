**Ek line:** Retrieval recall ke liye hai, reranking precision ke liye: top 50 lao, cross-encoder se rerank karo, top 3-7 LLM ko do.

- **Problem:** sahi chunk top-5 mein hota hai par position 3-5 pe; LLM ko position 1 chahiye.
- **Numbers:** N = 50 candidates, K = 3-7 (default 50 se 5, 10:1); N>100 se faayda kam.
- **N >> K zaroori:** N=10 se K=5 mein reranker ke paas reshuffle ki jagah nahi.
- **Debug:** gold answer top-50 mein nahi = retrieval problem; top-50 mein par low score = reranker problem.
- **Bi-encoder vs cross-encoder:** alag encode (fast, precompute) vs saath mein cross-attention (slow, accurate).
- **Cross-encoder scale:** sirf ~50-100 candidates; poore corpus pe nahi.
- **FlashRank:** CPU pe ~15-30 ms, ~85-90% quality; pehle yahin se shuru karo.
- **MiniLM cross-encoder:** CPU 100-250 ms, GPU <50 ms; Hindi ke liye bge-reranker-v2-m3.
- **Cohere Rerank:** no ops, 150-400 ms + network; p99 spikes aur cost watch karo.
- **LLM rerank (RankGPT):** 2-5 s, ~$0.01-0.03/query; sirf legal/medical ya offline.
- **Skip karo jab:** chhota corpus aur answer #1 pe, ya latency budget itna tight ki 20 ms bhi zyada.

**Interview me bolo:** "Top 50 retrieve, cross-encoder se rerank, top 5 LLM ko; NDCG@5 before/after naapke p95 latency check karunga."

**Galti mat karna:** Top-5 ko rerank karke top-3 banana; reranker ko free lunch samajhna (latency dekho).
