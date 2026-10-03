**In one line:** Documents made to be read page by page (reports, contracts) break under chunking; a page-level or tree index respects their structure.

- **Where chunking breaks:** tables or arguments cut mid-way, cross-page references like "see previous page" lost.
- **Noisy scores:** a dense methodology chunk can outscore a more relevant page.
- **Page-level index:** the page is the retrieval unit with embedding plus metadata; a cheap upgrade inside the vector stack.
- **Vectorless tree:** a ToC-like tree where an LLM reasons to the right section; explainable but costly and slow.
- **PageIndex wins:** annual reports, 10-Ks, contracts, compliance, manuals, multi-page tables.
- **Chunking is fine:** FAQs, product descriptions, tickets; no real notion of a page.
- **Best combo:** find the right document at collection level first, then navigate pages or the tree inside it.
- **Pitfalls:** long pages need first ~800 + last ~200 tokens, multi-column needs a layout-aware parser, scanned PDFs need OCR first.
- **Boilerplate/neighbours:** skip pages under ~100 chars; pass ±1 page for cross-page tables.

**Say in the interview:** "Retrieval is a document structure problem, not just vector matching; for page-by-page documents I index at page or section level."

**Avoid:** Treating PageIndex as just "bigger chunks"; using it for an FAQ bot (overkill).
