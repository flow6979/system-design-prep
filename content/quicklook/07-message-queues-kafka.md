**Ek line:** Service A queue me message daalta hai, B apni speed se padhta hai: decouple, spike buffer, async kaam; par Kafka tabhi jab zarurat ho.

- **Queue kyun:** decouple, buffer (1L/sec spike vs 20K/sec workers), async slow kaam, retry.
- **Queue vs pub/sub vs log:** queue = ek consumer, delete; pub/sub = sabko copy; log (Kafka) = retention + replay.
- **Partition:** ordered log, parallelism ki unit. Same key → same partition → order.
- **Ordering:** sirf ek partition ke andar. Key = `chat_id` / `account_id`.
- **Consumer group:** group me partition ek hi consumer ko; consumers > partitions = idle. Partitions pehle se kaafi (50–100).
- **Delivery:** default at-least-once + idempotent consumer (dedupe `event_id`).
- **DLQ:** 3–5 retries ke baad poison message DLQ me, alert + reprocess; retry topics with backoff.
- **Back-pressure:** consumer lag pe alert + autoscale; low-priority drop, payments nahi.
- **Kafka kab:** ~100K+ events/sec, replay, multiple consumer groups, per-key order at scale.
- **Kafka nahi:** task queue = SQS/RabbitMQ; DB+event atomic = outbox; kuch hazaar/din = DB table + cron.
- **Sync wahan jahan turant result chahiye** (login, balance).

**Interview me bolo:** "Kafka isliye ki do independent consumer groups aur 7 din replay chahiye. At-least-once, consumers `event_id` se dedupe, 5 retries ke baad DLQ. Sacrifice: ops aur cost."

**Galti mat karna:** Poore topic pe ordering assume karna, DLQ na rakhna. 500 jobs/min ke liye Kafka.
