**Ek line:** Postgres ACID + Idempotency-Key + double-entry ledger + saga/outbox, PSP async (webhook + poller), timeout pe explicit UNKNOWN state.

- **Requirements:** card/UPI pay → PSP → ledger → merchant settle; paisa na double kate, na kho jaye.
- **Scale:** ~115 TPS avg, ~1,200 TPS peak, ~10K DB writes/sec; ledger ~40M rows/day. PSP latency 1-5 sec (kabhi 30+).
- **Components:** Payment Service, idempotency table, ledger (same Postgres), outbox → SQS, PSP adapters, token vault, recon.
- **Postgres over Cassandra:** ledger + status ek commit; correctness problem hai, throughput nahi.
- **Idempotency key `(merchant_id, key)` unique:** timeout pe retry hoga hi, same result chahiye.
- **Double-entry append-only ledger over balance column:** har paisa traceable, audit.
- **Saga + outbox over 2PC:** PSP 2PC support nahi karta; outbox → SQS (Kafka overkill).
- **Async PSP + webhook + poller over sync wait:** threads block nahi; daily reconciliation.
- **UNKNOWN state over timeout = FAILED:** warna retry pe double charge; cross-PSP retry nahi.
- **Token vault:** card data sirf vault me, PCI scope chhota.
- **Senior signal:** PSP timeout pe double debit sabse bada risk; hot `psp_clearing` row → append-only + rollup.

**Interview me bolo:** "Throughput chhota hai, problem correctness hai. SQL ACID, idempotency key, double-entry ledger, aur timeout pe UNKNOWN state jise poller aur recon resolve karein."

**Galti mat karna:** Timeout ko FAILED mat maano; card data main DB me mat rakho.
