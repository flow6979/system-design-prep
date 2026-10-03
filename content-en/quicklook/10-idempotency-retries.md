**In one line:** Receiving the same request two or three times must have the effect of one; retries are only safe if the server is idempotent.

- **Timeout:** means "unknown", not "failed", so a retry can create a duplicate.
- **No exactly-once delivery:** at-least-once plus idempotent processing = effectively-once. Say this.
- **Idempotency-Key:** client generates a UUID, same key on retry. Key absent → insert and do work; DONE → return saved response; IN_PROGRESS → 409.
- **Same DB transaction:** key insert and business write together. A PRIMARY KEY stops concurrent duplicates.
- **Naturally idempotent:** PUT, DELETE, `SET balance=100`. Not: `POST /pay`, `balance += 100`.
- **Consumer dedupe:** UNIQUE `event_id` or `ON CONFLICT DO NOTHING`.
- **Retry:** exponential backoff + jitter, max 3–5, cap ~30s, then DLQ.
- **Retryable errors only:** timeout, 503, 429 (honor `Retry-After`). Never 400/401.
- **Retry storm:** 3 layers × 3 retries = 27x load. Retry at one layer, ~10% retry budget, circuit breaker.
- **Outbox:** write the event to an outbox table in the same txn; a relay/CDC publishes it.

**Say in the interview:** "Exactly-once delivery isn't possible, so at-least-once plus idempotent processing. The client sends an Idempotency-Key, the server stores it in the same transaction as the business write. Retries use backoff with jitter at a single layer."

**Avoid:** Saying "Kafka gives exactly-once" and skipping dedup. Generating the key server-side, or checking the key and writing in separate transactions.
