**In one line:** Driver locations in Redis GEO (geohash), matching via GEOSEARCH plus a Redis lock so one driver gets one ride, rides stored as a Postgres state machine.

- **Requirements:** match nearby drivers, live tracking during the ride, one driver per ride.
- **Scale:** 1M drivers x every 4 sec = ~250K location writes/sec; rides ~120/sec avg, ~1K peak.
- **Components:** Location service + Redis GEO (city shards), Matching, Postgres rides, Kafka, WebSocket gateway, Maps ETA.
- **Redis GEO over PostGIS:** 250K in-memory writes/sec; keep only the latest location, history goes to S3.
- **Geohash/H3 over scan/quadtree:** prefix match and easy sharding; also check the 8 neighbour cells.
- **Redis lock (`SET NX PX 15s`) over `SELECT FOR UPDATE`:** auto-release on crash, DB conditional update as backup.
- **Postgres over Cassandra for rides:** conditional state transitions, ~1K writes/sec.
- **WebSocket + Kafka:** offers/tracking pushed in < 2 sec; 3 consumer groups, replay.
- **Failure:** drop stale drivers (`lastSeen` > 30 sec); double tap → Idempotency-Key + UNIQUE.
- **Senior signal:** hot city/stadium cells; split cells, apply surge, cover lock loss with the DB update.

**Say in the interview:** "The real load is location updates, not bookings. Locations live in an in-memory geo index, rides in SQL, and lock plus DB conditional update guarantees one driver per ride."

**Avoid:** Writing locations to Postgres; forgetting neighbour cells in matching.
