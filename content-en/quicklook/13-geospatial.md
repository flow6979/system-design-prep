**In one line:** To answer "who is within 2 km" fast, map 2D to 1D (geohash) or split space into a tree (quadtree); keep moving drivers in Redis GEO.

- **Plain lat/lng index is slow:** a B-tree works on one dimension; a `(lat, lng)` composite doesn't help either.
- **Geohash:** common prefix = nearby. 5 chars ~4.9 km, 6 chars ~1.2 km x 0.6 km, 7 chars ~150 m.
- **Neighbours:** query your cell plus its 8 neighbours, then filter and sort by exact distance.
- **Quadtree:** smaller cells in dense areas; in-memory; for static places. Rebalancing is costly under frequent updates.
- **S2 / H3:** S2 = Google cube-based cells; H3 = Uber hexagons, good for surge/heatmaps.
- **Redis GEO:** moving objects (drivers), in-memory, fast updates.
- **PostGIS:** polygons, zones, rich queries; heavy at high write rates.
- **Update load:** 50K drivers / 4 sec ≈ 12.5K writes/sec in one city. Overwrite in Redis, not the DB.
- **History:** Kafka → batch to cold storage.
- **Shard by city** (`drivers:blr`); drop stale drivers with a ~30 sec `last_seen` TTL.

**Say in the interview:** "Latest driver locations in Redis GEO, sharded by city. The 4-sec update is an overwrite; history goes via Kafka asynchronously. Geohash/quadtree for static restaurants, PostGIS for zones."

**Avoid:** Forgetting geohash neighbour cells. Writing every location update to SQL, or using a quadtree for moving drivers.
