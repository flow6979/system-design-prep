**In one line:** Postgres ACID + Idempotency-Key + double-entry ledger + saga/outbox, PSP called async (webhook + poller), and an explicit UNKNOWN state on timeout.

- **Requirements:** card/UPI pay → PSP → ledger → merchant settlement; money never double-charged or lost.
- **Scale:** ~115 TPS avg, ~1,200 TPS peak, ~10K DB writes/sec; ledger ~40M rows/day. PSP latency 1-5 sec (sometimes 30+).
- **Components:** Payment Service, idempotency table, ledger (same Postgres), outbox → SQS, PSP adapters, token vault, recon.
- **Postgres over Cassandra:** ledger + status in one commit; this is a correctness problem, not throughput.
- **Idempotency key `(merchant_id, key)` unique:** clients will retry on timeout and must get the same result.
- **Double-entry append-only ledger over a balance column:** every rupee traceable, auditable.
- **Saga + outbox over 2PC:** PSPs do not support 2PC; outbox → SQS (Kafka is overkill).
- **Async PSP + webhook + poller over sync wait:** no blocked threads; daily reconciliation.
- **UNKNOWN state over timeout = FAILED:** otherwise a retry double-charges; no cross-PSP retry.
- **Token vault:** card data lives only in the vault, keeping PCI scope small.
- **Senior signal:** double debit on PSP timeout is the biggest risk; hot `psp_clearing` row → append-only entries + rollup.

**Say in the interview:** "Throughput is small, correctness is the problem. SQL ACID, idempotency keys, a double-entry ledger, and an UNKNOWN state on timeout that a poller and reconciliation resolve."

**Avoid:** Treating a timeout as FAILED; storing card data in the main DB.
