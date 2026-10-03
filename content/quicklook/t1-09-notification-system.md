**Ek line:** Async API (202) → Kafka topics per channel x priority → workers provider rate limit me; idempotency + retry topics + DLQ se na miss, na duplicate.

- **Requirements:** push/SMS/email/in-app, preferences + quiet hours + limits; na chhute, na duplicate.
- **Scale:** ~1.2K/sec avg, campaign 10M in 10 min = ~17K/sec; ~100K msgs/sec peak incl. status; SMS provider ~1K/sec.
- **Components:** API (Idempotency-Key), Redis dedup/prefs, Kafka, channel workers, provider adapters + fallback, Cassandra status.
- **Async 202 + queue over sync call:** slow Twilio Order Service ko slow nahi karega.
- **Topic per channel + priority over common queue:** OTP marketing ke peeche 20 min late nahi.
- **Kafka over SQS:** ~100K msgs/sec, 2 status consumers, replay; SQS ~1K/sec pe better.
- **Retry topics + backoff + DLQ over inline retry:** partition block nahi; retry pe ordering lost.
- **Idempotency key + Redis dedup over Kafka exactly-once:** third-party call txn me nahi aata.
- **Failure:** provider down → circuit breaker + fallback vendor; Redis down → transactional fail-open, marketing fail-closed.
- **Senior signal:** bottleneck provider rate limit hai (10M SMS = ~3 ghante); per-provider token bucket, caller ko ETA.

**Interview me bolo:** "Bottleneck providers hain, mere servers nahi. Kafka buffer, per-channel workers aur provider-wise rate limiting; duplicates idempotency key se roke."

**Galti mat karna:** OTP aur marketing ek queue me mat daalo; Kafka exactly-once pe bharosa mat karo.
