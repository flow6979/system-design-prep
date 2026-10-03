**Ek line:** Reliability = fail hone par bhi chalte rehna (redundancy + bachav patterns); observability = metrics, logs, traces se jaldi pata lagana kya toota.

- **SPOF:** har box pe "ye mara to?" App = multiple instances, LB = pair/managed, DB = replica + failover, Redis = Sentinel/Cluster, Kafka = RF 3, multi-AZ.
- **Timeouts:** forever wait nahi (e.g. 500ms), warna threads phans jaate hain.
- **Retries:** backoff + jitter, sirf idempotent calls.
- **Circuit breaker:** 50% fail in 10s → OPEN, 30s baad test; OPEN me fallback (cache/default).
- **Bulkhead:** alag resource pools; **graceful degradation:** non-critical band, core chalu.
- **Load shedding:** overload pe ~10% reject (429/503) poore crash se achha.
- **Backup:** replication backup nahi. Daily snapshot + WAL archive (PITR), doosra region, restore practice. RPO = data loss, RTO = recovery time.
- **Multi-AZ default;** multi-region sirf global users/99.99%+/compliance (active-passive simple, active-active conflicts).
- **3 pillars:** metrics (kuch galat?), logs (kya hua?), traces (kahan slow?). RED = Rate, Errors, Duration; alert symptom pe.
- **SLI/SLO/SLA:** measure / internal target / contract. 99.9% ≈ 8.8 ghante/saal, 99.99% ≈ 52 min.
- **"X fail to?":** impact → detect → turant fallback/failover → data loss.

**Interview me bolo:** "Stateless services multi-AZ, DB primary-replica auto failover. Downstream pe timeout, backoff retries, circuit breaker; recommendation down to graceful degradation. RED metrics, tracing, SLO 99.9% p99 < 300ms."

**Galti mat karna:** Retries bina backoff/jitter, ya non-idempotent call retry. Replication ko backup samajhna, har cheez multi-region active-active.
