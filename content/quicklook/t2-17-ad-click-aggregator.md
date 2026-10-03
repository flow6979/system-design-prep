**Ek line:** Signed click → Kafka (acks=all) → 302; Flink 1-min event-time windows → OLAP, plus Spark reconciliation, kyunki counts billing me jaate hain.

- **Requirements:** har click capture + redirect, per-ad per-minute counts; galat count = galat paisa.
- **Scale:** ~12K QPS avg, 50K peak, ~200 GB/day raw, ~100M aggregate rows/day.
- **Components:** Click Service (HMAC `click_id`), Kafka by `ad_id`, Flink, ClickHouse/Druid/Pinot, S3 raw, Spark recon.
- **Kafka over direct DB/SQS:** hot rows avoid; 2 consumers + 7-day replay.
- **Flink over ClickHouse MVs/Spark micro-batch:** event-time windows, watermarks, late events.
- **Tumbling 1 min over sliding:** simple; event ek hi window me.
- **OLAP over Postgres/Cassandra:** group by < 1 sec on ~100M rows/day.
- **Spark reconciliation over Kappa only:** raw se exact truth; stream bug se billing galat na ho.
- **`click_id` + HMAC over IP dedup:** NAT ke peeche asli clicks drop nahi; fake URLs bhi rukte.
- **Failure:** Kafka down → local disk buffer, redirect phir bhi; hot ad → salted keys + two-stage.
- **Senior signal:** Kafka ack redirect ke critical path pe; stream vs batch drift ka alert metric.

**Interview me bolo:** "Counts billing me jaate hain, isliye stream aur batch dono: Flink real-time, Spark raw se reconcile. Per-ad per-minute pre-aggregation se 50K writes ~1K rows/sec ho jaate hain."

**Galti mat karna:** Har click pe `count+1` mat batao (hot rows); dedup ke bina billing mat karo.
