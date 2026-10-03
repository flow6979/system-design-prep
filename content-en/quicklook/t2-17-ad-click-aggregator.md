**In one line:** Signed click → Kafka (acks=all) → 302; Flink 1-min event-time windows → OLAP, plus Spark reconciliation, because counts feed billing.

- **Requirements:** capture every click and redirect, per-ad per-minute counts; a wrong count means wrong money.
- **Scale:** ~12K QPS avg, 50K peak, ~200 GB/day raw, ~100M aggregate rows/day.
- **Components:** Click Service (HMAC `click_id`), Kafka by `ad_id`, Flink, ClickHouse/Druid/Pinot, S3 raw, Spark recon.
- **Kafka over direct DB/SQS:** avoids hot rows; 2 consumers + 7-day replay.
- **Flink over ClickHouse MVs/Spark micro-batch:** event-time windows, watermarks, late events.
- **Tumbling 1 min over sliding:** simple; each event lands in one window.
- **OLAP over Postgres/Cassandra:** group by < 1 sec on ~100M rows/day.
- **Spark reconciliation over Kappa only:** exact truth from raw; a stream bug cannot silently corrupt billing.
- **`click_id` + HMAC over IP dedup:** real clicks behind NAT are not dropped; fake URLs rejected.
- **Failure:** Kafka down → local disk buffer, still redirect; hot ad → salted keys + two-stage aggregation.
- **Senior signal:** the Kafka ack is on the redirect critical path; alert on stream vs batch drift.

**Say in the interview:** "Counts go into billing, so I run both stream and batch: Flink for real-time, Spark to reconcile from raw. Per-ad per-minute pre-aggregation turns 50K writes/sec into ~1K rows/sec."

**Avoid:** `count+1` per click (hot rows); billing without dedup.
