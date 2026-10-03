**In one line:** Service A drops a message on a queue and B reads at its own pace: decoupling, spike buffering, async work; but use Kafka only when you need it.

- **Why queue:** decouple, buffer (100K/sec spike vs 20K/sec workers), async slow work, retry.
- **Queue vs pub/sub vs log:** queue = one consumer, deleted; pub/sub = copy to all; log (Kafka) = retention plus replay.
- **Partition:** ordered log, unit of parallelism. Same key → same partition → order.
- **Ordering:** only within a partition. Key = `chat_id` / `account_id`.
- **Consumer group:** each partition goes to one consumer in a group; extra consumers sit idle. Provision partitions up front (50–100).
- **Delivery:** default to at-least-once plus an idempotent consumer (dedupe on `event_id`).
- **DLQ:** after 3–5 retries a poison message goes to the DLQ with alerting and reprocess; retry topics with backoff.
- **Back-pressure:** alert and autoscale on consumer lag; drop low-priority work, never payments.
- **Kafka when:** ~100K+ events/sec, replay, multiple consumer groups, per-key order at scale.
- **Not Kafka:** task queue = SQS/RabbitMQ; atomic DB+event = outbox; a few thousand/day = DB table + cron.
- **Stay synchronous** where the user needs the result now (login, balance).

**Say in the interview:** "Kafka because I need two independent consumer groups and 7-day replay. At-least-once, consumers dedupe on `event_id`, DLQ after 5 retries. Sacrifice: ops and cost."

**Avoid:** Assuming ordering across a whole topic, or skipping the DLQ. Kafka for 500 jobs/min.
