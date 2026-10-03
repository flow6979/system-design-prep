**Ek line:** Two-stage (retrieval ~500 candidates → ranking) + hybrid precompute/online; Kafka → Flink features in Redis, daily Spark training, popular fallback.

- **Requirements:** "aapke liye" list < 200 ms, fresh, cold start (naye users/items) pe bhi.
- **Scale:** ~115K events/sec (peak 300K), ~12K home QPS (peak 40K), 10M items, precomputed lists ~160 GB.
- **Components:** Kafka, Flink real-time features, S3 lake + Spark/GPU training, ANN index, Redis, feature store, ranking service.
- **Two-stage over single model:** heavy model sirf 500 pe, 10M pe nahi; cost retrieval miss.
- **Hybrid precompute + online over batch/real-time only:** speed + session freshness; do code paths.
- **Kafka over direct DB/SQS:** 300K/sec, 3 consumers, 7-day replay.
- **Flink over 15-min batch:** session ka asar < 1 min me.
- **Redis over Postgres/Cassandra:** < 5 ms, 40K QPS; RAM cost.
- **Feature store:** training = serving features, skew nahi.
- **Fallback + exploration slot:** popular items se page khaali nahi, naye items ko data.
- **Senior signal:** 40K QPS x 500 = 20M item-scorings/sec; candidates 300, 80 ms timeout → precomputed order, inactive users ka precompute band.

**Interview me bolo:** "Two-stage: sasta retrieval se 500 candidates, heavy ranking sirf un pe. Har stage pe timeout aur popular-items fallback."

**Galti mat karna:** 10M items pe model score mat chalao; cold start aur fallback bhoolna nahi.
