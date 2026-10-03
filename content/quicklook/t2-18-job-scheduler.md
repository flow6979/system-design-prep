**Ek line:** Time-bucketed sharded Postgres + per-shard leader → SQS; workers pull with lease; at-least-once + idempotent jobs, fencing token.

- **Requirements:** one-time, delayed, cron jobs sahi time pe, retries; na miss, na (jitna ho sake) double.
- **Scale:** ~120/sec avg, par cron round times pe ~10K/sec peak; ~10 GB/day history.
- **Components:** job definition vs execution rows (`UNIQUE(job_id, scheduled_at)`), sharded Postgres, leader per shard, SQS, workers, DLQ.
- **Time-bucket index over full scan/in-memory PQ:** `run_at <= now()` scan slow; PQ crash = loss.
- **Pull + lease over push:** natural backpressure, auto recovery on expiry.
- **At-least-once + idempotent over exactly-once:** exactly-once crash ke beech possible nahi.
- **Postgres lease-row leader over etcd/ZK:** naya cluster nahi; ~10 sec failover.
- **SQS over Kafka:** burst, visibility timeout, per-message retry + DLQ.
- **Backoff + DLQ over immediate retry:** downstream ko saans, poison job alag.
- **Fencing token (attempt):** GC-paused zombie ka purana result reject.
- **Senior signal:** asli risk midnight schedule lag; p99 lag metric, queue-depth autoscale, jitter.

**Interview me bolo:** "Average load kuch nahi, problem midnight burst aur crash pe no miss, no double hai. At-least-once delivery with idempotent jobs aur lease + fencing."

**Galti mat karna:** Exactly-once ka claim mat karo; clock skew me workers ka time mat use karo, DB/leader time.
