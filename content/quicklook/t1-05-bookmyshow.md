**Ek line:** Seat double-booking rokne ke liye Redis hold (TTL) + Postgres UNIQUE constraint; launch spike pe virtual queue.

- **Requirements:** movie/show search, seat chuno, payment, ticket; ek seat do logon ko kabhi nahi.
- **Scale:** ~1,200 read QPS (peak 12K), ~12 bookings/sec; asli problem = 1 lakh users, ek show, ek minute.
- **Components:** Show Service (replica + Redis cache), Booking Service, Redis holds, Postgres, outbox worker, virtual queue.
- **Redis TTL hold over DB lock:** `SET NX PX 10min`, auto-release; DB `held_until` pe contention.
- **Postgres over Cassandra:** ACID + `UNIQUE(show_id, seat_id)`; ~12 writes/sec ek primary kaafi.
- **No pessimistic lock:** 10 min `SELECT FOR UPDATE` connections khatam kar dega.
- **Postgres + pg_trgm + cache over Elasticsearch:** chhota catalog, CDC + extra cluster ki zaroorat nahi.
- **Outbox + worker over Kafka:** ~12/sec, booking ke saath atomic, ek consumer.
- **Failure:** Redis down → DB constraint safe; webhook miss → reconciliation job har 5 min.
- **Senior signal:** hold TTL vs slow payment race; payment window < hold TTL + auto refund.

**Interview me bolo:** "Problem throughput nahi, ek seat pe contention aur spike hai. Redis hold se soft-lock, confirm Postgres unique constraint se, peak pe virtual queue."

**Galti mat karna:** Redis hold ko hi source of truth mat banao; payment aur hold TTL ka race bhoolna nahi.
