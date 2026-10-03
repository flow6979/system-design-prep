**In one line:** A ~6 GB geohash index held in memory and replicated, a Redis business-detail cache, a single Postgres, and nightly index builds shipped via S3 snapshots.

- **Requirements:** "coffee shops within 2 km", ranked by distance + rating; business data rarely changes, search is constant.
- **Scale:** ~6K QPS avg (peak 20K), 200 GB business data, geo index ~6 GB, ~400K detail lookups/sec, ~12 review writes/sec.
- **Components:** search nodes (geohash in memory), Redis cache, Postgres (+ replicas), nightly Index Builder, S3, Rating cron.
- **Geohash over quadtree/plain lat-lng:** prefix query, center + 8 neighbours, haversine filter.
- **In-memory index + replicas over PostGIS/sharding:** < 10 ms, linear read scale; no sharding needed.
- **Redis business cache over read replicas:** handles 400K lookups/sec.
- **Nightly build + S3 snapshot over CDC + Kafka:** 24 hr freshness is fine at ~1 update/sec.
- **Rating cron (10 min) over same-txn update:** no row contention; idempotent.
- **One Postgres over Cassandra:** 0.4 TB/year, joins; add Elasticsearch only for free-text + geo.
- **Failure:** bad nightly index → canary node + rollback; dense cell → higher precision/quadtree split, top-K per cell.
- **Senior signal:** density skew (a Mumbai cell) and a bad snapshot rolled to all nodes at once.

**Say in the interview:** "It is 1000:1 read-heavy and the index is only ~6 GB, so I replicate it in memory. No sharding; cache only the detail lookups."

**Avoid:** Searching only one geohash cell (forgetting neighbours); adding Kafka or sharding that the numbers do not need.
