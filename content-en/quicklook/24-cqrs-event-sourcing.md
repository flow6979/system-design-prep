**In one line:** CQRS = separate models for writes and reads; Event Sourcing = store immutable events instead of state and rebuild state by replay.

- **CQRS:** normalized write model with rules (Postgres); query-shaped read models (Elasticsearch, Redis).
- **Sync:** a projector updates read models from events or CDC.
- **Eventual consistency:** return fresh data in the write response, read critical data from the write DB, put a `version` on read models.
- **Event sourcing:** append-only events; balance = sum of events. Audit and time-travel for free.
- **Replay:** a new read model = replay the log from the start.
- **Snapshots:** every N events; load = latest snapshot plus later events.
- **Concurrency:** check `expected_version` on append (optimistic lock), or you get double spend.
- **Schema evolution:** events are immutable; create `v2` and upcast v1 → v2 on read. Never edit.
- **Outbox:** the event store is the outbox; one event = state + saga step + read view.
- **Use:** audit (ledger, wallet, trading), history as a feature, read:write ~100:1.
- **Don't:** simple CRUD, small team. GDPR: encrypt per-user, drop the key on delete (crypto-shredding).
- **CQRS alone is common;** event sourcing only where history is the product.

**Say in the interview:** "For the wallet I won't overwrite balance; each change is an immutable event, with a snapshot every 100 events. Reads scale differently, so CQRS: Postgres writes, outbox/CDC via Kafka into Elasticsearch/Redis read models; the order-confirm screen uses the write response."

**Avoid:** Event sourcing every CRUD app, or conflating CQRS with event sourcing. Not mentioning eventual consistency, or omitting `expected_version`.
