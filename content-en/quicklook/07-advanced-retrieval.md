**In one line:** Make the query search-friendly (rewrite, multi-query, HyDE) and use small-to-big on the chunk side; go agentic or GraphRAG only when a simple pipeline falls short.

- **Query rewriting:** the cheapest win; turns chat follow-ups ("and that one?") into standalone queries.
- **Multi-query:** 3-5 phrasings merged with RRF; recall goes up, retrieval cost 3-5x.
- **HyDE:** the LLM writes a fake answer and you search with it; for short queries on technical docs, not every query.
- **Decomposition:** split complex or comparison questions into sub-questions.
- **Parent-child:** match on 100-200 token children, give the LLM the 1000-2000 token parent.
- **Sentence window / compression:** take neighbouring sentences; drop irrelevant sentences after retrieval.
- **Contextual retrieval:** prepend 1-2 lines of context to each chunk at indexing time.
- **Agentic RAG:** plan, retrieve, check, retrieve again; for multi-step questions. GraphRAG: global questions about whole-dataset themes.
- **Lost in the middle:** LLMs miss info in the middle; more chunks can make answers worse.
- **Citations:** give each chunk an id ([1] hr-policy.pdf p.12) and ask for the source id after each claim.

**Say in the interview:** "I retrieve 50, rerank, and send only 5 with citations; a bigger top-k costs money, latency and lost-in-the-middle risk."

**Avoid:** Applying HyDE to every query, making parents too big, or dumping 20 chunks into the prompt.
