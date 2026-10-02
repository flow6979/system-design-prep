---
title: Design Uber / Ola
order: 6
tier: 1
time: 25
patterns: [Geospatial index, Write-heavy, Distributed lock, State machine, Real-time push]
topics: [13-geospatial, 09-locks-and-contention, 08-real-time-communication, 05-caching, 07-message-queues-kafka, 04-sharding-consistent-hashing]
askedAt: [Uber, Ola, Amazon, Google, Meta, Swiggy]
---

# Design Uber / Ola

**In one line:** the rider enters pickup and drop, the system finds and matches a nearby free driver, and during the ride the rider sees the driver's live location. The core challenge is that **lakhs of drivers send their location every 4 sec**, and **one driver must get only one ride**.

**What the interviewer checks in this question:** where you keep write-heavy location data (geospatial index), how you make nearby search fast, contention in matching (lock), the ride state machine, and real-time updates.

---

## Step 1: Clarify with the interviewer (3–5 min)

Ask these questions before you start the design:

| You ask | Typical answer | Effect on design |
|---|---|---|
| "Are ride request, matching, live tracking and fare in scope? Can I assume payment is third-party?" | Yes | No need to design payment internals |
| "How often does a driver send location?" | Every ~4 sec | Very write-heavy, we need an in-memory geo store |
| "How many active drivers and riders?" | ~1M online drivers at peak, 10M rides/day | Location writes ~250K/sec |
| "Is it strict that one driver gets only one ride offer at a time?" | Yes | Distributed lock on the driver |
| "Are pool/shared rides and scheduled rides in scope?" | No | Out of scope |
| "Can we use a service like Google Maps for ETA and routes?" | Yes | Treat Maps as a black box |

> **Say:** "I will design 3 core flows: driver location update, the rider's ride request + matching, and live tracking during the ride. The priority is latency and throughput on the location path, and consistency (one driver, one ride) in matching."

## Step 2: Requirements

**Functional**
1. A rider can enter pickup/drop and see a fare estimate + ETA
2. A rider can request a ride, and the system matches a nearby driver
3. A driver can accept/decline, and start and end a ride
4. During the ride, the rider sees the driver's live location

**Non-functional**
- **Low latency:** match < 10 sec, location update reaches the rider in ~1–2 sec
- **Consistency:** one driver, only one ride at a time (no double assign)
- **Availability:** location and matching always work (99.99%)
- **Scale:** write-heavy (location), city-wise traffic, spikes during peak hours

## Step 3: Estimation (only what changes the design)

- 1M online drivers, one update every 4 sec → **~250K writes/sec**. Postgres cannot handle this. We need an in-memory store (Redis GEO).
- Each update is ~100 bytes → 25 MB/sec. We keep only the **latest location**, and history goes to a separate async pipeline.
- Rides: 10M/day ≈ **~120 ride requests/sec** avg, peak ~1K/sec. The load on the ride DB is small.

> **Say:** "The real load is not ride booking, it is driver location updates: 250K writes/sec. So I will keep location separate from the main DB, in an in-memory geo index, and keep rides in a normal SQL DB."

## Step 4: Core entities

- **Rider**: id, name, phone, rating
- **Driver**: id, vehicle, city, status (`OFFLINE`, `AVAILABLE`, `ON_TRIP`), rating
- **DriverLocation**: driver_id, lat, lng, updated_at (only the latest, in Redis)
- **Ride**: id, rider_id, driver_id, pickup, drop, status, fare, surge_multiplier, created_at
- **FareEstimate**: id, rider_id, pickup, drop, price, expires_at

## Step 5: APIs

```http
POST  /fare-estimate   {pickup, drop}                 → {estimateId, price, eta, expiresAt}
POST  /rides           {estimateId}                   → {rideId, status: REQUESTED}
      Header: Idempotency-Key: <uuid>
POST  /drivers/location {lat, lng}                    → 200   (every 4 sec)
POST  /rides/{rideId}/accept                          → {status: ACCEPTED}
PATCH /rides/{rideId}  {status: STARTED | COMPLETED}  → ride
WS    /rides/{rideId}/track                           → driver location stream
```

> **Say:** "Fare estimate is a separate API because the rider sees the price first, and the ride request uses the same estimateId, so the surge price stays locked."

## Step 6: High-level design

```mermaid
flowchart LR
  R["Rider app"] --> G["API Gateway"]
  D["Driver app"] --> G
  G --> RS["Ride Service"]
  G --> LS["Location Service"]
  G --> WS["WebSocket Gateway"]
  LS --> GEO[("Redis GEO")]
  RS --> M["Matching Service"]
  M --> GEO
  M --> LK[("Redis locks")]
  RS --> DB[("Postgres rides")]
  RS --> MAP["Maps / ETA Service"]
  LS --> K[["Kafka"]]
  K --> WS
  K --> SP["Surge Pricing"]
```

