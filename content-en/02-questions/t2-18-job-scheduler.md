---
title: Design Distributed Job Scheduler (Cron at Scale)
order: 18
tier: 2
time: 20
patterns: [Leases, Leader election, At-least-once, Retries, Time bucketing]
topics: [07-message-queues-kafka, 10-idempotency-retries, 09-locks-and-contention, 04-sharding-consistent-hashing, 20-reliability-observability, 06-cap-consistency]
askedAt: [Amazon, Google, Microsoft, Atlassian, Razorpay, Uber]
---

# Design Distributed Job Scheduler (Cron at Scale)

**In one line:** users register jobs (one-time, delayed, or cron like "every day at 2 AM"), and the system runs them on workers at the right time, with retries, without missing any and without running them twice (as far as possible).

**What the interviewer checks in this question:** how you find due jobs efficiently, how a job recovers when a worker crashes (leases), at-least-once + idempotency, retries/DLQ, and making sure the scheduler itself is not a single point of failure.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Impact on design |
|---|---|---|
| "Job types: one-time, delayed, recurring cron?" | All three | For recurring, compute next_run and create a new execution |
| "What is the job itself? Code or an HTTP call?" | Container image / handler name + payload | The worker is a generic executor |
| "Time precision?" | ~1 sec delay is fine | Second-level buckets, not ms |
| "Do we need exactly-once?" | At-least-once + idempotent jobs is OK | Leases + retries, job idempotency key |
| "Scale?" | 10M jobs/day, peak 10K jobs/sec (midnight cron) | Time-bucketed partitioned table, scheduler sharding |
| "How long does a job run?" | From seconds up to 1 hour | We need a lease heartbeat |

> **Say:** "I will keep the job definition and the job execution separate. The scheduler only puts due executions into a queue, and workers pull them and run them with a lease. The guarantee will be at-least-once, so jobs must be idempotent."

## Step 2: Requirements

**Functional**
1. Job create/update/delete: one-time, delayed (`run_at`), cron (`0 2 * * *`)
2. The job executes at its due time, with its payload
3. On failure, retry with backoff, and DLQ after max retries
4. Users can see job status and execution history

**Non-functional**
- **Reliability:** no due job is missed (durable)
- **Timeliness:** starts within < 2 sec of the due time
- **At-least-once** execution, duplicates are rare
- **Scale:** 10M executions/day, 10K/sec burst at midnight
- **HA:** the system keeps running if a scheduler or worker crashes

## Step 3: Estimation (only what changes the design)

- 10M/day ≈ **120/sec avg**, but cron jobs run at round times (00:00, every hour) → **10K/sec peak**. Design for the burst, not the average.
- Job record ~1 KB → 10M executions/day ≈ 10 GB/day of history. Keep 30 days → 300 GB, partition by day.
- Querying due jobs every second: `WHERE run_at <= now()` on the full table is slow, so use a time-bucket index.

> **Say:** "The average load is nothing. The problem is the midnight burst and the guarantee that a job is not missed on a crash and does not run twice."

## Step 4: Core entities

- **Job** (definition): job_id, owner, type (`ONCE`, `CRON`), cron_expr, handler, payload, max_retries, timeout
- **Execution** (each run): exec_id, job_id, scheduled_at, status (`SCHEDULED`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `DEAD`), attempt, lease_owner, lease_expires_at
- **Worker**: worker_id, capacity, last_heartbeat

## Step 5: APIs

```http
POST   /jobs {handler, payload, schedule: {cron | runAt | delaySec}, maxRetries, timeoutSec}
       Header: Idempotency-Key: <uuid>                 → {jobId}
GET    /jobs/{jobId}                                   → definition + next_run
DELETE /jobs/{jobId}                                   → 204
GET    /jobs/{jobId}/executions?limit=20               → history + status
POST   /executions/{execId}/heartbeat   (worker)       → extend lease
POST   /executions/{execId}/complete {status, output}  (worker)
```

## Step 6: High-level design

```mermaid
flowchart LR
  C["Client / Service"] --> API["Job API"]
  API --> DB[("Jobs + Executions DB")]
  ZK["etcd / ZooKeeper"] -. "leader election" .-> SC["Scheduler leader"]
  SC --> DB
  SC --> Q[["Ready Queue Kafka / SQS"]]
  Q --> W1["Worker pool"]
  W1 --> DB
  W1 --> DLQ[["Dead Letter Queue"]]
  W1 --> M["Metrics + Alerts"]
  RP["Lease reaper"] --> DB
  RP --> Q
```

