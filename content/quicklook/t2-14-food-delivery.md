**Ek line:** Restaurant search (ES + geohash cache), city-sharded Postgres orders + outbox → Kafka, Redis GEO partner assignment, WebSocket tracking.

- **Requirements:** nearby restaurants, cart, pay, partner assign, live tracking.
- **Scale:** ~700 orders/sec peak, ~4K order events/sec, ~7K search QPS, ~1 lakh location writes/sec.
- **Components:** Elasticsearch + Redis cache, Order Service (Postgres by city), Kafka, Redis GEO, WebSocket, payment idempotency.
- **Elasticsearch geo over PostGIS:** text + geo + filters; cost: extra cluster, 1-2 min CDC lag.
- **Redis GEO over Postgres for location:** 1 lakh writes/sec; crash pe last 5 sec gayab.
- **Redis lock + DB conditional update over `SELECT FOR UPDATE`:** `SET NX PX 30s` = offer, `UPDATE WHERE partner_id IS NULL` = guarantee.
- **Kafka over outbox + SQS:** 3 consumers (assignment, notification, analytics) + replay.
- **Postgres by city over single DB/Cassandra:** ACID, order city ke andar; conditional `UPDATE WHERE status=?`.
- **Outbox over dual write:** DB write + event atomic.
- **Failure:** no partner accepts → radius/incentive, 10 min auto cancel + refund; webhook miss → reconciliation.
- **Senior signal:** peak pe partners kam, 30 sec sequential offers delay multiply; assignment lag metric, auto radius/incentive.

**Interview me bolo:** "Asli load location ka hai, 1 lakh/sec: Redis GEO me, sampled history S3 me. Orders city-sharded Postgres me, events outbox se Kafka."

**Galti mat karna:** Partner row ko 30 sec DB lock mat karo; payment webhook miss ka reconciliation bhoolna nahi.
