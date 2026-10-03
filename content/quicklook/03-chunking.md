**Ek line:** Chunking RAG ki sabse badi quality lever hai: recursive default, structure-aware agar docs structured hain, aur size/overlap eval se tay karo.

- **Fixed-size:** har N tokens + overlap; simple baseline, par sentences/tables beech mein kat jaate hain.
- **Recursive:** paragraph, line, sentence, word; zyadatar text ke liye default.
- **Semantic:** jahan sentence-embedding similarity gire wahan split; ingestion pe extra cost.
- **Structure-aware:** headings, tables, code blocks; table/code kabhi mat kaato.
- **Page-level:** reports/contracts ke liye (PageIndex).
- **Small vs big:** chhota (100-300) precise par kam context; bada (800-1500) full context par blurred embedding.
- **Query type:** factoid ke liye chhota, "explain/compare" ke liye bada.
- **Overlap:** boundary sentence dono chunks mein; zyada overlap = duplicates aur cost.
- **Parent-child:** child chunks pe search, LLM ko bada parent do; parents ko index mein mat daalo.
- **Metadata:** heading path chunk ke aage lagao taaki "its limit is 10 days" ka matlab bacha rahe.

**Interview me bolo:** "Recursive splitter se shuru, structured docs pe headings pe split, aur precision + context dono chahiye to parent-child: search small, serve big."

**Galti mat karna:** Har doc type (FAQ, contract, code) ke liye ek fixed chunker; "bada chunk = behtar" sochna.
