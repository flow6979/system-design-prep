**Ek line:** RAG = search + LLM: pehle relevant chunks retrieve karo, phir LLM ko bolo "sirf is context se jawab do".

- **Kyun:** knowledge cutoff, private data, hallucination, aur citations ka na hona.
- **RAG vs fine-tuning:** RAG naya knowledge deta hai; fine-tuning behaviour/style sikhata hai.
- **Long context:** sirf chhote corpus (1-2 docs) ke liye; bade corpus mein fit nahi hota, har request pe mahanga.
- **Rule of thumb:** data badalta ya private hai to RAG; output format badalna hai to fine-tune.
- **Offline path:** ingest, chunk (300-800 tokens), embed, store (vector DB + optional BM25).
- **Online path:** query embed, top 20-50 retrieve, cross-encoder rerank, top 3-5 LLM ko.
- **Prompt:** instructions + chunks + question; "context ke bahar mat jao, sources cite karo".
- **Failures:** zyadatar retrieval se aate hain, LLM se nahi (chunk beech mein kata, exact term miss, galat position).
- **Measure:** retrieval (recall@k) aur generation (faithfulness) alag naapo.

**Interview me bolo:** "RAG model ka knowledge nahi badalta; har query pe sahi open-book notes pakda deta hai. Indexing offline hoti hai, query path latency-critical."

**Galti mat karna:** RAG se hallucination zero nahi hota; bura jawab aaye to bada LLM try karne se pehle retrieved context dekho.
