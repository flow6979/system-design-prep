**Ek line:** Multi-service business action me ya sab ho ya sab undo ho: microservices me 2PC nahi, Saga + outbox + ledger + reconciliation.

- **Problem:** har service ka apna DB, global `COMMIT` nahi; partial states ("paisa kata, order fail").
- **2PC:** prepare + commit. Blocking, slow, availability kam, Kafka/Stripe participate nahi karte. Microservices me avoid.
- **Saga:** local transactions ki chain; fail pe compensating actions (payment → refund).
- **Choreography:** events, 2–3 simple steps. **Orchestration:** central orchestrator, critical flows (Temporal, Step Functions).
- **Saga rules:** steps + compensations idempotent; isolation nahi (PENDING status); compensation fail pe retry, phir manual queue.
- **Outbox + CDC:** event same DB txn me outbox table, relay/Debezium Kafka me; at-least-once, consumers idempotent.
- **Double-entry ledger:** append-only debit+credit, total zero; galti pe reversal entry.
- **Reconciliation:** periodic job ledger vs gateway/bank; atke PENDING (30 min) ka status poochho.
- **Ek DB me sab ho** to normal ACID transaction.

**Interview me bolo:** "Order, payment, inventory alag services hain, to 2PC nahi (blocking, gateway participate nahi karta). Orchestrated Saga with compensations, events outbox se. Paise ke liye double-entry ledger, idempotency key aur daily reconciliation."

**Galti mat karna:** Saga bolna par compensation define na karna, ya DB write ke baad seedha Kafka publish (dual write). Payment design me reconciliation skip karna.
