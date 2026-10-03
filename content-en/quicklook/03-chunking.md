**In one line:** Chunking is the biggest quality lever in RAG: recursive as the default, structure-aware for structured docs, and size and overlap settled by eval.

- **Fixed-size:** every N tokens with overlap; a simple baseline, but cuts sentences and tables mid-way.
- **Recursive:** paragraph, line, sentence, word; the default for most text.
- **Semantic:** split where sentence-embedding similarity drops; extra cost at ingestion.
- **Structure-aware:** headings, tables, code blocks; never cut a table or code block.
- **Page-level:** for reports and contracts (PageIndex).
- **Small vs big:** small (100-300) is precise but short on context; big (800-1500) has full context but a blurred embedding.
- **Query type:** small for factoid questions, big for "explain/compare".
- **Overlap:** boundary sentences appear in both chunks; too much means duplicates and cost.
- **Parent-child:** search small child chunks, give the LLM the larger parent; do not index parents.
- **Metadata:** prepend the heading path so "its limit is 10 days" keeps its topic.

**Say in the interview:** "I start with a recursive splitter, split on headings for structured docs, and for precision plus context use parent-child: search small, serve big."

**Avoid:** One fixed-size chunker for every document type; assuming a bigger chunk is always better.