**Why each component:**
- **Location Service + Redis GEO:** handles 250K writes/sec. Only the latest location of each driver, overwritten with `GEOADD`.
- **Matching Service:** finds nearby available drivers, ranks them by ETA, takes a lock and sends an offer to one driver.
- **Ride Service + Postgres:** the ride state machine and fare. Low write load, needs ACID.
- **WebSocket Gateway:** persistent connection with the driver app and rider app. Ride offers are pushed to the driver and live location to the rider.
- **Kafka:** a stream of location events. Tracking, surge pricing and analytics consume it separately.
- **Maps / ETA Service:** ETA with road distance and traffic. Straight-line distance is wrong.

## Step 7: Main flow: ride request and matching

```mermaid
sequenceDiagram
  participant R as Rider
  participant RS as Ride Service
  participant M as Matching Service
  participant GEO as Redis GEO
  participant L as Redis Lock
  participant D as Driver
  R->>RS: POST /rides with estimateId
  RS->>M: find driver for ride 77
  M->>GEO: GEOSEARCH 2 km radius, available only
  GEO-->>M: 10 nearest drivers
  M->>M: rank by ETA from Maps
  M->>L: SET lock:driver:d1 ride77 NX PX 15000
  L-->>M: OK
  M->>D: ride offer via WebSocket
  D-->>M: accept
  M->>RS: assign d1 to ride 77
  RS->>RS: status REQUESTED to ACCEPTED, driver ON_TRIP
  RS-->>R: driver assigned, ETA 4 min
```

If the driver does not accept within 15 sec, or declines, release the lock and move to the next driver in the list.

## Step 8: Data model & DB choice

```sql
rides(id PK, rider_id, driver_id, status, pickup_lat, pickup_lng, drop_lat, drop_lng,
      fare, surge_multiplier, idempotency_key UNIQUE, created_at, updated_at)
drivers(id PK, city, vehicle_type, status, rating)
```

```text
Redis GEO:   GEOADD drivers:pune:available <lng> <lat> d1
Redis hash:  driver:d1 → {status, lastSeen, rideId}
Redis lock:  lock:driver:d1 → ride77  (TTL 15s)
```

- **Rides → Postgres:** state transitions in a transaction, ~1K writes/sec easily. You can shard by city.
- **Live location → Redis GEO:** in-memory, fast `GEOSEARCH`. Old locations are of no use, so durability is not needed.
- **Location history → Kafka → Cassandra/S3:** for trip routes, disputes and analytics. Write-heavy, append-only.

## Step 9: Deep dives (the interviewer will push here)

### 9.1 Where will you keep 250K location writes/sec?
- **Why not Postgres:** every update is a row update + index update. At 250K/sec, the B-tree index and WAL will choke.
- **Redis GEO:** internally it uses the geohash as a sorted set score. `GEOADD` is O(log N), and `GEOSEARCH` is fast within a radius.
- **City-wise sharding:** `drivers:pune`, `drivers:mumbai` are separate keys on separate Redis nodes. Load from one city does not touch another.
- **Client-side throttle:** if the driver is standing still, send fewer updates (every 10–15 sec).
- **Stale driver:** if no update for 30 sec, remove them from the available set (hash with TTL, or cleanup).

### 9.2 How will you find nearby drivers?
- **Geohash:** converts lat/lng into a string (`tdr1v`). Same prefix = close to each other. In search, look at your own cell + 8 neighbour cells, because a nearby driver at the boundary can be in another cell.
- **Alternatives:** Quadtree (smaller cells in dense areas), Uber's **H3** (hexagons, all neighbours are at equal distance).
- Take 10–20 candidates in the radius, then get the **road ETA from the Maps service** and rank. A driver across the river is close in a straight line but 20 min away.

### 9.3 One driver must not get two rides
- The Matching Service runs as multiple instances. Two riders' requests can pick the same driver d1.
- **Distributed lock:** `SET lock:driver:d1 ride77 NX PX 15000`. Whoever gets the lock sends the offer. The other moves to the next driver.
- The TTL is there so that if the driver does not respond or the service crashes, the lock is released by itself.
- **Final safety in the DB:** when assigning, run `UPDATE drivers SET status='ON_TRIP' WHERE id=d1 AND status='AVAILABLE'`. If 0 rows are updated, the assign fails.

### 9.4 Ride state machine
```mermaid
flowchart LR
  A["REQUESTED"] --> B["MATCHING"]
  B --> C["ACCEPTED"]
  C --> D["ARRIVED"]
  D --> E["STARTED"]
  E --> F["COMPLETED"]
  B --> X["CANCELLED"]
  C --> X
  B --> N["NO_DRIVER"]
```
- Every transition uses `UPDATE rides SET status=? WHERE id=? AND status=<expected>`. A wrong transition (COMPLETED to STARTED) is rejected.
- A Kafka event on every transition: notifications, billing, analytics.

