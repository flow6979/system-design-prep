---
title: PageIndex
order: 6
time: 8
---

# PageIndex

PageIndex is a retrieval idea: instead of cutting a document into random chunks, index its **natural structure** (pages, sections, table of contents), and where needed let an LLM **reason over a tree index** to navigate to the right section, without vector similarity ("vectorless"). Interviewers ask: "Why does chunk + vector RAG fail on long structured PDFs (annual reports, contracts), and what is the alternative?"

## ⭐ Where chunking breaks

**In one line:** fixed-size chunks (e.g. 512 tokens, 50 overlap) ignore the document's structure, so multi-page questions get incomplete or confidently wrong answers.

> **Example:** a bot over Infosys's 200-page annual report. "What are the main risk factors and how are they mitigated?" The risk table spans pages 41–42; chunking splits it into two pieces. The LLM gets half the table and confidently gives half an answer.

- **Context bleed:** a chunk ends mid-table or mid-argument → the LLM gets an incomplete thought, and the embedding is weak too.
- **Cross-page references break:** "see the table on the previous page", "as per Section 3" lose their meaning. Chunk retrieval knows nothing about page proximity.
- **Tables/figures get mangled:** a table across two pages = two disconnected chunks.
- **Noisy scores:** because of shared vocabulary, a dense methodology chunk can outscore a more relevant page.
- Analogy: chunking = cutting a book into random 3-inch strips. PageIndex = cutting at the binding, where the author placed the boundaries.

**Interview tip:** "Retrieval is not just keyword matching in vector space; it is a **document structure problem**. If a document was made to be read page by page, index it at page/section level."

**Common mistake:** thinking every problem is solved by tweaking chunk size.

## ⭐ Two flavours: page-level index and vectorless tree index

**In one line:** (1) **page-level index** = the page is the retrieval unit, with an embedding + rich metadata; (2) **vectorless tree index** = a ToC-like tree of the document, where an LLM reasons to choose nodes, with no embeddings.

**1. Page-level index (the article's main approach)**
- Each page is a node: text + table data + figure captions → one embedding, plus metadata: `doc_id`, `page_number`, `section_title`, `content_type` (text/table/figure), optional `sparse_vector` (BM25/SPLADE for hybrid).
- Query → dense/hybrid search for top-N pages → rerank (boost by page position, section, adjacent high-scoring pages) → assemble the top-K pages **in page order**, not score order (narrative structure matters).
- Very long pages (~1,500+ words): store smaller pieces inside the page but retrieve at page level; or slice only the relevant paragraph at serving time.
- In the author's financial-report test, precision@3 was roughly 18–25% better (vs 512-token chunking), with less hallucination, because a full page carries its own caveats.

**2. Vectorless, reasoning-based tree index (PageIndex-style)**
- Indexing: build a **hierarchical tree** from the document, like a smart table of contents: document → sections → sub-sections → pages. Each node has a title, a short LLM-generated summary and a page range.
- Retrieval: give the LLM the query + the top level of the tree. It **reasons** "which section should hold the answer?", descends into that node, and backtracks if needed. Just like a human analyst reading a report via its ToC.
- No embeddings, no vector DB, no chunking. Retrieval is **explainable**: "looked at Risk Factors → Market Risk → page 42, because...".
- Similarity ≠ relevance: vector search returns "what looks similar"; tree reasoning goes "where the answer should be".

```mermaid
flowchart LR
    Q["Query: FY24 forex risk"] --> R["LLM reads root ToC"]
    R --> S["Pick Risk Factors"]
    S --> M["Pick Market Risk"]
    M --> P["Read pages 41-42"]
    P --> A["Answer with page cite"]
```

| | Chunk + vector | Page-level index | Vectorless tree |
|---|---|---|---|
| Unit | 512-token chunk | full page | section/page node |
| Retrieval | ANN similarity | ANN/hybrid + rerank | LLM reasoning over tree |
| Explainability | low | medium (page cite) | high (path is visible) |
| Latency/cost | lowest | low | high (multiple LLM calls) |
| Best for | FAQs, short docs | reports, manuals | long structured docs, few |

**Interview tip:** "A page-level index is a cheap upgrade that fits inside the vector stack. Vectorless tree retrieval is for when documents are long and structured and accuracy + explainability matter more than latency."

**Common mistake:** treating PageIndex as just "bigger chunks". The real idea is **structure-aware** indexing and page-ordered context.

## ⭐ When it beats chunk + vector, and when it doesn't

**In one line:** if a document was designed to be **printed and read page by page**, use PageIndex; if it was designed to be **scanned and searched**, chunking is fine.

- **PageIndex wins:** annual reports, 10-K/financial filings, legal contracts, compliance docs, technical manuals, research papers; multi-page questions; tables spanning pages; when you need page citations (audit, legal).
- **Chunking is better:** short uniform docs (FAQs, product descriptions, support tickets, chat snippets), where the idea of a "page" doesn't exist.
- **Vectorless tree trade-offs:**
  - Several LLM calls per query → latency in seconds, higher cost.
  - Doesn't scale to searching across many documents; you first pick the doc (via metadata or vector search), then navigate its tree.
  - Everything depends on tree quality (ToC, summaries); docs without headings are hard to build a tree for.
- **Hybrid combo:** page-level BM25 gets more context (better IDF), dense gets the page theme. You catch "is about connection handling AND contains the exact error code". See [Hybrid Search](04-hybrid-search.md).

**Interview tip:** "First I'd find the right document at collection level with vector/hybrid search, then do tree navigation or page-level retrieval inside it. Best of both."

**Common mistake:** using PageIndex for an FAQ bot; it is overkill, with real memory overhead.

## Practical pitfalls

- **Long pages and token limits:** careless truncation corrupts the embedding. Fix: embed the first ~800 tokens + last ~200 tokens ("semantic bookends").
- **Multi-column PDFs:** default extraction interleaves columns; use a layout-aware parser (`pdfplumber` bounding boxes, `marker`, `nougat`).
- **Scanned PDFs:** OCR first (`pytesseract`, `surya`, AWS Textract). Silently indexing empty pages is worse than not indexing at all.
- **Boilerplate pages:** title, blank, ToC, disclaimers; skip pages under ~100 characters and penalize them in reranking.
- **Neighbour pages:** pass ±1 page along with the answer page, for cross-page tables.
- For final precision, run a cross-encoder over page candidates: [Reranking](05-reranking.md). Pages are coherent, so the reranker gets good text to score.

## Read more

- [Vector databases](../05-db/11-vector.md): chunking + embedding pipeline and metadata filtering. Details there.
- [Hybrid Search](04-hybrid-search.md): page-level BM25 + dense.
- [Reranking](05-reranking.md): ordering page candidates precisely.
- [RAG lab](/viewinter/agents/labs/rag): run a PDF-chat RAG in the browser.

## Checklist

- [ ] I can list the 4 failure modes of fixed-size chunking
- [ ] I can explain the page-level index pipeline and its metadata
- [ ] I can explain how a vectorless tree index retrieves via LLM reasoning
- [ ] I can say when PageIndex beats chunk + vector and when it is overkill
- [ ] I can explain the latency, cost and scale trade-offs of tree retrieval
