**Ek line:** CQRS = write aur read ke alag models; Event Sourcing = state ki jagah immutable events store karo aur replay se state banao.

- **CQRS:** write model normalized + rules (Postgres); read models query ke hisaab se (Elasticsearch, Redis).
- **Sync:** events ya CDC se projector read models update karta hai.
- **Eventual consistency:** write response me naya data bhejo, critical read write DB se, read model me `version`.
- **Event sourcing:** append-only events; balance = events ka sum. Audit + time-travel free.
- **Replay:** naya read model = log shuru se replay.
- **Snapshots:** har N events pe, load = snapshot + baad ke events.
- **Concurrency:** append pe `expected_version` check (optimistic lock), warna double spend.
- **Schema evolution:** events immutable; `v2` banao, upcaster v1 → v2. Edit nahi.
- **Outbox:** event store hi outbox; ek event = state + saga step + read view.
- **Use:** audit (ledger, wallet, trading), history business feature, read:write 100:1.
- **Mat use:** simple CRUD, chhoti team. GDPR: per-user key encrypt, delete pe key phenko (crypto-shredding).
- **CQRS akela common;** event sourcing sirf jahan history hi product ho.

**Interview me bolo:** "Wallet balance overwrite nahi karunga; har change immutable event, har 100 events pe snapshot. Reads alag scale hote hain, to CQRS: Postgres writes, outbox/CDC Kafka se Elasticsearch/Redis read models; order confirm screen write response se."

**Galti mat karna:** Har CRUD app pe event sourcing, ya CQRS aur ES ko ek cheez samajhna. Eventual consistency ka zikr na karna, `expected_version` bhoolna.
