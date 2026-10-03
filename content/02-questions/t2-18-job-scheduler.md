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

**Ek line me:** users jobs register karte hain (ek baar, delayed, ya cron jaise "har din 2 baje"), aur system unhe sahi time pe workers pe chalata hai, retries ke saath, bina miss kiye aur bina do baar chalaye (jitna possible ho).

**Is question me interviewer kya check karta hai:** due jobs ko efficiently kaise dhoondhoge, workers crash ho to job kaise recover hogi (leases), at-least-once + idempotency, retries/DLQ, aur scheduler khud single point of failure na bane.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Job types: one-time, delayed, recurring cron?" | Teeno | Recurring ke liye next_run compute karke naya execution |
| "Job khud kya hai? Code ya HTTP call?" | Container image / handler name + payload | Worker generic executor hai |
| "Time precision?" | ~1 sec delay chalega | Second-level buckets, ms nahi |
| "Exactly-once chahiye?" | At-least-once + idempotent jobs OK | Leases + retries, job idempotency key |
| "Scale?" | 10M jobs/day, peak 10K jobs/sec (midnight cron) | Time-bucketed partitioned table, scheduler sharding |
| "Job kitni lambi chalti hai?" | Seconds se 1 hour tak | Lease heartbeat chahiye |

> **Bolo:** "Main job definition aur job execution ko alag rakhunga. Scheduler sirf due executions ko queue me daalega, aur workers pull karke lease ke saath chalayenge. Guarantee at-least-once hogi, isliye jobs idempotent honi chahiye."

## Step 2: Requirements

**Functional**
1. Users should be able to job create/update/delete kar sakein: one-time, delayed (`run_at`), cron (`0 2 * * *`)
2. Users should be able to bharosa kar sakein ki job due time pe payload ke saath chalegi
3. Users should be able to fail hone pe automatic retry (backoff) aur max retries ke baad DLQ paa sakein
4. Users should be able to job status aur execution history dekh sakein

**Out of scope:** job DAG/dependencies, job ka code build/deploy, multi-region active-active.

**Non-functional (priority order me)**
1. **Reliability:** koi due job miss nahi (durable), at-least-once, duplicates rare
2. **Timeliness:** due time se p99 < 2 sec me start
3. **HA:** 99.99%, scheduler ya worker crash pe system chalta rahe
4. **Scale:** 10M executions/day, midnight pe 10K/sec burst

**CAP choice:** scheduling state pe consistency: partition me scheduler ruk jaaye (job thodi late) chalega, par do schedulers ek bucket na uthayein. Isliye leader lease strongly consistent store me.

## Step 3: Estimation (sirf jo design badle)

- 10M/day ≈ **120/sec avg**, par cron jobs round times pe (00:00, har ghante) → **10K/sec peak**. Burst design karna hai, average nahi.
- Job record ~1 KB → 10M executions/day ≈ 10 GB/day history. 30 din retain → 300 GB, partition by day.
- Due jobs query har second: `WHERE run_at <= now()` full table pe slow, isliye time-bucket index.

> **Bolo:** "Average load kuch nahi hai. Problem midnight burst aur ye guarantee hai ki crash pe job miss na ho aur do baar na chale."

## Step 4: Core entities

- **Job** (definition): job_id, owner, type (`ONCE`, `CRON`), cron_expr, handler, payload, max_retries, timeout
- **Execution** (har run): exec_id, job_id, scheduled_at, status (`SCHEDULED`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `DEAD`), attempt, lease_owner, lease_expires_at
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

**Simple v1 pehle:** Job API + ek Postgres + workers jo seedha `SELECT ... WHERE scheduled_at <= now() FOR UPDATE SKIP LOCKED LIMIT 10` poll karein. Hazaar jobs/min tak ye poora kaam karta hai. Numbers isko todte hain: midnight pe 10K/sec burst aur ~1000 workers ka DB polling (→ scheduler + SQS ready queue), aur 40K status writes/sec peak (→ Postgres shards, har shard ka ek scheduler leader).

```mermaid
flowchart LR
  C["Client / Service"] --> API["Job API"]
  API --> DB[("Postgres sharded jobs + executions")]
  SC["Scheduler leader per shard"] -- "lease row" --> DB
  SC --> Q[["SQS ready queue"]]
  Q --> W1["Worker pool"]
  W1 --> DB
  Q --> DLQ[["SQS dead letter queue"]]
  W1 --> M["Metrics + Alerts"]
  RP["Lease reaper"] --> DB
```

