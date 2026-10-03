**Ek line:** "2 km ke andar kaun hai" fast answer karne ke liye 2D ko 1D me map karo (geohash) ya space ko tree me todo (quadtree); moving drivers Redis GEO me.

- **Normal lat/lng index slow:** B-tree ek dimension pe achha; `(lat, lng)` composite bhi madad nahi karta.
- **Geohash:** common prefix = paas. 5 char ~4.9 km, 6 char ~1.2 km x 0.6 km, 7 char ~150 m.
- **Neighbours:** apna cell + 8 neighbours query karo, phir exact distance se filter/sort.
- **Quadtree:** dense area me chhote cells; in-memory; static places ke liye. Frequent updates pe rebalance mehenga.
- **S2 / H3:** S2 = Google cube cells; H3 = Uber hexagons, surge/heatmap ke liye.
- **Redis GEO:** moving objects (drivers), in-memory, fast updates.
- **PostGIS:** polygons, zones, rich queries; high write rate pe heavy.
- **Update load:** 50K drivers / 4 sec ≈ 12.5K writes/sec ek city me. DB me mat likho, Redis me overwrite.
- **History:** Kafka → batch cold storage.
- **Shard by city** (`drivers:blr`); `last_seen` TTL ~30 sec se stale hatao.

**Interview me bolo:** "Drivers ki latest location Redis GEO me, city-wise shard. 4 sec update overwrite hai, history Kafka se async. Static restaurants ke liye geohash/quadtree, zones ke liye PostGIS."

**Galti mat karna:** Geohash ke neighbouring cells bhool jaana. Har location update SQL me likhna, ya moving drivers ke liye quadtree.
