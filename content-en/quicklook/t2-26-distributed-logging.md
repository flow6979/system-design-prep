**In one line:** Agent → Gateway → Kafka (shock absorber) → processors → Elasticsearch hot tier + S3 archive; storage cost drives the design.

- **Requirements:** collect, search and alert on logs + metrics from thousands of servers; zero impact on apps.
- **Scale:** ~10 TB/day (~250K events/sec, peak 800K), ES ~25-30 TB/day disk, Kafka 72h ~20 TB, S3 compressed ~1 TB/day.
- **Components:** agent (local buffer), gateway (auth, quota), Kafka, processors (parse, mask, sample), ES, S3, TSDB, Jaeger.
- **Kafka buffer over agent → ES:** absorbs 5-10x incident volume; 72h replay.
- **Elasticsearch over ClickHouse/Loki/Athena:** search in seconds; cost is indexing.
- **Time-based indices + ILM, hot/warm/cold + S3:** 5-10x cheaper; a year in ES is impossible.
- **Separate TSDB for metrics over ES:** compressed, fast aggregation; link via trace_id.
- **Level-based sampling over keep-all/random drop:** keep all errors, sample info/debug.
- **Agent with local buffer over direct HTTP:** no app latency impact.
- **Per-tenant quotas:** stop noisy neighbours; 429 on bursts.
- **Senior signal:** the worst time is an incident: 5-10x volume while search peaks; error priority, dynamic sampling, separate ingest/search capacity.

**Say in the interview:** "Storage cost drives the design: recent logs on hot SSD, older on cheaper disk, a year in compressed S3. Kafka is the shock absorber for incidents."

**Avoid:** Writing from agents straight into ES; ignoring high-cardinality tags and mapping explosion.
