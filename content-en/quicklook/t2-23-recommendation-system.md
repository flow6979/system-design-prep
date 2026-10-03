**In one line:** Two-stage (retrieval ~500 candidates → ranking) with hybrid precompute/online serving; Kafka → Flink features in Redis, daily Spark training, popular-items fallback.

- **Requirements:** "for you" list in < 200 ms, fresh, and working for new users/items (cold start).
- **Scale:** ~115K events/sec (peak 300K), ~12K home QPS (peak 40K), 10M items, precomputed lists ~160 GB.
- **Components:** Kafka, Flink real-time features, S3 lake + Spark/GPU training, ANN index, Redis, feature store, ranking service.
- **Two-stage over a single model:** the heavy model scores 500, not 10M; cost is retrieval misses.
- **Hybrid precompute + online over batch-only/real-time-only:** speed plus session freshness; two code paths.
- **Kafka over direct DB/SQS:** 300K/sec, 3 consumers, 7-day replay.
- **Flink over 15-min batch:** session behavior reflected within a minute.
- **Redis over Postgres/Cassandra:** < 5 ms at 40K QPS; costs RAM.
- **Feature store:** training and serving use the same features, no skew.
- **Fallback + exploration slot:** popular items so the page is never empty, and new items get data.
- **Senior signal:** 40K QPS x 500 = 20M item-scorings/sec; cut to 300 candidates, 80 ms timeout → precomputed order, stop precompute for inactive users.

**Say in the interview:** "Two-stage: cheap retrieval gives ~500 candidates, heavy ranking runs only on those. Every stage has a timeout and a popular-items fallback."

**Avoid:** Scoring all 10M items per request; forgetting cold start and fallback.