**Har component kyun:** (FR1/FR4 → Job API + Postgres, FR2 → Scheduler + SQS + Workers, FR3 → backoff rows + DLQ)
- **Postgres sharded by `hash(job_id)`:** conditional updates (status, fencing) aur `UNIQUE` chahiye. ~4 writes per execution × 10K/sec = 40K writes/sec peak, kuch shards kaafi. Cassandra me ye LWT se slow hota.
- **Scheduler leader per shard:** har second current bucket ke due rows `QUEUED` karke SQS me. Leader **DB lease row** se (`UPDATE shard_leases SET owner=me, expires=now()+10s WHERE expires < now()`); alag etcd/ZooKeeper cluster nahi chahiye kyunki strongly consistent Postgres pehle se hai.
- **SQS ready queue (Kafka nahi):** ye task distribution hai: per-message visibility timeout (= lease), retries, DLQ built-in. Kafka me per-message ack nahi, aur replay/multiple consumers ki zarurat nahi.
- **Workers:** pull, lease lo, chalao, heartbeat, complete. Pull = natural backpressure.
- **Lease reaper:** DB me `RUNNING` rows jinki lease expire ho gayi, unhe wapas `SCHEDULED`.
- **DLQ:** SQS redrive policy, max retries ke baad manual inspection.

## Step 7: Main flow: due job se completion tak

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

- `time_bucket` = `scheduled_at` ko minute/second me round. Scheduler sirf current bucket padhta hai, poori table nahi.
- `UNIQUE(job_id, scheduled_at)`: same cron run do baar create nahi ho sakta, chahe do schedulers galti se chal jaayein.
- **Postgres, `hash(job_id) % N` se sharded:** conditional updates aur `UNIQUE` isi pe natural. Cassandra `(shard_id, time_bucket)` tab socho jab writes lakhs/sec ho jaayein (Airbnb/Uber scale); 40K/sec pe zarurat nahi.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 Due jobs kaise dhoondhoge?
**NFR:** timeliness, due time se < 2 sec.
- **Time-bucketed table:** partition key `(shard, minute_bucket)`. Scheduler har second current bucket query kare. Index scan chhota, poori table kabhi nahi.
- **Alternative: Redis ZSET** `ZADD due <run_at_epoch> exec_id`, phir `ZRANGEBYSCORE due 0 now LIMIT 1000`. Fast hai, par Redis durability kamzor, isliye DB truth rakho aur Redis sirf next 1 hour ka index.
- **Delayed jobs** (jaise "30 min baad reminder") bhi same: `scheduled_at = now + delay`.
- **Cron:** execution complete (ya queue) hone pe next run cron expression se compute karke naya execution row insert. Timezone aur DST ka dhyaan.
- **Trade-off:** second-level polling DB pe constant load deta hai; bucket chhota rakhna padta hai, ms precision nahi milti.

### 9.2 Workers: pull, lease, visibility timeout
**NFR:** reliability, worker crash pe job miss nahi.
- Workers **pull** karte hain (push nahi), taaki apni capacity ke hisaab se lein.
- Queue (SQS) visibility timeout = lease. Worker crash → message wapas visible → doosra worker uthayega.
- Lambi jobs: worker har 20 sec **heartbeat** karke lease badhaye. Heartbeat ruka → lease expire → reaper re-queue.
- **Zombie worker** (network partition, purana worker abhi bhi chal raha): complete karte waqt `WHERE lease_owner = me AND attempt = n` check. Fencing token = attempt number. Purana worker ka result reject.
- Postgres-only design (v1) me queue ki jagah `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 10` bhi chalta hai.
- **Trade-off:** lease chhoti = crash jaldi detect par heartbeat traffic zyada; lambi = kam traffic par recovery slow.

### 9.3 At-least-once, idempotency, retries, DLQ
**NFR:** at-least-once, duplicates rare aur harmless.
- Crash/timeout pe job dobara chal sakti hai, isliye **exactly-once nahi, at-least-once**. Har run ko `exec_id` idempotency key ke roop me do. Job handler (jaise "send invoice") is key se dedup kare.
- Fail → `attempt++`, `scheduled_at = now + backoff` (exponential: 10s, 30s, 2m, 10m + jitter), status `SCHEDULED`.
- `attempt > max_retries` → `DEAD`, DLQ me, owner ko alert. DLQ se manual replay API.
- Job ka `timeout_sec` cross → worker kill kare, failed maan ke retry.
- **Trade-off:** idempotency ka bojh job likhne wale pe aata hai; badle me system simple rehta hai (2PC nahi).

