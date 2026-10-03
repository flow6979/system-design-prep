**Ek line:** Agent → Gateway → Kafka (shock absorber) → processors → Elasticsearch hot + S3 archive; storage cost design drive karta hai.

- **Requirements:** hazaron servers ke logs + metrics collect, search, alert; app pe zero impact.
- **Scale:** ~10 TB/day (~250K events/sec, peak 800K), ES ~25-30 TB/day disk, Kafka 72h ~20 TB, S3 compressed ~1 TB/day.
- **Components:** agent (local buffer), gateway (auth, quota), Kafka, processors (parse, mask, sample), ES, S3, TSDB, Jaeger.
- **Kafka buffer over agent → ES:** incident pe 5-10x volume absorb; 72h replay.
- **Elasticsearch over ClickHouse/Loki/Athena:** search in seconds; indexing cost.
- **Time-based indices + ILM, hot/warm/cold + S3:** 5-10x sasta; saal bhar ES me impossible.
- **Separate TSDB for metrics over ES:** compressed, fast aggregation; trace_id se jodo.
- **Level-based sampling over keep-all/random drop:** errors poore, info/debug kam.
- **Agent with local buffer over direct HTTP:** zero app latency impact.
- **Per-tenant quotas:** noisy neighbour; burst pe 429.
- **Senior signal:** worst time incident hai: 5-10x volume + search peak; error priority, dynamic sampling, ingest/search capacity alag.

**Interview me bolo:** "Storage cost design drive karta hai: hot SSD me recent, purana sasti disk, saal bhar S3 compressed. Kafka incident ka shock absorber hai."

**Galti mat karna:** Agent se seedha ES mat likho; high-cardinality tags aur mapping explosion ignore mat karo.
