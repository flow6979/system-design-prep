---
title: Design a Payment System (Razorpay / Stripe)
order: 11
tier: 1
time: 25
patterns: [Idempotency, Double-entry ledger, State machine, Saga, Reconciliation]
topics: [10-idempotency-retries, 16-distributed-transactions, 06-cap-consistency, 02-sql-vs-nosql, 07-message-queues-kafka, 20-reliability-observability]
askedAt: [Stripe, Amazon, Razorpay, PhonePe, Paytm, Uber]
---

# Design a Payment System (Razorpay / Stripe)

**In one line:** a merchant (Swiggy) takes money from its customer, we collect the money from the bank/PSP through card/UPI/netbanking, record it in a ledger, and later settle it to the merchant. The core challenge is that **money is never charged twice and never lost**, no matter what happens with the network, retries or crashes.

**What the interviewer checks in this question:** idempotency, strong consistency, the payment state machine, working async (webhooks) with an external PSP, correct ledger design, and reconciliation.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Are we building a payment gateway (Razorpay) or the payment module of an e-commerce app?" | Gateway-like: pay-in for merchants | Merchant APIs, webhooks to merchant, settlement |
| "Will we process cards/UPI ourselves or use a PSP/acquirer bank?" | External PSP / bank | PSP adapter layer, async callbacks |
| "Will we store card data?" | No, tokenization | Small PCI scope, separate vault |
| "Are refunds and payouts in scope?" | Refunds yes, payouts brief | Reverse entries in the ledger |
| "How much consistency? Is it OK if money shows wrong?" | Not at all | SQL + ACID, consistency > availability |
| "Scale?" | ~10M payments/day, 10x during festive sales | Moderate write load, shard by merchant later |
| "Multi-currency, fraud detection?" | Brief / out of scope | Mention it and move on |

> **Say:** "In this system, correctness comes first. I will keep every write idempotent, run each payment through a state machine, record money in a double-entry ledger, and have reconciliation to catch mismatches with the PSP."

## Step 2: Requirements

**Functional**
1. A merchant creates a payment (amount, currency, order_id) → gets a payment intent
2. The customer pays by card/UPI, and we charge through the PSP
3. The merchant gets the payment status through webhook + API
4. Refund (full/partial)
5. Ledger + daily settlement to the merchant, and reconciliation with the bank/PSP

