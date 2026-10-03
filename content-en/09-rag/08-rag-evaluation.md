---
title: RAG Evaluation
order: 8
time: 8
---

# RAG Evaluation

Two things can fail in RAG: retrieval (the right chunk never arrived) and generation (the chunk arrived but the LLM answered wrongly or made things up). Evaluation measures the two separately. Interviewers ask: "How do you know your change (chunk size, reranker) is better?" The answer should be numbers, not vibes.

## ⭐ Golden set: everything stands on it

**In one line:** a set of 50–200 real questions, each with the expected chunk/doc id and (optionally) an ideal answer.

> **Example:** for an HR policy bot, take 100 real questions from logs ("how many days of maternity leave?") and write the correct doc id `leave-policy.pdf#p4` next to each.

- Build it from real logged queries and annotate manually. Per the notes, even **50–100 pairs per domain** gives meaningful signal.
- Keep a mix: easy lookups, multi-hop, "answer isn't in the docs", typo/Hinglish queries.
- You can have an LLM generate synthetic questions (give it a chunk, ask for a question), but some human review is required.
- Version the golden set; run every pipeline change on the same set (like a regression test).

**Interview tip:** "First job: a golden set of 100 queries from logs. Without it, all tuning is blind."
**Common mistake:** testing on 5–10 handpicked demo questions and declaring "it works".

## ⭐ Retrieval metrics

**In one line:** did the right chunk make the top-k, and how high did it rank?

| Metric | What it measures | When to look |
|---|---|---|
| Hit rate / Recall@k | Is a relevant chunk in top-k | Basic retrieval health |
| Precision@k | How many of top-k are relevant | How much noise gets through |
| MRR | 1/rank of first relevant, averaged | One right answer is enough |
| nDCG@k | Graded relevance + position discount | Ranking quality, reranker eval |

- **Recall@k** = relevant found / total relevant. If recall@50 is low, even a reranker can't help (you can't rerank what never arrived).
- **MRR:** gold chunk at rank 1 → 1.0, at rank 3 → 0.33. Sensitive to position.
- **nDCG:** distinguishes "highly relevant" from "somewhat relevant" and weights top ranks more. Measure the impact of [reranking](05-reranking.md) with it.
- From the notes: reranking on top of hybrid search improved **nDCG@5 by roughly 12–18 points**; elsewhere it gave only 2 points for 200ms of latency. That's why you measure.

```python
def mrr(results, gold):  # results: list of ranked id lists
    total = 0
    for ranked, g in zip(results, gold):
        for i, doc in enumerate(ranked, 1):
            if doc == g:
                total += 1 / i
                break
    return total / len(gold)
```

**Interview tip:** "For retrieval: recall@k at the candidate stage, nDCG@5 on the final ranking."

## ⭐ Generation metrics and RAGAS

**In one line:** is the answer grounded in the context (faithful), and does it actually answer the question?

- **Faithfulness / groundedness:** is every claim in the answer supported by the context? Low = hallucination.
- **Answer relevance:** does the answer address the question or wander?
- **Context precision:** how many of the supplied chunks were useful (noise check).
- **Context recall:** was the info needed for the ideal answer present in the context (needs ground truth).
- **RAGAS:** an open-source framework that computes these 4 metrics using LLM-as-judge. Alternatives: TruLens, DeepEval, Arize Phoenix.
- **LLM-as-judge:** give a strong LLM a rubric ("score 1–5: is every claim supported by the context?"). Cheap and scales.
- Judge weaknesses: position bias, preferring longer answers, favouring its own model. Fix: a clear rubric, check agreement with humans on some samples, temperature 0.

| Symptom | Which metric | Where to fix |
|---|---|---|
| Right chunk didn't arrive | Recall@k low | Chunking, hybrid, query rewrite |
| Chunk arrived, ranked low | nDCG/MRR low | Reranker |
| Context right, answer wrong | Faithfulness low | Prompt, model, fewer chunks |

**Common mistake:** judging only the final answer. Measure retrieval and generation separately, or you won't know where the fault is.

## Offline vs online evaluation

- **Offline:** on the golden set before every change (in CI too). Fast, repeatable, cheap.
- **Online:** real production signals: thumbs up/down, "regenerate" click rate, follow-ups like "no, I meant...", support ticket escalations.
- **A/B test:** put the new reranker on 10% of traffic and compare thumbs-up rate and latency.
- Sample production logs and monitor faithfulness with an LLM judge (not on every request, because of cost).
- Add bad online cases to the golden set; the set gets stronger over time.

**Interview tip:** "Offline eval lets you ship a change; online eval tells you whether users actually benefited."

## Read more

- [Reranking](05-reranking.md): the reranker's impact on nDCG@5.
- [Hybrid Search](04-hybrid-search.md): validate tuning with eval.
- [Vector databases](../05-db/11-vector.md): ANN recall@k vs latency. Read the details here.
- [Reliability and observability](../01-topics/20-reliability-observability.md): online metrics and alerting.

## Checklist

- [ ] I can explain how to build a golden set and how big it should be
- [ ] I can explain recall@k, MRR and nDCG with an example
- [ ] I can explain faithfulness, answer relevance, context precision/recall
- [ ] I can explain the role of LLM-as-judge and RAGAS and their weaknesses
- [ ] I can diagnose a bad answer as a retrieval vs generation problem
- [ ] I can explain offline vs online eval and A/B tests
