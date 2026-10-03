**Ek line:** Columnar OLAP (ClickHouse, BigQuery) column-wise storage + compression + SIMD se bade scans fast karta hai; ye OLTP ki derived copy hai.

- **OLTP vs OLAP:** chhoti transactions vs bhaari aggregate scans; analytics primary pe mat chalao.
- **Read replica:** bhi row store hai, 50 crore row GROUP BY wahan bhi slow.
- **Row vs column:** column store ek column ka aggregate fast; cost ~ columns touched x rows scanned.
- **Fast kyun:** compression 5-20x, vectorized SIMD, sparse index se data skipping.
- **Ingest:** row-by-row INSERT nahi; batch 10k-100k ya Kafka se.
- **Star schema:** bada fact + chhote dimensions; pehle grain fix karo.
- **Rollups:** unique users hourly add nahi hote; HyperLogLog sketches store karo.
- **ClickHouse:** ORDER BY me common filter prefix, low-cardinality pehle; UPDATE heavy mutation, `ReplacingMergeTree` upsert.
- **BigQuery:** serverless, bytes scanned pe bill; `LIMIT` cost nahi ghatata, partitions aur columns ghatate hain.
- **Pinot/Druid:** user-facing sub-second live counters; analysts ke liye BigQuery/Snowflake.
- **Lakehouse + CDC:** S3 Parquet + Iceberg; OLTP se CDC (Debezium, Kafka), deletes bhi propagate karo.

**Interview me bolo:** "OLAP source of truth nahi, derived copy hai. CDC se Kafka se ClickHouse, raw events S3 pe replay ke liye, dashboard rollups padhe."

**Galti mat karna:** ClickHouse ko main app DB banana, `SELECT *` chalana, ya CDC me deletes ignore karna.
