**Ek line:** Jo docs page-by-page padhne ke liye bane hain (reports, contracts), unme chunking tootti hai; page-level ya tree index structure ko respect karta hai.

- **Chunking kahan tootti hai:** table/argument beech mein kata, "see previous page" jaise cross-page references khoye.
- **Noisy scores:** dense methodology chunk zyada relevant page se upar aa sakta hai.
- **Page-level index:** page hi retrieval unit; embedding + metadata; vector stack mein sasta upgrade.
- **Vectorless tree:** ToC jaisa tree, LLM tree pe reason karke section chunta hai; explainable, par mahanga/slow.
- **PageIndex jeetta hai:** annual reports, 10-K, contracts, compliance, manuals, multi-page tables.
- **Chunking theek hai:** FAQs, product descriptions, tickets; jahan "page" ka concept hi nahi.
- **Best combo:** pehle collection level pe sahi document, phir andar page/tree navigation.
- **Pitfalls:** lambe pages ke liye first ~800 + last ~200 tokens, multi-column ke liye layout-aware parser, scanned PDFs pe pehle OCR.
- **Boilerplate/neighbours:** <100 chars pages skip karo; cross-page tables ke liye ±1 page bhejo.

**Interview me bolo:** "Retrieval sirf vector matching nahi, document structure ka problem hai; page-by-page docs ko page/section level pe index karunga."

**Galti mat karna:** PageIndex ko "bade chunks" samajhna, ya FAQ bot pe use karna (overkill).