**Why each component:**
- **Job API:** validates definitions, writes the first execution with `scheduled_at`.
- **DB (Postgres sharded / Cassandra):** durable source of truth for jobs and executions.
- **Scheduler leader:** picks up due executions every second and puts them into the ready queue. Leader election keeps only one active per shard.
- **Ready Queue:** buffer for workers, absorbs bursts, visibility timeout.
- **Workers:** pull, take a lease, run, heartbeat, complete.
- **Lease reaper:** puts executions with expired leases back into the queue.
- **DLQ:** after max retries, for manual inspection.

## Step 7: Main flow: from due job to completion

```mermaid
sequenceDiagram
  participant S as Scheduler leader
  participant DB as Executions DB
  participant Q as Ready Queue
  participant W as Worker
  S->>DB: SELECT due WHERE bucket = 12:00:05 AND status SCHEDULED
  S->>DB: UPDATE status QUEUED WHERE status SCHEDULED
  S->>Q: enqueue exec e1
  W->>Q: poll
  Q-->>W: e1, invisible for 60 sec
  W->>DB: UPDATE RUNNING, lease_owner w3, lease till now+60s WHERE status QUEUED
  W->>W: run handler with idempotency key e1
  W->>DB: heartbeat, extend lease
  W->>DB: UPDATE SUCCEEDED WHERE lease_owner w3
  W->>Q: ack e1
  S->>DB: CRON job - insert next execution 2026-10-04 02:00
```

## Step 8: Data model & DB choice

```sql
jobs(job_id PK, owner, type, cron_expr, handler, payload, max_retries, timeout_sec, enabled)
executions(exec_id PK, job_id, time_bucket, scheduled_at, status, attempt,
           lease_owner, lease_expires_at, last_error,
           UNIQUE(job_id, scheduled_at))
INDEX (shard_id, time_bucket, status)
```

- `time_bucket` = `scheduled_at` rounded to the minute/second. The scheduler reads only the current bucket, not the whole table.
- `UNIQUE(job_id, scheduled_at)`: the same cron run cannot be created twice, even if two schedulers run by mistake.
- At small scale, Postgres (conditional updates, `SKIP LOCKED`). At very large scale, Cassandra with partition key `(shard_id, time_bucket)`, like Airbnb/Uber do.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 How do you find due jobs?
- **Time-bucketed table:** partition key `(shard, minute_bucket)`. The scheduler queries the current bucket every second. The index scan is small, never the whole table.
- **Alternative: Redis ZSET** `ZADD due <run_at_epoch> exec_id`, then `ZRANGEBYSCORE due 0 now LIMIT 1000`. It is fast, but Redis durability is weak, so keep the DB as the truth and use Redis only as an index for the next 1 hour.
- **Delayed jobs** (like "reminder after 30 min") work the same way: `scheduled_at = now + delay`.
- **Cron:** when an execution completes (or is queued), compute the next run from the cron expression and insert a new execution row. Watch out for timezones and DST.

### 9.2 Workers: pull, lease, visibility timeout
- Workers **pull** (not push), so they take work based on their own capacity.
- Queue (SQS) visibility timeout = lease. Worker crash → message becomes visible again → another worker picks it up.
- Long jobs: the worker sends a **heartbeat** every 20 sec to extend the lease. Heartbeat stops → lease expires → reaper re-queues.
- **Zombie worker** (network partition, an old worker is still running): on complete, check `WHERE lease_owner = me AND attempt = n`. Fencing token = attempt number. The old worker's result is rejected.
- In a Postgres-only design, `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 10` also works instead of a queue.

### 9.3 At-least-once, idempotency, retries, DLQ
- On a crash/timeout a job can run again, so it is **at-least-once, not exactly-once**. Give every run its `exec_id` as an idempotency key. The job handler (like "send invoice") dedups with this key.
- On failure → `attempt++`, `scheduled_at = now + backoff` (exponential: 10s, 30s, 2m, 10m + jitter), status `SCHEDULED`.
- `attempt > max_retries` → `DEAD`, into the DLQ, alert the owner. A manual replay API from the DLQ.
- If the job crosses its `timeout_sec` → the worker kills it, treats it as failed and retries.

