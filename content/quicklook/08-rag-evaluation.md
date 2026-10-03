**Ek line:** Golden set banao aur retrieval aur generation ko alag naapo, tabhi pata chalega galti kahan hai.

- **Golden set:** 50-200 real queries (logs se) with expected chunk/doc id; bina iske tuning andha hai.
- **Recall@k:** relevant top-k mein aaya? Recall@50 low ho to reranker bhi bacha nahi sakta.
- **Precision@k:** top-k mein kitna noise.
- **MRR:** pehle sahi result ka 1/rank (rank 1 = 1.0, rank 3 = 0.33).
- **nDCG@k:** graded relevance + position; reranker ka asar isse naapo.
- **Faithfulness:** har claim context se supported? Low = hallucination.
- **Answer relevance / context precision / context recall:** jawab sawal ka hai? chunks kitne useful? zaroori info thi?
- **RAGAS:** ye 4 metrics LLM-as-judge se; alternatives TruLens, DeepEval, Phoenix.
- **Symptom to fix:** recall low = chunking/hybrid/rewrite; nDCG low = reranker; faithfulness low = prompt/model/kam chunks.
- **Offline vs online:** golden set har change se pehle (CI mein); thumbs, regenerate rate, 10% A/B production mein.

**Interview me bolo:** "Retrieval ke liye candidate stage pe recall@k aur final ranking pe nDCG@5; generation ke liye faithfulness. Offline eval ship karne deta hai, online eval batata hai user ko fayda hua ya nahi."

**Galti mat karna:** 5-10 handpicked demo questions pe "works" bol dena; sirf final answer judge karna.
