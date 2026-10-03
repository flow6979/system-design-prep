**In one line:** Async API (202) → Kafka topics per channel x priority → workers throttled to provider limits; idempotency, retry topics and DLQ prevent both loss and duplicates.

- **Requirements:** push/SMS/email/in-app with preferences, quiet hours and limits; no misses, no duplicates.
- **Scale:** ~1.2K/sec avg, campaign 10M in 10 min = ~17K/sec; ~100K msgs/sec peak incl. status; SMS provider ~1K/sec.
- **Components:** API (Idempotency-Key), Redis dedup/prefs, Kafka, channel workers, provider adapters + fallback, Cassandra status.
- **Async 202 + queue over sync call:** a slow Twilio must not slow the Order Service.
- **Topic per channel + priority over one queue:** OTP must not wait 20 min behind marketing.
- **Kafka over SQS:** ~100K msgs/sec, 2 status consumers, replay; SQS fits better at ~1K/sec.
- **Retry topics + backoff + DLQ over inline retry:** no partition blocking; ordering is lost on retry.
- **Idempotency key + Redis dedup over Kafka exactly-once:** the third-party call is not in the transaction.
- **Failure:** provider down → circuit breaker + fallback vendor; Redis down → transactional fails open, marketing fails closed.
- **Senior signal:** the bottleneck is the provider rate limit (10M SMS = ~3 hours); per-provider token bucket, give callers an ETA.

**Say in the interview:** "The bottleneck is providers, not my servers. Kafka buffers, per-channel workers throttle to provider limits, and an idempotency key prevents duplicates."

**Avoid:** Mixing OTP and marketing in one queue; relying on Kafka exactly-once to stop duplicate sends.
