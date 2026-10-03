**Ek line:** Query ko search-friendly banao (rewrite, multi-query, HyDE) aur chunk side pe small-to-big use karo; agentic/GraphRAG tabhi jab simple pipeline kam pade.

- **Query rewriting:** sabse sasta win; chat follow-up ("and that one?") ko standalone query banao.
- **Multi-query:** 3-5 phrasings, RRF se merge; recall badhta hai, retrieval 3-5x.
- **HyDE:** LLM fake answer likhe, usse search karo; short query + technical docs pe; har query pe nahi.
- **Decomposition:** complex/compare sawal ko sub-questions mein todo.
- **Parent-child:** 100-200 token child pe match, LLM ko 1000-2000 token parent.
- **Sentence window / compression:** matched sentence ke aas-paas lo; baad mein irrelevant sentences hatao.
- **Contextual retrieval:** indexing pe har chunk ke aage 1-2 line context lagao.
- **Agentic RAG:** plan, retrieve, check, retrieve again; multi-step sawalon ke liye. GraphRAG: poore dataset ke themes jaise global sawal.
- **Lost in the middle:** LLM beech ki info miss karta hai; zyada chunks = kabhi kabhi bura jawab.
- **Citations:** har chunk ko id do ([1] hr-policy.pdf p.12), claim ke baad source id likhwao.

**Interview me bolo:** "Top 50 retrieve, rerank, sirf 5 citations ke saath bhejta hoon; bada top-k free nahi, cost, latency aur lost-in-the-middle laata hai."

**Galti mat karna:** HyDE har query pe lagana, parents bahut bade rakhna, ya 20 chunks dump karna.
