**Ek line:** ~6 GB geohash index memory me replicated, Redis business-detail cache, ek Postgres, nightly index build S3 snapshot se.

- **Requirements:** "2 km me coffee shops", distance + rating se rank; business data kam badalta, search bahut.
- **Scale:** ~6K QPS avg (peak 20K), 200 GB business data, geo index ~6 GB, ~400K detail lookups/sec, ~12 review writes/sec.
- **Components:** search nodes (geohash in memory), Redis cache, Postgres (+ replicas), nightly Index Builder, S3, Rating cron.
- **Geohash over quadtree/plain lat-lng:** prefix query, center + 8 neighbours, haversine filter.
- **In-memory index + replicas over PostGIS/sharding:** < 10 ms, linear read scale; shard nahi.
- **Redis business cache over read replicas:** 400K lookups/sec.
- **Nightly build + S3 snapshot over CDC + Kafka:** freshness 24 hr chalega, ~1 update/sec.
- **Rating cron (10 min) over same-txn update:** row contention nahi; idempotent.
- **One Postgres over Cassandra:** 0.4 TB/year, joins; Elasticsearch tab jab free-text + geo.
- **Failure:** bad nightly index → canary node + rollback; dense cell → higher precision/quadtree split, top-K per cell.
- **Senior signal:** density skew (Mumbai cell) aur sab nodes pe ek saath bad snapshot rollout.

**Interview me bolo:** "Read-heavy 1000:1 hai, index sirf ~6 GB, isliye memory me replicate. Shard kuch nahi; sirf detail lookups ke liye cache."

**Galti mat karna:** Sirf ek geohash cell dekhna (neighbours bhoolna); unnecessary Kafka/sharding mat daalo.
