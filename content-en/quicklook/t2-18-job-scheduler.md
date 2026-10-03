**In one line:** Time-bucketed sharded Postgres + a per-shard leader feeding SQS; workers pull with leases; at-least-once with idempotent jobs and fencing tokens.

- **Requirements:** one-time, delayed and cron jobs at the right time, with retries; no misses, minimal doubles.
- **Scale:** ~120/sec avg but ~10K/sec peak at cron round times; ~10 GB/day history.
- **Components:** job definition vs execution rows (`UNIQUE(job_id, scheduled_at)`), sharded Postgres, leader per shard, SQS, workers, DLQ.
- **Time-bucket index over full scan/in-memory PQ:** `run_at <= now()` scans are slow; a PQ loses data on crash.
- **Pull + lease over push:** natural backpressure, automatic recovery on lease expiry.
- **At-least-once + idempotent over exactly-once:** exactly-once cannot be guaranteed across a crash.
- **Postgres lease-row leader over etcd/ZK:** no new cluster; ~10 sec failover.
- **SQS over Kafka:** bursts, visibility timeout, per-message retry + DLQ.
- **Backoff + DLQ over immediate retry:** gives downstream room, isolates poison jobs.
- **Fencing token (attempt):** rejects a stale result from a GC-paused zombie worker.
- **Senior signal:** the real risk is schedule lag at midnight; p99 lag metric, queue-depth autoscaling, jitter.

**Say in the interview:** "Average load is nothing; the problem is the midnight burst and no-miss, no-double on crash. I use at-least-once with idempotent jobs, leases and fencing tokens."

**Avoid:** Claiming exactly-once; trusting worker clocks instead of DB/leader time.
