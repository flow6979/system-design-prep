**In one line:** Reliability = keep working when things fail (redundancy plus protective patterns); observability = quickly find what broke via metrics, logs and traces.

- **SPOF:** ask "what if this dies?" for every box. App = multiple instances, LB = pair/managed, DB = replica + failover, Redis = Sentinel/Cluster, Kafka = RF 3, multi-AZ.
- **Timeouts:** never wait forever (e.g. 500ms), or threads pile up.
- **Retries:** backoff + jitter, idempotent calls only.
- **Circuit breaker:** 50% failures in 10s → OPEN, test after 30s; serve a fallback (cache/default) while OPEN.
- **Bulkhead:** separate resource pools; **graceful degradation:** drop non-critical features, keep the core.
- **Load shedding:** rejecting ~10% (429/503) beats a full crash.
- **Backups:** replication is not a backup. Daily snapshot + WAL archive (PITR), another region, practice restores. RPO = data loss tolerated, RTO = recovery time.
- **Multi-AZ by default;** multi-region only for global users, 99.99%+ or compliance (active-passive is simple, active-active needs conflict handling).
- **3 pillars:** metrics (is something wrong?), logs (what happened?), traces (where is it slow?). RED = Rate, Errors, Duration; alert on symptoms.
- **SLI/SLO/SLA:** what you measure / internal target / customer contract. 99.9% ≈ 8.8 hrs/year, 99.99% ≈ 52 min.
- **"What if X fails?":** impact → detection → immediate fallback/failover → data loss.

**Say in the interview:** "Stateless services across multi-AZ, DB primary-replica with auto failover. Timeouts, backoff retries and a circuit breaker downstream; if recommendations die, degrade gracefully. RED metrics, tracing, SLO 99.9% with p99 < 300ms."

**Avoid:** Retries without backoff/jitter, or retrying non-idempotent calls. Treating replication as backup, or multi-region active-active for everything.
