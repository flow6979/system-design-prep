**In one line:** Dense captures meaning, sparse (BM25) captures exact words; running both in parallel and fusing with RRF is where most teams end up.

- **Dense:** strong on synonyms and paraphrase; an ID's specificity gets averaged out in the embedding (vocabulary mismatch).
- **Sparse (BM25):** strong on codes, SKUs, legal clauses, versions; no understanding of meaning.
- **SPLADE:** learned sparse vector with term expansion; query-time transformer inference (~100-300 ms), BM25 still better on new codes.
- **RRF:** use ranks, not scores: `Σ 1/(k + rank)`, default k = 60.
- **Do not add raw scores:** BM25 runs 0-15, cosine 0.6-0.95; the scales differ.
- **Small corpus (~50-300 docs):** use k = 10-20; in the author's 80-doc pilot k=60 did worse than dense-only.
- **Weighted fusion:** when you trust one retriever more; for jargon-heavy corpora give sparse more candidates (top-100 vs 30).
- **Learned fusion:** only with thousands of labeled pairs.
- **Rule:** "RRF, always, until data says otherwise"; SPLADE or learned fusion only if eval shows a gain.
- **Re-index:** update the BM25 index too, or vectors are fresh while the keyword index is stale.

**Say in the interview:** "Dense and sparse fail differently, so I run both in parallel and fuse with RRF; for corpora with product or error codes, never dense-only."

**Avoid:** Adding BM25 and cosine scores directly, or blindly keeping k=60 on a 100-document corpus.
