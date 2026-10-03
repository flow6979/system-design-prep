**In one line:** A time-series DB stores append-only, time-ordered data with compression, rollups, and retention; high cardinality is what kills it.

- **Data shape:** append-only, time-range aggregates (avg, max, rate), almost no updates.
- **Model:** metric + tags (who) + field (value) + timestamp; same metric + tags = one series.
- **Cardinality:** number of unique series; don't make `user_id`/`price` a tag or Prometheus goes OOM.
- **Compression:** delta-of-delta (Gorilla), 16 bytes down to ~1.37 bytes/point; use ~1.5 bytes/sample in estimates.
- **Retention:** keep raw short, 1-min/1-hour rollups longer; old data on S3 (Thanos/Mimir).
- **Rollup trap:** don't store only the average; max/p99 can't be recovered later.
- **Prometheus:** pull-based, scrape every 15-60s; `sum(rate(x[5m]))`, `rate` first; `histogram_quantile`, never `avg(p99)`.
- **InfluxDB:** push-based, IoT/sensors (devices behind NAT).
- **TimescaleDB:** Postgres extension, hypertable chunks; SQL + joins; always filter on time.
- **ClickHouse:** per-event, high-cardinality analytics; exact billing counts don't belong in Prometheus.
- **Small scale:** Postgres + `(entity_id, time)` index + time partitioning is enough.

**Say in the interview:** "Metrics and alerting: Prometheus; business time-series with joins: TimescaleDB; per-event high-cardinality: ClickHouse."

**Avoid:** Using a high-cardinality label, or putting billing/business data in Prometheus.