### 9.4 Scheduler HA aur scale
**NFR:** HA, scheduler SPOF na ho, midnight burst sambhle.
- Do schedulers same bucket uthayein to duplicate enqueue. Isliye **leader election** per shard, Postgres lease row se (lease 10 sec, leader har 3 sec renew). Leader mara → ~10 sec me naya leader, missed bucket catch-up kare (`bucket <= now AND status SCHEDULED`). Shards bahut ho jaayein ya DB failover slow ho to etcd/ZooKeeper lease pe shift karo.
- Duplicate enqueue phir bhi ho jaaye to: `UPDATE ... SET status='QUEUED' WHERE status='SCHEDULED'` sirf ek jeetega, aur worker `WHERE status='QUEUED'` se claim karega.
- **Scale:** executions ko N shards me baanto (`hash(job_id) % N`). Har shard ka alag leader (consistent hashing se schedulers me assign). Midnight burst N schedulers me bant jaata hai.
- Midnight thundering herd: small random **jitter** (0–30 sec) un jobs pe jo exact time sensitive nahi.
- **Trade-off:** leader failover ke ~10 sec me us shard ke jobs late; consistency ke liye thodi availability chhodi.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Time-bucketed executions table (sharded Postgres)** | Har second sirf chhota bucket scan, durable, conditional updates | **Full table scan:** slow. **In-memory priority queue:** crash pe sab gaya. **Cassandra:** LWT slow. Sacrifice: sharding ops, cross-shard queries mushkil |
| **Workers pull + lease** | Backpressure natural, crash pe auto recovery | **Scheduler push to worker:** worker capacity pata nahi, crash detection mushkil |
| **At-least-once + idempotent jobs** | Practical aur achievable | **Exactly-once:** distributed system me crash ke beech guarantee nahi kar sakte, 2PC mehnga aur slow |
| **Leader election via Postgres lease row** | Ek active scheduler per shard, koi naya cluster nahi | **etcd/ZooKeeper:** zyada robust par ek aur cluster chalana. **Bina coordination:** duplicate enqueue. Sacrifice: failover ~10 sec, DB failover pe leader bhi atakta hai |
| **SQS between scheduler aur workers** | Burst absorb, visibility timeout, retries, DLQ built-in | **Kafka:** per-message ack/visibility nahi, replay ki zarurat nahi. **Workers seedha DB poll:** 1000 workers = DB load, lock contention. Sacrifice: SQS ordering nahi, ek extra hop |
| **Exponential backoff + DLQ** | Downstream ko saans lene ka time, poison jobs alag | **Immediate retry loop:** failing downstream pe aur load, poison job queue block kare |
| **Fencing token (attempt) on complete** | Zombie worker ka purana result reject | **Sirf lease TTL:** GC pause ke baad purana worker galat status likh dega |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Scheduler leader crash | Due jobs queue me nahi ja rahe | Naya leader 10 sec me, missed buckets catch-up scan |
| Worker crash mid-job | Job adhoori | Lease expire, reaper re-queue, idempotency se safe retry |
| Midnight burst | Queue lag, jobs late | Shards + more schedulers, worker autoscale on queue depth, jitter |
| DB slow | Scheduling ruk gayi | Read replicas for history, partition by day, purana data archive |
| Poison job | Har baar crash | max_retries → DLQ, owner alert |
| Clock skew | Job jaldi/late | NTP, scheduling decision sirf leader ke clock / DB time se |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Job dependencies (DAG)** jaise Airflow: job B tabhi chale jab A succeed ho
- **Priority queues**: critical jobs (payments) aur batch jobs (reports) alag queues
- **Per-tenant rate limits** taaki ek customer ke 1 lakh jobs baaki sab ko starve na karein
- **Observability:** schedule lag (actual start - scheduled_at) ka p99 dashboard aur alert

## Step 13: Interviewer ke likely follow-up sawal

- "Job do baar chal gayi to?" → at-least-once accept, handler `exec_id` se idempotent (Step 9.3)
- "1 hour ki job, worker beech me mar gaya?" → heartbeat ruka, lease expire, re-run. Lambi jobs checkpoint karein
- "Cron job ka previous run abhi chal raha hai aur next time aa gaya?" → policy: skip, queue, ya parallel allow. Job config me rakho
- "Leader election kaise?" → Postgres lease row (ya bade setup me etcd lease / ZK ephemeral node), fencing ke saath
- "Delayed job 30 din baad?" → same table, bucket 30 din baad ka. Redis me nahi, DB me
- **Senior signal:** khud bolo: asli risk midnight burst pe **schedule lag** hai. Isko p99 metric banao, workers queue depth pe autoscale, non-critical jobs pe jitter, aur Postgres primary failover ko leader lease timing se align karo.

## 2-minute recap (interview se pehle ye padho)

> Job definition aur execution alag. Har execution ek row: `scheduled_at`, `time_bucket`, status, lease. `UNIQUE(job_id, scheduled_at)` duplicate runs rokta hai. Data sharded Postgres me (conditional updates). Scheduler leader (Postgres lease row se elected, har shard ka ek) har second current bucket ke due executions ko conditional update se `QUEUED` karke SQS ready queue me daalta hai (task distribution hai, isliye Kafka nahi). Workers pull karte hain, lease lete hain (visibility timeout), heartbeat se badhate hain, aur complete pe fencing token check hota hai. Crash pe lease expire → reaper re-queue. Guarantee at-least-once, isliye `exec_id` idempotency key handlers ko. Fail pe exponential backoff + jitter, max retries ke baad DLQ. Cron ke liye next run compute karke naya row. Midnight burst ke liye sharding, worker autoscale aur jitter.

## Checklist

- [ ] Job definition vs execution model samjha sakta hoon
- [ ] Time-bucketed table se due jobs kaise milte hain bata sakta hoon
- [ ] Lease, heartbeat aur visibility timeout se crash recovery explain kar sakta hoon
- [ ] At-least-once kyun aur idempotency kaise bata sakta hoon
- [ ] Retries, backoff aur DLQ ka flow bata sakta hoon
- [ ] Scheduler leader election aur fencing token samjha sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