**Non-functional**
- **Exactly-once effect:** a payment is charged only once
- **Strong consistency:** the ledger is never wrong (debit = credit)
- **Durability + auditability:** every entry is immutable, history is never deleted
- **Availability:** 99.99%, but fail-safe when in doubt (don't charge)
- **Security:** PCI DSS, card data tokenized

## Step 3: Estimation (only what changes the design)

- 10M payments/day ≈ **115 TPS** avg, sale peak 10x ≈ **1,200 TPS**. Each payment makes ~5–10 DB writes (intent, attempts, ledger) → ~10K writes/sec at peak. A well-tuned Postgres cluster (sharded by merchant) can handle this.
- Ledger entries: 10M × 4 = 40M rows/day, ~15B/year. Append-only, partition by month.
- PSP latency is 1–5 sec, sometimes 30 sec+. So we use an **async flow + webhooks**, no synchronous wait.

> **Say:** "Throughput is not very large, so there is no need for NoSQL. The problem is correctness, so I will choose SQL with ACID."

## Step 4: Core entities

- **Merchant**: id, api_keys, webhook_url, settlement account
- **PaymentIntent**: id, merchant_id, amount, currency, order_id, status, idempotency_key
- **PaymentAttempt**: id, intent_id, method, psp, psp_reference, status (one intent can have multiple attempts)
- **LedgerEntry**: id, txn_id, account_id, debit/credit, amount, created_at (immutable)
- **Account** (ledger): customer_receivable, merchant_payable, psp_clearing, fees
- **Refund**: id, intent_id, amount, status
- **IdempotencyRecord**: key, merchant_id, request_hash, response, status

## Step 5: APIs

```http
POST /v1/payment_intents   {amount, currency, orderId}     → {intentId, clientSecret, status: CREATED}
     Header: Idempotency-Key: <uuid>
POST /v1/payment_intents/{id}/confirm  {paymentMethodToken} → {status: PROCESSING | REQUIRES_ACTION}
     Header: Idempotency-Key: <uuid>
GET  /v1/payment_intents/{id}                               → {status, amount, attempts}
POST /v1/refunds  {intentId, amount}                        → {refundId, status}
POST /internal/psp/webhook  (PSP → us, signed)              → 200
Outgoing: POST merchant.webhook_url {event: payment.succeeded, intentId}  (HMAC signed)
```

> **Say:** "Create and confirm are separate, because the customer has to approve 3DS/OTP or approve in the UPI app. An Idempotency-Key is mandatory on every mutating API."

## Step 6: High-level design

```mermaid
flowchart LR
  M["Merchant backend"] --> G["API Gateway (auth, rate limit)"]
  CU["Customer checkout"] --> V["Token Vault (PCI zone)"]
  G --> P["Payment Service"]
  P --> DB[("Postgres payments + idempotency")]
  P --> PA["PSP Adapter"]
  PA --> PSP["PSP / Card network / UPI"]
  PSP -- "webhook" --> WH["Webhook Ingest"]
  WH --> P
  P --> LG["Ledger Service"]
  LG --> LDB[("Postgres ledger, append-only")]
  P --> K[["Kafka (outbox events)"]]
  K --> MW["Merchant Webhook Dispatcher"]
  K --> RE["Reconciliation Service"]
  RE --> S3[("S3 PSP settlement files")]
```

**Why each component:**
- **Token Vault:** the card number comes only here (a separate PCI network). The rest of the system only gets `tok_abc`. Small PCI scope.
- **Payment Service:** the state machine for intents + attempts. The idempotency check happens here.
- **PSP Adapter:** each PSP (Visa via acquirer, UPI via NPCI bank, netbanking) has a different API. The adapter gives them a common interface, and also does routing and failover.
- **Webhook Ingest:** the PSP sends the result async. Verify the signature, dedup by psp_event_id, then pass it to the Payment Service.
- **Ledger Service:** double-entry, append-only. The source of truth for money.
- **Kafka + outbox:** DB commit and event publish happen atomically (CDC from the outbox table). Merchant webhooks and analytics read from it.
- **Reconciliation:** compares the PSP/bank's daily settlement file with our ledger.

## Step 7: Main flow: card payment

```mermaid
sequenceDiagram
  participant M as Merchant
  participant P as Payment Service
  participant DB as Postgres
  participant A as PSP Adapter
  participant X as PSP
  participant L as Ledger
  M->>P: POST confirm, Idempotency-Key k1, token tok_abc
  P->>DB: INSERT idempotency k1 IN_PROGRESS, attempt PROCESSING
  P->>A: charge 500 INR, attempt_id a1 as PSP idempotency key
  A->>X: authorize and capture
  X-->>A: 202 accepted, pending
  P-->>M: status PROCESSING
  X-->>P: webhook: a1 SUCCEEDED
  P->>DB: BEGIN, attempt SUCCEEDED, intent SUCCEEDED, outbox event, COMMIT
  P->>L: post txn a1 debit psp_clearing, credit merchant_payable
  P-->>M: webhook payment.succeeded
```

If the webhook does not arrive, a **status poller** asks the PSP `GET status(a1)` every 1–5 min.

## Step 8: Data model & DB choice

```sql
payment_intents(id PK, merchant_id, amount BIGINT, currency, status, order_id,
                UNIQUE(merchant_id, idempotency_key), version, created_at)
payment_attempts(id PK, intent_id FK, psp, psp_ref UNIQUE, status, created_at)
idempotency_keys(merchant_id, key, request_hash, response_json, status, PRIMARY KEY(merchant_id, key))
ledger_entries(id PK, txn_id, account_id, direction DEBIT|CREDIT, amount BIGINT, created_at)
  -- rule: SUM(debit) = SUM(credit) per txn_id, rows never UPDATE or DELETE
outbox(id PK, aggregate_id, event_type, payload, published BOOL)
```

- **Postgres** (or MySQL): ACID, unique constraints, transactions. Always store money as **BIGINT in paise** (₹500 = 50000), never as float.
- Shard by `merchant_id` when one cluster is not enough. The ledger goes in a separate DB.

## Step 9: Deep dives (the interviewer will push here)

### 9.1 Idempotency: how will you stop a double charge?
1. The merchant sends an `Idempotency-Key` with every request. We do a unique insert on `(merchant_id, key)`.
2. Insert succeeds → a new request, process it, and save the response at the end.
3. Unique violation → the key came before. If it is `IN_PROGRESS`, return 409 "retry later". If it is `DONE`, **return the saved response**. If the hash of the request body is different, return 422.
4. Also send our `attempt_id` to the PSP as its idempotency key. Our retry will not double charge at the PSP.
5. Webhooks arrive as duplicates: keep `psp_event_id` unique, and make state transitions idempotent (SUCCEEDED → SUCCEEDED is a no-op).

> **Say:** "Exactly-once delivery is not possible over a network. I get an exactly-once **effect** from at-least-once retries + idempotent processing."

### 9.2 Payment state machine
```mermaid
flowchart LR
  CR["CREATED"] --> PR["PROCESSING"]
  PR --> RA["REQUIRES_ACTION (OTP/3DS)"]
  RA --> PR
  PR --> SU["SUCCEEDED"]
  PR --> FA["FAILED"]
  PR --> UN["UNKNOWN (timeout)"]
  UN --> SU
  UN --> FA
  SU --> RF["REFUNDED / PARTIALLY_REFUNDED"]
```
- Transitions happen only on allowed edges. Update like this: `UPDATE ... SET status='SUCCEEDED' WHERE id=? AND status IN ('PROCESSING','UNKNOWN')`. Optimistic and race-safe.
- **UNKNOWN** is the most important state: on a PSP timeout we cannot assume it failed. The poller/reconciliation will resolve it. Don't let the customer be charged again until UNKNOWN is resolved.

### 9.3 Double-entry ledger
- Every money movement is a **txn** with at least 2 entries: one debit, one credit, with equal sums.
- Payment success: `debit psp_clearing 500, credit merchant_payable 490, credit fees_revenue 10`.
- Refund: reverse entries, the old entry is never edited. This gives an audit trail.
- Balance = sum of entries (or a materialized balance table updated in the same transaction).
- Nightly check: every txn has debit = credit, and the system-wide total is zero. Mismatch = alert.

### 9.4 Saga across Order and Payment
The Order Service (Swiggy) and Payment are separate services, so a single DB transaction is not possible.
- **Choreography saga:** Order `PENDING_PAYMENT` → Payment succeeded event → Order `CONFIRMED`. Payment fails → Order `CANCELLED`.
- If the order confirm fails (restaurant closed) → trigger **compensation = refund**.
- Events are published with the **outbox pattern**, so the DB commit and the event either both happen or neither does. No 2PC, because the PSP doesn't support 2PC and it is blocking.

### 9.5 Reconciliation
- The PSP/bank gives a settlement file every day (SFTP/API → S3).
- The recon job matches each row of the file with our attempts and ledger by `psp_ref`.
- Three buckets: **matched**, **we have it, PSP doesn't** (an UNKNOWN that actually failed), **PSP has it, we don't** (missed webhook → mark SUCCEEDED, or auto refund).
- Amount mismatch → manual ops queue. This is the last safety net.

### 9.6 PCI and tokenization
- The card number goes from the checkout page directly to the **Vault** (iframe/SDK), not even to the merchant server.
- The vault encrypts it (HSM keys) and returns `tok_abc`. The Payment Service only uses the token. The PCI audit covers only the vault.
- This same layer handles network tokenization (Visa/Mastercard tokens) and RBI card-on-file rules.

### 9.7 Multiple payment gateways: routing (like Juspay)
Big merchants (Swiggy, Flipkart) don't depend on one PSP. On top they have a **payment orchestration layer** that picks the best route for each payment between Razorpay, PayU, Cashfree and direct bank integrations.

- **Routing rules:** inputs for each attempt: method (card/UPI/netbanking), issuer bank, card network, UPI app (PhonePe/GPay), amount. Score = **success rate** (biggest weight) + **cost** (MDR fee) + **health** (latency, error rate). Merchant rules too: "HDFC credit cards → PayU", "₹1 lakh+ → bank direct".
- **Real-time success rate:** for each `(psp, bank, method)`, success/total counts in a **sliding window** (last 5–15 min), as time-bucketed counters in Redis (one bucket per minute). For combos with very little traffic, fall back to the global average. Send a little traffic (~5%) to other PSPs for exploration, so their data stays fresh.
- **Automatic failover (circuit breaker):** if a PSP's success rate drops below a threshold or timeouts rise → circuit **OPEN**, new traffic goes to another PSP. After a while, **HALF_OPEN**: send a little traffic to check, and if it is fine, CLOSED.
- **Retry on another PSP only when it is safe:**
  - Safe: the PSP gave a clear **FAILED** (decline, connection refused, the request never reached the PSP). Create a new `PaymentAttempt` with a new attempt_id and send it to another PSP.
  - Unsafe: **timeout / UNKNOWN**. The first PSP may already have charged. Retrying on another PSP here = **double debit**. First poll/resolve the status.
  - Only one attempt per intent can be `PROCESSING` (DB constraint), and an intent becomes SUCCEEDED only once. If two successes come by mistake, auto refund the second one.
- **Tokenization vault:** if a card is saved in a PSP's vault, it works only on that PSP. So keep cards in **your own vault** (or use Visa/Mastercard network tokens), and send the token/card to the chosen PSP at routing time. This way any PSP can be chosen while the card stays saved.

```mermaid
flowchart LR
  P["Payment Service"] --> R["Router: rules + success rate"]
  SR[("Redis sliding window stats")] --> R
  R --> CB{"Circuit breaker healthy?"}
  CB -- "yes" --> A1["Razorpay"]
  CB -- "no, failover" --> A2["PayU"]
  R --> A3["Cashfree or bank direct"]
  A1 -- "result" --> SR
  A2 -- "result" --> SR
```

> **Say:** "The router picks a PSP based on success rate, cost and health. A retry on another PSP happens only on a definite failure, not on a timeout, because there is a double debit risk there."

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Postgres (SQL, ACID)** | Transactions, unique constraints, strong consistency. Moderate write load | **Cassandra/DynamoDB:** weak multi-row transactions and constraints, eventual consistency is risky for money |
| **Idempotency key table** | Same result on retry, no double charge | **Trusting the client not to retry:** retries will happen on network timeouts |
| **Double-entry append-only ledger** | Every rupee is traceable, auditable, errors get caught | **Only updating a `balance` column:** no history, and if there is a bug you can't tell what went wrong |
| **Saga + outbox** | Services decoupled, recover with compensation | **2PC/XA:** PSP doesn't support it, blocking, coordinator is a SPOF |
| **Async PSP + webhooks + poller** | Threads don't block even if the PSP is slow | **Synchronous wait of 30 sec:** threads and connections run out, state is unclear on timeouts |
| **Token vault** | PCI scope is only one small service | **Card data in the main DB:** the whole system is in PCI scope, big breach risk |
| **Explicit UNKNOWN state** | No wrong assumption on timeout | **Treating timeout = FAILED:** the customer retries and gets charged twice |
| **Multi-PSP orchestration + success-rate routing** | Failover if one PSP is down/degraded, better success rate and cost | **Single PSP:** its outage = our outage, and no option when success rate is bad for some bank |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle it |
|---|---|---|
| PSP timeout | Don't know if it was charged or not | UNKNOWN state, poller + recon resolve it, safe retry with the PSP idempotency key |
| Webhook missed | Money taken, status PROCESSING | Status poller + daily reconciliation |
| Duplicate webhook | Risk of double ledger entry | `psp_event_id` unique, idempotent transition |
| Payment Service crash midway | Half-done state | DB transaction + outbox, resume from the idempotency record `IN_PROGRESS` |
| PSP down | Payments fail | PSP Adapter routes to another PSP (smart routing by success rate) |
| Merchant webhook endpoint down | Merchant gets no update | Exponential backoff retries for 24–72 hrs, DLQ, merchant can poll with the GET API |
| Ledger imbalance | Money mismatch | Nightly invariant check, alert, ops queue |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Smart PSP routing:** track the live success rate of each PSP/bank and choose the best route (like Razorpay). Success rate goes up by 2–3%.
- **Fraud/risk engine:** velocity checks, device fingerprint, ML score before confirm.
- **Multi-region active-passive:** the ledger in one primary region (consistency), with a sync replica in the DR region.
- **Settlement + payouts service:** T+1 merchant payouts, batch bank transfers, with its own reconciliation.
- **Move the ledger to a dedicated immutable store** (like TigerBeetle or QLDB style) as scale grows.
- **Observability:** dashboards + alerts for per-PSP success rate, UNKNOWN count, recon mismatch count.
- **ML-based routing:** a bandit/ML model on top of the sliding-window rules that predicts each PSP's success probability for every payment, and tunes the cost vs success trade-off per merchant.

## Step 13: Likely follow-up questions

- "The client retried, how was there no double charge?" → Idempotency key + attempt_id key at the PSP (Step 9.1)
- "The PSP timed out, now what?" → UNKNOWN state, poll it, no blind retry
- "How do you get exactly-once?" → At-least-once + idempotent consumers + unique constraints = exactly-once effect
- "Consistency between order and payment?" → Saga with outbox, compensation = refund
- "What if there is a mistake in the ledger?" → Don't edit the entry, add a reversal entry
- "Why not float for money?" → Rounding errors. Store the smallest unit as BIGINT
- "Where is card data stored?" → Only in the vault, encrypted, everything else uses tokens

## 2-minute recap

> In a payment system correctness comes first, so we use Postgres with ACID. The merchant creates an intent and then confirms it, both with an Idempotency-Key enforced by a unique `(merchant_id, key)`. A payment is a state machine (CREATED → PROCESSING → SUCCEEDED/FAILED, and UNKNOWN on timeout). Our attempt_id goes to the PSP as its idempotency key. The PSP result comes async through a webhook, deduped by event id, with a poller as backup. Every money movement goes into a double-entry append-only ledger. DB commits and events go to Kafka through the outbox, and merchant webhooks go out from there. A saga with the order, with refund as compensation on failure. Daily reconciliation compares the PSP settlement file with the ledger. Card data lives only in the token vault (PCI).

## Checklist

- [ ] I can explain the payment intent create + confirm flow without looking
- [ ] I can explain the full idempotency key logic (IN_PROGRESS, DONE, hash mismatch)
- [ ] I can tell the payment state machine and the role of the UNKNOWN state
- [ ] I can write a double-entry ledger example with entries
- [ ] I can explain keeping order and payment consistent with saga + outbox
- [ ] I can tell the three mismatch buckets of reconciliation
- [ ] I can explain how tokenization makes the PCI scope smaller
- [ ] I can tell the trade-off of why SQL and why not 2PC
