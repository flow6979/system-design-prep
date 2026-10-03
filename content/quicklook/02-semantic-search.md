**Ek line:** Semantic search text ko embeddings (numbers) mein badalti hai taaki same meaning wale paas aayein, shabd alag hon tab bhi.

- **Keyword (BM25):** exact tokens; error codes/SKUs mein strong, synonyms miss.
- **Semantic (dense):** meaning match, synonyms pakadta hai; codes/IDs mein weak.
- **Dono alag tarah fail hote hain:** isliye production mein hybrid.
- **Embedding:** fixed-length vector; meaning mein paas = vector space mein paas.
- **Query path:** query ko same model se embed karo, ANN search, top-K, optional filter/rerank.
- **Bi-encoder:** query aur doc alag encode; doc vectors offline bante hain, isliye tez.
- **Two-stage:** bi-encoder recall ke liye, cross-encoder precision ke liye; bi-encoder ka top-1 hamesha sahi nahi.
- **Model choice:** apne data pe evaluate karo; MTEB sirf shuruaat. Hindi/Hinglish ke liye multilingual (e5, bge-m3).
- **Check karo:** dimensions, max input tokens (chunk se bada), hosting, cost/429s, domain.

**Interview me bolo:** "50-100 real queries ka golden set banake 2-3 models ka recall@5 compare karunga, phir cost/latency dekh ke chunuga."

**Galti mat karna:** Query aur docs ko alag models se embed karna; semantic ko keyword ka strict upgrade samajhna.
