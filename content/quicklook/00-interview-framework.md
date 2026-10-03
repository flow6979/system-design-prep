**Ek line:** 45 min ka HLD round fixed order me chalao: FR → numbers wali NFR → entities → API → simple v1 → NFR-driven deep dives → wrap-up.

- **FR (~2 min):** 3–4 "user X kar sake" lines + explicit out of scope.
- **NFR (~3 min):** numbers me bolo (`p99 < 200 ms`, `100M DAU`, 10:1 read:write) + CAP choice.
- **Entities + API:** sirf nouns pehle, phir har FR ke liye ek endpoint. REST kaafi.
- **HLD (10–15 min):** simple v1 (client → service → ek DB), phir FR ek-ek karke. Naya box tabhi jab requirement/number maange.
- **Deep dive (10–15 min):** har deep dive ek NFR se juda ho, end me trade-off.
- **Wrap-up (~3 min):** bottlenecks, failure modes, "aur time hota to". Free marks.
- **Estimation:** sirf jahan number decision badle. Baaki math skip.
- **Har component:** requirement/number + kyun simpler option se better. "Kafka laga do" bina reason red flag.
- **Senior signal:** kya toot sakta hai, interviewer ke poochhne se pehle khud bolo.
- **Hint:** interviewer ka hint = signal, turant us direction me jao.

**Interview me bolo:** "Pehle 5 min requirements: core features aur numbers wali NFRs. Phir entities, APIs, simple v1, aur har NFR ke liye ek deep dive."

**Galti mat karna:** Requirements skip karke seedha diagram, ya estimation me 10 min barbaad karna. Vague NFR ("fast", "scalable") bhi mat rakho.
