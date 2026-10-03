**In one line:** When one business action spans services, either all happen or all are undone: no 2PC across microservices, use Saga + outbox + ledger + reconciliation.

- **Problem:** each service owns its DB, there's no global `COMMIT`; partial states ("money charged, order failed").
- **2PC:** prepare + commit. Blocking, slow, lowers availability, Kafka/Stripe don't participate. Avoid in microservices.
- **Saga:** chain of local transactions; on failure run compensating actions (payment → refund).
- **Choreography:** events, for 2–3 simple steps. **Orchestration:** central orchestrator, for critical flows (Temporal, Step Functions).
- **Saga rules:** steps and compensations idempotent; no isolation (use PENDING status); retry failed compensations, then a manual queue.
- **Outbox + CDC:** write the event to an outbox table in the same DB txn, relay/Debezium publishes to Kafka; at-least-once, so idempotent consumers.
- **Double-entry ledger:** append-only debit+credit, sums to zero; fix mistakes with reversal entries.
- **Reconciliation:** periodic job comparing ledger vs gateway/bank; query the status of PENDING items stuck 30 min.
- **If everything is in one DB,** use a normal ACID transaction.

**Say in the interview:** "Order, payment and inventory are separate services, so no 2PC (blocking, the gateway can't participate). Orchestrated Saga with compensations, events via outbox. For money: double-entry ledger, idempotency key, daily reconciliation."

**Avoid:** Saying Saga without defining compensations, or publishing to Kafka right after the DB write (dual write). Skipping reconciliation in a payment design.
