**Ek line:** Transaction = multi-statement kaam jo all-or-nothing hota hai; ACID + isolation level + locks se correctness aati hai.

- **ACID:** Atomicity, Consistency, Isolation, Durability; Consistency invariant app + transaction dono se aata hai.
- **Durability:** commit ack se pehle WAL fsync; crash pe replay; sync replica node loss se bachata hai.
- **Boundary:** har write-flow me batao ki transaction kahan shuru/khatam hota hai.
- **Isolation default:** Read Committed; critical paths pe `FOR UPDATE` ya atomic UPDATE; zaroori invariant pe Serializable + retry.
- **RR myth:** Repeatable Read write skew nahi rokta; sirf Serializable rokta hai.
- **MVCC:** har update naya row version; readers writers ko block nahi karte, par writes row lock lete hain.
- **Long transaction:** vacuum ruk jaata hai, bloat, ID wraparound risk.
- **Check-then-act:** bina lock `SELECT` phir `UPDATE` = lost update; `FOR UPDATE` ya `UPDATE ... WHERE stock > 0`.
- **Flash sale:** Redis `DECR` se gate karo, phir DB me atomic UPDATE.
- **Deadlock:** cycle hai, DB ek ko abort karta hai; poora transaction retry karo.
- **Microservices:** local ACID + saga + outbox + idempotency; 2PC rare.

**Interview me bolo:** "Default Read Committed, critical paths pe row lock ya atomic UPDATE. Services ke beech saga aur outbox."

**Galti mat karna:** Transaction ke andar network/payment call karna, ya "NoSQL me transactions nahi hote" absolute bolna.
