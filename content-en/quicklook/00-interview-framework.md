**In one line:** Run the 45-min HLD round in a fixed order: FR → quantified NFR → entities → API → simple v1 → NFR-driven deep dives → wrap-up.

- **FR (~2 min):** 3–4 "user can do X" lines plus explicit out of scope.
- **NFR (~3 min):** state numbers (`p99 < 200 ms`, `100M DAU`, 10:1 read:write) and your CAP choice.
- **Entities + API:** nouns only first, then one endpoint per FR. REST is enough.
- **HLD (10–15 min):** simple v1 (client → service → one DB), then satisfy FRs one by one. Add a box only when a requirement or number demands it.
- **Deep dive (10–15 min):** tie each one to an NFR and end with the trade-off.
- **Wrap-up (~3 min):** bottlenecks, failure modes, "with more time". Free marks.
- **Estimation:** only where the number changes a decision. Skip the rest.
- **Every component:** requirement/number plus why it beats the simpler option. "Just add Kafka" is a red flag.
- **Senior signal:** call out what can break before the interviewer asks.
- **Hints:** an interviewer hint is a signal, move that way immediately.

**Say in the interview:** "First 5 minutes on requirements: core features and NFRs with numbers. Then entities, APIs, a simple v1, and one deep dive per NFR."

**Avoid:** Skipping requirements and drawing straight away, or burning 10 min on estimation. Don't leave NFRs vague ("fast", "scalable").