### 9.4 Scheduler HA and scale
- If two schedulers pick up the same bucket, we get duplicate enqueues. So use **leader election** (etcd/ZooKeeper lease). Leader dies → new leader in 5–10 sec, which catches up on missed buckets (`bucket <= now AND status SCHEDULED`).
- If a duplicate enqueue still happens: `UPDATE ... SET status='QUEUED' WHERE status='SCHEDULED'` lets only one win, and the worker claims it with `WHERE status='QUEUED'`.
- **Scale:** split executions into N shards (`hash(job_id) % N`). Each shard has its own leader (assigned to schedulers with consistent hashing). The midnight burst is spread across N schedulers.
- Midnight thundering herd: add a small random **jitter** (0–30 sec) to jobs that are not sensitive to the exact time.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Time-bucketed executions table** | Scans only a small bucket every second, durable | **`WHERE run_at <= now()` on the full table:** slow as the table grows. **Only an in-memory priority queue:** all jobs are lost on a crash |
| **Workers pull + lease** | Natural backpressure, auto recovery on crash | **Scheduler pushes to worker:** worker capacity is unknown, crash detection is hard |
| **At-least-once + idempotent jobs** | Practical and achievable | **Exactly-once:** cannot be guaranteed across crashes in a distributed system, 2PC is costly and slow |
| **Leader election (etcd/ZK)** | One active scheduler per shard, fewer duplicates | **All schedulers active without coordination:** duplicate enqueue on every bucket. **Single scheduler without failover:** SPOF |
| **Queue (Kafka/SQS) between scheduler and workers** | Absorbs bursts, visibility timeout built in | **Workers poll the DB directly:** polling by 1000 workers loads the DB, lock contention |
| **Exponential backoff + DLQ** | Gives the downstream time to recover, poison jobs kept apart | **Immediate retry loop:** more load on a failing downstream, a poison job blocks the queue |
| **Fencing token (attempt) on complete** | Rejects a zombie worker's old result | **Only lease TTL:** after a GC pause, the old worker writes the wrong status |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Scheduler leader crash | Due jobs are not going to the queue | New leader in 10 sec, catch-up scan of missed buckets |
| Worker crash mid-job | Job is incomplete | Lease expires, reaper re-queues, safe retry thanks to idempotency |
| Midnight burst | Queue lag, jobs late | Shards + more schedulers, worker autoscale on queue depth, jitter |
| DB slow | Scheduling stopped | Read replicas for history, partition by day, archive old data |
| Poison job | Crashes every time | max_retries → DLQ, owner alert |
| Clock skew | Job runs early/late | NTP, scheduling decisions only from the leader's clock / DB time |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Job dependencies (DAG)** like Airflow: job B runs only when A succeeds
- **Priority queues**: separate queues for critical jobs (payments) and batch jobs (reports)
- **Per-tenant rate limits** so one customer's 100K jobs do not starve everyone else
- **Archive execution history to S3** after 7 days, keeping the DB small
- **Observability:** p99 dashboard and alert for schedule lag (actual start - scheduled_at)

## Step 13: Likely follow-up questions

- "What if a job runs twice?" → accept at-least-once, the handler is idempotent on `exec_id` (Step 9.3)
- "A 1 hour job, and the worker died midway?" → heartbeat stopped, lease expired, re-run. Long jobs should checkpoint
- "The previous run of a cron job is still running and the next time has come?" → policy: skip, queue, or allow parallel. Keep it in the job config
- "How does leader election work?" → etcd lease / ZK ephemeral node, with fencing
- "A delayed job 30 days later?" → same table, a bucket 30 days ahead. In the DB, not Redis

## 2-minute recap (read this before the interview)

> Job definition and execution are separate. Each execution is a row: `scheduled_at`, `time_bucket`, status, lease. `UNIQUE(job_id, scheduled_at)` prevents duplicate runs. The scheduler leader (elected via etcd/ZK, one per shard) takes the due executions of the current bucket every second, marks them `QUEUED` with a conditional update and puts them into the ready queue. Workers pull, take a lease (visibility timeout), extend it with heartbeats, and the fencing token is checked on complete. On a crash the lease expires → the reaper re-queues. The guarantee is at-least-once, so handlers get `exec_id` as an idempotency key. On failure, exponential backoff + jitter, and DLQ after max retries. For cron, compute the next run and insert a new row. For the midnight burst: sharding, worker autoscaling and jitter.

## Checklist

- [ ] I can explain the job definition vs execution model
- [ ] I can tell how due jobs are found with a time-bucketed table
- [ ] I can explain crash recovery with lease, heartbeat and visibility timeout
- [ ] I can tell why at-least-once, and how idempotency works
- [ ] I can tell the flow of retries, backoff and DLQ
- [ ] I can explain scheduler leader election and the fencing token
- [ ] I can tell 3 trade-offs from the decision table without looking
