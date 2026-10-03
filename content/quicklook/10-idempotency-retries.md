**Ek line:** Same request do-teen baar aaye tab bhi effect ek hi baar ho; retry tabhi safe jab server idempotent ho.

- **Timeout:** "fail" nahi, "pata nahi". Isliye retry duplicate bana sakta hai.
- **Exactly-once delivery nahi hota:** at-least-once + idempotent processing = effectively-once. Yahi bolo.
- **Idempotency-Key:** client UUID banata hai, retry pe same key. Server key nahi hai → insert + kaam; DONE → saved response; IN_PROGRESS → 409.
- **Same DB transaction:** key insert aur business write saath. PRIMARY KEY duplicate rok deta hai.
- **Natural idempotent:** PUT, DELETE, `SET balance=100`. Non-idempotent: `POST /pay`, `balance += 100`.
- **Consumer dedupe:** `event_id` UNIQUE ya `ON CONFLICT DO NOTHING`.
- **Retry:** exponential backoff + jitter, max 3–5, cap ~30s, phir DLQ.
- **Sirf retryable errors:** timeout, 503, 429 (`Retry-After` maano). 400/401 pe nahi.
- **Retry storm:** 3 layers × 3 retries = 27x load. Retry ek layer pe, retry budget ~10%, circuit breaker.
- **Outbox:** event same txn me outbox table me, relay/CDC publish kare.

**Interview me bolo:** "Exactly-once delivery possible nahi, isliye at-least-once + idempotent processing. Client Idempotency-Key bheje, server business write ke saath same transaction me store kare. Retries backoff + jitter, ek layer pe."

**Galti mat karna:** "Kafka exactly-once deta hai" bol ke dedup skip karna. Key server pe generate karna, ya check aur write alag transactions me.