### 9.5 Live tracking and surge
- During the ride, the driver's location comes on Kafka. The WebSocket Gateway finds the rider's connection by `rideId` and pushes it.
- Keep which gateway node the rider's WS is on in Redis: `conn:rider1 → node7`.
- **Surge (brief):** every 1 min, compute the demand (requests) / supply (available drivers) ratio for each geohash cell. If the ratio > threshold, the multiplier is 1.5x. The multiplier is locked on the estimate, valid for 2 min.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **Redis GEO** for live location | In-memory, 250K writes/sec, built-in radius search | **Postgres + PostGIS:** a row update + index rebuild every 4 sec, cannot handle that many writes |
| **Geohash / H3 cells** | Simple prefix match, easy sharding | **Calculating distance to every driver:** scanning 1M drivers, very slow |
| **Redis lock with TTL** on driver | Fast, atomic `NX`, auto release on crash | **DB row lock (`SELECT FOR UPDATE`):** waiting up to 15 sec for the driver's answer blocks DB connections |
| **Postgres** for rides | ACID for state machine + fare, small write load | **Cassandra:** weak conditional state transitions and transactions |
| **WebSocket** for offers + tracking | Server push, 1–2 sec latency | **Polling every 2 sec:** useless requests from 10M clients, battery drain |
| **Kafka** for location stream | One stream, multiple consumers (tracking, surge, history) | **Location Service calling everyone directly:** tight coupling, one slow consumer slows everything |
| **ETA from Maps service** | Road + traffic aware | **Haversine distance:** ignores rivers/flyovers, matches the wrong driver |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Redis GEO node down | Drivers in that city do not show in search | Replica + failover. Within 4 sec, drivers send their location again and the index is rebuilt |
| Driver loses network | Stale location, wrong match | If `lastSeen` > 30 sec, remove from the available set |
| Matching service crashes after lock | Driver stays locked | Lock TTL is 15 sec, it is released by itself |
| WebSocket gateway down | Rider does not see live location | Client reconnects to another node, fetches the last location via REST |
| Hot area (after a stadium match) | Too many requests in one cell | Surge pricing reduces demand, and split the cell into smaller cells |
| Double ride request (rider tapped twice) | Two rides could be created | Idempotency-Key, `UNIQUE` constraint |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Batch matching:** match all requests and drivers in a 2 sec window together (global optimum), instead of greedy nearest-first
- **Predict the driver's next location** (speed + direction), to reduce the effect of stale locations on matching
- **Multi-region, city-wise cells:** the full stack for each city in its own region, so an outage in one city does not touch another
- **Offer the next ride before the trip ends** (chaining), less driver idle time
- **Fraud detection:** catch GPS spoofing (impossible speed jumps)
- Compress location history and keep it in S3, for route replay in disputes

## Step 13: Likely follow-up questions

- "Why not keep location in Postgres?" → 250K writes/sec, and we only need the latest. Redis GEO is in-memory → Step 9.1
- "What if a driver at a geohash boundary is missed?" → Search your own cell + 8 neighbours
- "What if two matching instances pick the same driver?" → Redis lock `NX` + DB conditional update → Step 9.3
- "What if the driver does not accept?" → 15 sec timeout, release the lock, next driver. After 3 failures, increase the radius
- "How does the rider see the driver's location?" → driver → Location Service → Kafka → WS Gateway → rider
- "Data loss if Redis crashes?" → Acceptable, drivers send a fresh location within 4 sec

## 2-minute recap

> In Uber, the real load is driver location: 1M drivers × every 4 sec = 250K writes/sec. So the latest location goes in Redis GEO (geohash based, sharded by city), not Postgres. When a rider request comes, the Matching Service gets 10–20 nearby available drivers with `GEOSEARCH`, ranks them by road ETA from Maps, takes a Redis lock on the driver (`SET NX PX 15s`) and sends the offer over WebSocket. The lock + a DB conditional update make sure one driver gets only one ride. Rides live in Postgres with a state machine (REQUESTED → ACCEPTED → STARTED → COMPLETED). During the ride, location goes through Kafka to the WebSocket Gateway and is pushed to the rider. Surge = cell-wise demand/supply ratio, locked on the estimate.

## Checklist

- [ ] I can work out the 250K writes/sec estimate and tell why not Postgres
- [ ] I can explain nearby search with Redis GEO and geohash (with neighbour cells)
- [ ] I can tell how a distributed lock on the driver + DB conditional update stops double assign
- [ ] I can draw the ride state machine
- [ ] I can explain the live location path (driver → Kafka → WS → rider)
- [ ] I can tell the basic logic of surge pricing and ETA
- [ ] I can draw the HLD diagram in 5 min
- [ ] I can say 3 trade-offs from the decision table without notes
