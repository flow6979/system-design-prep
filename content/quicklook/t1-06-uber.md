**Ek line:** Driver locations Redis GEO (geohash) me, matching GEOSEARCH + Redis lock se ek driver ek ride, rides Postgres state machine me.

- **Requirements:** nearby driver match, live tracking ride ke dauraan, ek driver ko ek hi ride.
- **Scale:** 1M drivers x har 4 sec = ~250K location writes/sec; rides ~120/sec avg, ~1K peak.
- **Components:** Location service + Redis GEO (city shards), Matching, Postgres rides, Kafka, WebSocket gateway, Maps ETA.
- **Redis GEO over PostGIS:** 250K writes/sec in-memory; sirf latest location, history S3 me.
- **Geohash/H3 over scan/quadtree:** prefix match, easy sharding; 8 neighbour cells bhi dekho.
- **Redis lock (`SET NX PX 15s`) over `SELECT FOR UPDATE`:** crash pe auto-release, DB conditional update backup.
- **Postgres over Cassandra for rides:** state machine ke conditional transitions, ~1K writes/sec.
- **WebSocket + Kafka:** offers/tracking push < 2 sec; 3 consumer groups, replay.
- **Failure:** stale driver (`lastSeen` > 30 sec) hatao; double tap → Idempotency-Key + UNIQUE.
- **Senior signal:** hot city/stadium cell hotspot; cells chhote karo, surge lagao, lock loss DB se cover.

**Interview me bolo:** "Asli load location updates hain, booking nahi. Location in-memory geo index me, rides SQL me, aur lock + DB conditional update se ek driver ek ride."

**Galti mat karna:** Location Postgres me mat daalo; matching me neighbour cells bhoolna nahi.
