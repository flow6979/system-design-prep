**Ek line:** Time-series DB append-only, time-ordered data ko compress, rollup aur retention ke saath store karta hai; high cardinality isko maarti hai.

- **Data shape:** append-only, time range aggregates (avg, max, rate), almost no updates.
- **Model:** metric + tags (kaun) + field (value) + timestamp; same metric + tags = ek series.
- **Cardinality:** unique series count; `user_id`/`price` tag mat banao, Prometheus OOM hoga.
- **Compression:** delta-of-delta (Gorilla), 16 bytes se ~1.37 bytes/point; ~1.5 bytes/sample estimate me bolo.
- **Retention:** raw thoda rakho, 1-min/1-hour rollups lambe; purana S3 pe (Thanos/Mimir).
- **Rollup trap:** sirf average mat rakho; max/p99 baad me nahi milega.
- **Prometheus:** pull-based, scrape 15-60s; `sum(rate(x[5m]))`, `rate` pehle; `histogram_quantile`, `avg(p99)` nahi.
- **InfluxDB:** push-based, IoT/sensors (devices NAT ke peeche).
- **TimescaleDB:** Postgres extension, hypertable chunks; SQL + joins; query me time filter do.
- **ClickHouse:** per-event, high-cardinality analytics; exact billing counts Prometheus se nahi.
- **Chhota scale:** Postgres + `(entity_id, time)` index + time partitioning kaafi.

**Interview me bolo:** "Metrics + alerting Prometheus; business time-series with joins TimescaleDB; per-event high-cardinality ClickHouse."

**Galti mat karna:** High-cardinality label lagana, ya Prometheus me billing/business data daalna.
