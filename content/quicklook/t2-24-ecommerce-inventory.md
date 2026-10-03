**Ek line:** Checkout saga: conditional UPDATE reserve (15 min TTL) → payment → confirm → ship, outbox → SNS/SQS, ek Postgres primary.

- **Requirements:** browse → cart → checkout; oversell nahi, order/payment/inventory/shipping consistent.
- **Scale:** ~12K read QPS (peak 60K), ~60 orders/sec (sale 600), 100M SKUs ~500 GB, ~3K events/sec; hot SKU row = asli problem.
- **Components:** ES + Redis + CDN catalog, DynamoDB cart, Postgres (inventory/orders), saga orchestrator, outbox, sweeper.
- **Conditional UPDATE over read-then-write/`SELECT FOR UPDATE`:** atomic check + decrement, short lock.
- **Reserve at checkout with TTL over reserve in cart:** cart me reserve = hafton block; payment ke baad check = oversell.
- **Saga over 2PC:** gateway 2PC support nahi; compensations + idempotent steps.
- **Outbox + SNS/SQS over Kafka:** atomic with DB, DLQ, ~3K/sec.
- **Single Postgres primary over sharding:** 600 writes/sec easy; sharding abhi nahi.
- **DynamoDB cart:** always-writable, TTL; ES + CDN catalog, eventual stock badge.
- **Stock per (sku, warehouse) + nightly reconciliation + 1-2 unit buffer.**
- **Senior signal:** hot SKU row serialize + missed webhook = 15 min HELD; sub-buckets, flash sale flow, reconciliation.

**Interview me bolo:** "Do mushkil cheezein: read scale (cache) aur hot SKU contention (conditional update + TTL reservation). Services ke beech saga + outbox."

**Galti mat karna:** Stock check app me read-then-write mat karo; 2PC mat suggest karo.
