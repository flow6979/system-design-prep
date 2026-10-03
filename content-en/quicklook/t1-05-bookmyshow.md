**In one line:** Prevent double booking with a Redis hold (TTL) plus a Postgres UNIQUE constraint, and use a virtual queue for launch spikes.

- **Requirements:** search shows, pick seats, pay, get ticket; a seat must never sell twice.
- **Scale:** ~1,200 read QPS (peak 12K), ~12 bookings/sec; the real problem is 100K users on one show in one minute.
- **Components:** Show Service (replica + Redis cache), Booking Service, Redis holds, Postgres, outbox worker, virtual queue.
- **Redis TTL hold over DB lock:** `SET NX PX 10min` auto-releases; a DB `held_until` column causes row contention.
- **Postgres over Cassandra:** ACID + `UNIQUE(show_id, seat_id)`; ~12 writes/sec fits one primary.
- **No pessimistic lock:** holding `SELECT FOR UPDATE` for 10 minutes exhausts connections.
- **Postgres + pg_trgm + cache over Elasticsearch:** small catalog, no CDC or extra cluster needed.
- **Outbox + worker over Kafka:** ~12/sec, atomic with the booking, a single consumer.
- **Failure:** Redis down → DB constraint still protects; missed webhook → reconciliation job every 5 min.
- **Senior signal:** hold TTL vs slow payment race; keep payment window < hold TTL and auto-refund.

**Say in the interview:** "The problem is contention on a seat and spikes, not throughput. A Redis hold soft-locks, the Postgres unique constraint confirms, and a virtual queue absorbs peaks."

**Avoid:** Treating the Redis hold as the source of truth; forgetting the hold-TTL vs payment race.
