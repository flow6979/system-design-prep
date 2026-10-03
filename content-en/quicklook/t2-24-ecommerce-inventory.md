**In one line:** Checkout saga: conditional UPDATE reserve (15 min TTL) → payment → confirm → ship, events via outbox → SNS/SQS, one Postgres primary.

- **Requirements:** browse → cart → checkout; no oversell, order/payment/inventory/shipping stay consistent.
- **Scale:** ~12K read QPS (peak 60K), ~60 orders/sec (sale 600), 100M SKUs ~500 GB, ~3K events/sec; the hot SKU row is the real problem.
- **Components:** ES + Redis + CDN catalog, DynamoDB cart, Postgres (inventory/orders), saga orchestrator, outbox, sweeper.
- **Conditional UPDATE over read-then-write/`SELECT FOR UPDATE`:** atomic check + decrement, short lock.
- **Reserve at checkout with TTL over reserve in cart:** cart reservations block stock for days; checking after payment oversells.
- **Saga over 2PC:** gateways do not support 2PC; compensations + idempotent steps.
- **Outbox + SNS/SQS over Kafka:** atomic with the DB, DLQ, ~3K/sec.
- **Single Postgres primary over sharding:** 600 writes/sec is easy; no sharding yet.
- **DynamoDB cart:** always writable, TTL; ES + CDN catalog with an eventual stock badge.
- **Stock per (sku, warehouse) + nightly reconciliation + 1-2 unit buffer.**
- **Senior signal:** hot SKU row serializes + missed webhook = 15 min HELD; sub-buckets, flash sale flow, reconciliation.

**Say in the interview:** "Two hard parts: read scale (cache) and hot SKU contention (conditional update + TTL reservation). Across services I use a saga with an outbox."

**Avoid:** Read-then-write stock checks in the app; suggesting 2PC.
