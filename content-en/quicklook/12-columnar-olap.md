**In one line:** Columnar OLAP (ClickHouse, BigQuery) uses column storage + compression + SIMD for fast big scans; it is a derived copy of OLTP data.

- **OLTP vs OLAP:** small transactions vs heavy aggregate scans; don't run analytics on the primary.
- **Read replica:** still a row store, a 500M-row GROUP BY is slow there too.
- **Row vs column:** column store makes single-column aggregates fast; cost ~ columns touched x rows scanned.
- **Why fast:** 5-20x compression, vectorized SIMD, data skipping via a sparse index.
- **Ingest:** no row-by-row INSERT; batch 10k-100k rows or ingest from Kafka.
- **Star schema:** big fact table + small dimensions; fix the grain first.
- **Rollups:** hourly unique users can't be summed; store HyperLogLog sketches.
- **ClickHouse:** common filter as ORDER BY prefix, low-cardinality first; UPDATE is a heavy mutation, use `ReplacingMergeTree` for upserts.
- **BigQuery:** serverless, billed by bytes scanned; `LIMIT` doesn't cut cost, partitions and columns do.
- **Pinot/Druid:** user-facing sub-second live counters; BigQuery/Snowflake for analysts.
- **Lakehouse + CDC:** S3 Parquet + Iceberg; CDC from OLTP (Debezium, Kafka), propagate deletes too.

**Say in the interview:** "OLAP is a derived copy, not the source of truth. CDC to Kafka to ClickHouse, raw events on S3 for replay, and dashboards read rollups."

**Avoid:** Using ClickHouse as the main app DB, running `SELECT *`, or ignoring deletes in the CDC pipeline.
