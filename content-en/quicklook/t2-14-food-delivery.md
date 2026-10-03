**In one line:** Restaurant search via ES + geohash cache, city-sharded Postgres orders with outbox → Kafka, Redis GEO partner assignment, WebSocket tracking.

- **Requirements:** nearby restaurants, cart, pay, partner assignment, live tracking.
- **Scale:** ~700 orders/sec peak, ~4K order events/sec, ~7K search QPS, ~100K location writes/sec.
- **Components:** Elasticsearch + Redis cache, Order Service (Postgres by city), Kafka, Redis GEO, WebSocket, payment idempotency.
- **Elasticsearch geo over PostGIS:** text + geo + filters; cost is an extra cluster and 1-2 min CDC lag.
- **Redis GEO over Postgres for location:** 100K writes/sec; a crash loses the last 5 sec.
- **Redis lock + DB conditional update over `SELECT FOR UPDATE`:** `SET NX PX 30s` is the offer, `UPDATE WHERE partner_id IS NULL` is the guarantee.
- **Kafka over outbox + SQS:** 3 consumers (assignment, notification, analytics) + replay.
- **Postgres by city over single DB/Cassandra:** ACID within a city; conditional `UPDATE WHERE status=?`.
- **Outbox over dual write:** DB write and event are atomic.
- **Failure:** no partner accepts → widen radius/incentive, auto cancel + refund at 10 min; missed webhook → reconciliation.
- **Senior signal:** at peak partners are scarce and sequential 30 sec offers multiply delay; track assignment lag, auto-adjust radius/incentive.

**Say in the interview:** "The real load is location at ~100K/sec, held in Redis GEO with sampled history in S3. Orders live in city-sharded Postgres, events go out via outbox to Kafka."

**Avoid:** Row-locking a partner for 30 seconds in the DB; skipping payment reconciliation.
