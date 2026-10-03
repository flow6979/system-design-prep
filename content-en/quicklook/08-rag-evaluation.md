**In one line:** Build a golden set and measure retrieval and generation separately, so you know where the fault is.

- **Golden set:** 50-200 real queries (from logs) with the expected chunk or doc id; without it tuning is blind.
- **Recall@k:** is a relevant chunk in the top-k? If recall@50 is low, even a reranker cannot help.
- **Precision@k:** how much noise is in the top-k.
- **MRR:** 1/rank of the first relevant result (rank 1 = 1.0, rank 3 = 0.33).
- **nDCG@k:** graded relevance with a position discount; use it to measure the reranker.
- **Faithfulness:** is every claim supported by the context? Low means hallucination.
- **Answer relevance / context precision / context recall:** does it answer the question, how many chunks were useful, was the needed info present.
- **RAGAS:** computes these 4 metrics with LLM-as-judge; alternatives TruLens, DeepEval, Phoenix.
- **Symptom to fix:** low recall means chunking/hybrid/rewrite; low nDCG means reranker; low faithfulness means prompt/model/fewer chunks.
- **Offline vs online:** golden set before every change (in CI); thumbs, regenerate rate and a 10% A/B in production.

**Say in the interview:** "For retrieval I track recall@k at the candidate stage and nDCG@5 on the final ranking, plus faithfulness for generation. Offline eval lets me ship; online eval shows users benefited."

**Avoid:** Declaring "it works" from 5-10 handpicked demo questions; judging only the final answer.
