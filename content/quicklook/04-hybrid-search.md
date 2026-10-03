**Ek line:** Dense meaning pakadta hai, sparse (BM25) exact words; dono ko parallel chalake RRF se fuse karna zyadatar teams ki manzil hai.

- **Dense:** synonyms/paraphrase mein strong; IDs ki specificity embedding mein average ho jaati hai (vocabulary mismatch).
- **Sparse (BM25):** codes, SKUs, legal clauses, versions mein strong; meaning nahi samajhta.
- **SPLADE:** learned sparse vector + term expansion; query pe transformer inference (~100-300 ms), naye codes pe BM25 behtar.
- **RRF:** score nahi, sirf rank: `Σ 1/(k + rank)`, default k = 60.
- **Scores add mat karo:** BM25 0-15, cosine 0.6-0.95; scales alag hain.
- **Chhota corpus (~50-300 docs):** k = 10-20; author ke 80-doc pilot mein k=60 dense-only se bura tha.
- **Weighted fusion:** ek retriever pe zyada bharosa ho to; jargon-heavy corpus mein sparse ko zyada candidates (top-100 vs 30).
- **Learned fusion:** hazaaron labeled pairs hone par hi.
- **Rule:** "RRF, always, until data says otherwise"; SPLADE/learned sirf eval gain dikhe to.
- **Re-index:** BM25 index bhi update karo, warna vectors fresh aur keyword index stale.

**Interview me bolo:** "Dense aur sparse ke failure modes alag hain, isliye dono parallel chalata hoon aur RRF se fuse karta hoon; codes wale corpus mein kabhi dense-only nahi."

**Galti mat karna:** BM25 aur cosine scores seedha jodna, ya 100-doc corpus pe bhi blindly k=60.
