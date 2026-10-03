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

**Ek line me:** rider pickup aur drop daalta hai, system paas ka free driver dhoondh ke match karta hai, aur ride ke dauraan driver ki live location rider ko dikhti hai. Core challenge ye hai ki **lakhon drivers har 4 sec location bhej rahe hain** aur **ek driver ko ek hi ride mile**.

**Is question me interviewer kya check karta hai:** write-heavy location data ko kahan rakhoge (geospatial index), nearby search kaise fast karoge, matching me contention (lock), ride ka state machine, aur real-time updates.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

Design shuru karne se pehle ye sawal poochho:

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Scope me ride request, matching, live tracking aur fare hai? Payment third-party maan loon?" | Haan | Payment ka internal design nahi |
| "Driver kitni der me location bhejta hai?" | Har ~4 sec | Bahut write-heavy, in-memory geo store chahiye |
| "Kitne active drivers aur riders?" | ~1M online drivers peak, 10M rides/day | Location writes ~250K/sec |
| "Ek driver ko ek time pe ek hi ride offer ho, ye strict hai?" | Haan | Driver pe distributed lock |
| "Pool/shared rides, scheduled rides scope me?" | Nahi | Out of scope |
| "ETA aur route ke liye Google Maps jaisa service use kar sakte hain?" | Haan | Maps ko black box maan lo |

> **Bolo:** "Main 3 core flows design karunga: driver location update, rider ka ride request + matching, aur ride ke dauraan live tracking. Location path pe latency aur throughput, aur matching pe consistency (ek driver ek ride) priority hai."

## Step 2: Requirements

**Functional (users ye kar sakein)**
1. Rider pickup/drop daal ke fare estimate + ETA dekh sake
2. Rider ride request kare, aur system paas ka driver match kare
3. Driver offer accept/decline kare, aur ride start/end kare
4. Ride ke dauraan rider driver ki live location dekh sake

**Out of scope:** payment internals, pool/shared rides, scheduled rides, ratings.

**Non-functional (priority order me)**
1. **Consistency for matching:** ek driver ek time pe ek hi ride (double assign zero)
2. **Scale:** 1M online drivers, location writes ~250K/sec, peak ~1K ride requests/sec
3. **Latency:** match p95 < 10 sec, live location rider tak < 2 sec, nearby search p99 < 100 ms
4. **Availability:** 99.99% for location + matching. Location data eventual (4 sec purani bhi chalegi)

**CAP choice:** driver assignment pe consistency (lock + DB conditional update, fail ho to next driver). Location aur tracking pe availability: thodi stale location chalegi, system down nahi.

## Step 3: Estimation (sirf jo design badle)

- 1M online drivers, har 4 sec ek update → **~250K writes/sec**. Ye Postgres pe nahi chalega. In-memory store (Redis GEO) chahiye.
- Har update ~100 bytes → 25 MB/sec. Sirf **latest location** rakhni hai, history alag async pipeline me.
- Rides: 10M/day ≈ **~120 ride requests/sec** avg, peak ~1K/sec. Ride DB ka load chhota hai.

> **Bolo:** "Asli load ride booking nahi, driver location updates hain: 250K writes/sec. Isliye location ko main DB se alag, in-memory geo index me rakhunga, aur rides ko normal SQL DB me."

## Step 4: Core entities

- **Rider**: id, name, phone, rating
- **Driver**: id, vehicle, city, status (`OFFLINE`, `AVAILABLE`, `ON_TRIP`), rating
- **DriverLocation**: driver_id, lat, lng, updated_at (sirf latest, Redis me)
- **Ride**: id, rider_id, driver_id, pickup, drop, status, fare, surge_multiplier, created_at
- **FareEstimate**: id, rider_id, pickup, drop, price, expires_at

## Step 5: APIs

```http
POST  /fare-estimate   {pickup, drop}                 → {estimateId, price, eta, expiresAt}
POST  /rides           {estimateId}                   → {rideId, status: REQUESTED}
      Header: Idempotency-Key: <uuid>
POST  /drivers/location {lat, lng}                    → 200   (har 4 sec)
POST  /rides/{rideId}/accept                          → {status: ACCEPTED}
PATCH /rides/{rideId}  {status: STARTED | COMPLETED}  → ride
WS    /rides/{rideId}/track                           → driver location stream
```

> **Bolo:** "Fare estimate alag API hai kyunki rider pehle price dekhta hai, aur ride request usi estimateId se hoti hai, taaki surge price lock rahe."

## Step 6: High-level design

**Simple v1 pehle:** apps → ek Ride Service → Postgres (rides + drivers table me lat/lng). Chhote shehar (1K drivers) ke liye ye kaafi hai. Par 250K location writes/sec Postgres nahi jhelega → Redis GEO aur alag Location Service. Multiple matching instances ek driver pe race karenge → lock. Server push chahiye (offer + tracking) → WebSocket Gateway. Ek location stream ke 3 consumers → Kafka.

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
  K --> H[("S3 location history")]
```

**FR mapping:** FR1 → Ride Service + Maps + Surge, FR2 → Matching + Redis GEO + locks, FR3 → Ride Service + Postgres, FR4 → Location Service → Kafka → WS Gateway.

**Har component kyun:**
- **Location Service + Redis GEO:** 250K writes/sec, sirf latest location (`GEOADD` overwrite). Simpler option Postgres/PostGIS har row update pe index + WAL likhega, is rate pe nahi chalega.
- **Matching Service:** alag service kyunki iska load location reads + Maps calls pe hai, ride CRUD pe nahi; alag scale hota hai. v1 me Ride Service ka module bhi ho sakta hai.
- **Redis locks:** multiple matching instances, ek driver ek ride. Simpler option `SELECT FOR UPDATE` 15 sec ke driver wait me DB connection pakde rakhega.
- **Ride Service + Postgres:** state machine aur fare. Peak ~1K writes/sec, ACID chahiye. NoSQL ki zaroorat nahi.
- **WebSocket Gateway:** offer driver ko aur location rider ko < 2 sec me push. Simpler option polling har 2 sec = millions faltu requests.
- **Kafka:** ~250K events/sec, 3 independent consumers (tracking, surge, history) aur history ke liye replay. SQS jaisi queue me ek message ek hi consumer leta hai, fan-out ke liye 3 queues + 3x writes lagenge.
- **S3 location history:** route replay, disputes. Append-only, sasta. Cassandra tabhi jab per-ride route high QPS pe padhna ho.
- **Maps / ETA Service:** road + traffic ETA. Straight-line distance galat driver chunta hai.

## Step 7: Main flow: ride request aur matching

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

Driver 15 sec me accept na kare ya decline kare, to lock chhod do aur list ke agle driver pe jao.

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

- **Rides → Postgres:** state transitions transaction me, ~1K writes/sec easily. City ke hisaab se shard kar sakte ho.
- **Live location → Redis GEO:** in-memory, `GEOSEARCH` fast. Purani location ka koi kaam nahi, durability zaroori nahi.
- **Location history → Kafka → S3:** trip route, disputes aur analytics ke liye. Append-only, batch me likho (per ride/hour files).

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 250K location writes/sec kahan rakhoge?
**NFR:** 250K writes/sec, nearby search p99 < 100 ms.
- **Postgres kyun nahi:** har update ek row update + index update. 250K/sec pe B-tree index aur WAL dam tod denge.
- **Redis GEO:** andar se geohash ko sorted set score banata hai. `GEOADD` O(log N), `GEOSEARCH` radius me fast.
- **City-wise sharding:** `drivers:pune`, `drivers:mumbai` alag keys, alag Redis nodes. Ek city ka load doosre ko nahi chhuta.
- **Client side throttle:** driver ruka hua hai to update kam bhejo (har 10–15 sec).
- **Stale driver:** 30 sec se update nahi aaya to available set se hatao (TTL wala hash ya cleanup).
- **Trade-off:** Redis crash pe last few sec ki location ja sakti hai; acceptable, drivers 4 sec me dobara bhejte hain.

### 9.2 Nearby drivers kaise dhoondhoge?
**NFR:** match p95 < 10 sec, sahi (road-wise paas) driver.
- **Geohash:** lat/lng ko string me badalta hai (`tdr1v`). Same prefix = paas paas. Search me apna cell + 8 neighbour cells dekho, kyunki boundary pe paas wala driver doosre cell me ho sakta hai.
- **Alternatives:** Quadtree (dense areas me cells chhote), Uber ka **H3** (hexagons, neighbours ki distance barabar).
- Radius me 10–20 candidates lo, phir **Maps service se road ETA** nikaal ke rank karo. Nadi ke us paar wala driver straight-line me paas hai par 20 min door.
- **Trade-off:** Maps calls latency aur cost badhate hain, isliye sirf top 10–20 candidates pe.

### 9.3 Ek driver ko do rides na mile
**NFR:** double assign zero (consistency).
- Matching Service multiple instances me chal raha hai. Do riders ka request same driver d1 ko pick kar sakta hai.
- **Distributed lock:** `SET lock:driver:d1 ride77 NX PX 15000`. Jisko lock mila, wahi offer bhejega. Doosra next driver pe jayega.
- TTL isliye ki driver ne jawab nahi diya ya service crash hui to lock khud chhoot jaye.
- **Final safety DB me:** assign karte waqt `UPDATE drivers SET status='ON_TRIP' WHERE id=d1 AND status='AVAILABLE'`. 0 rows update hui to assign fail.
- **Trade-off:** Redis lock fast hai par 100% safe nahi (failover pe lock ja sakta hai), isliye DB check final guard hai.

### 9.4 Ride state machine
**NFR:** ride state hamesha correct (ACID), galat transition nahi.
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
- Har transition `UPDATE rides SET status=? WHERE id=? AND status=<expected>` se. Galat transition (COMPLETED se STARTED) reject.
- Har transition pe event (outbox table se, usi Kafka cluster pe): notifications, billing. Ye sirf ~1K/sec hai; Kafka pehle se hai isliye reuse, warna SQS kaafi tha.
- **Trade-off:** har transition conditional update hai, toh retries pe client ko 409 handle karna padta hai.

### 9.5 Live tracking aur surge
**NFR:** live location rider tak < 2 sec.
- Ride ke dauraan driver ki location Kafka pe aati hai. WebSocket Gateway `rideId` se rider ka connection dhoondh ke push karta hai.
- Rider ka WS kis gateway node pe hai, ye Redis me `conn:rider1 → node7` rakho.
- **Surge (brief):** har geohash cell me har 1 min demand (requests) / supply (available drivers) ratio. Ratio > threshold to multiplier 1.5x. Estimate pe multiplier lock, 2 min valid.
- **Trade-off:** Kafka hop ~100s of ms latency jodta hai, par 2 sec budget me fit hai aur consumers decoupled rehte hain.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Redis GEO** for live location | In-memory, 250K writes/sec, built-in radius search | **Postgres + PostGIS:** har 4 sec row update + index, itne writes nahi. **Sacrifice:** durability (crash pe last location ja sakti hai) aur RAM cost |
| **Geohash / H3 cells** | Simple prefix match, sharding easy | **Har driver se distance:** 1M scan, slow. **Quadtree:** dense areas me better par update pe tree rebalance. **Sacrifice:** cell boundary pe 8 neighbours bhi dekhne padte hain |
| **Redis lock with TTL** on driver | Fast, atomic `NX`, crash pe auto release | **`SELECT FOR UPDATE`:** 15 sec tak DB connection block. **ZooKeeper:** zyada safe par slow aur extra system. **Sacrifice:** failover pe lock kho sakta hai, DB check chahiye |
| **Postgres** for rides | State machine + fare ke liye ACID, ~1K writes/sec | **Cassandra/DynamoDB:** conditional transitions aur transactions kamzor. **Sacrifice:** bahut bade scale pe city-wise sharding khud karni padegi |
| **WebSocket** for offers + tracking | Server push, < 2 sec | **Polling har 2 sec:** millions faltu requests, battery drain. **Sacrifice:** stateful connections, conn registry aur reconnect logic |
| **Kafka** for location stream | 250K events/sec, 3 consumer groups (tracking, surge, history), replay | **SQS/RabbitMQ:** ek message ek consumer, fan-out ke liye 3 queues. **Direct calls:** tight coupling. **Sacrifice:** Kafka cluster chalana aur ~100 ms extra hop |
| **S3** for location history | Append-only, sasta, route replay | **Cassandra:** fast per-ride reads par ek aur cluster. **Sacrifice:** history query slow (batch/Athena) |
| **Maps service se ETA** | Road + traffic aware | **Haversine:** nadi/flyover ignore, galat driver. **Sacrifice:** har match pe external call ki latency + cost |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Redis GEO node down | Us city ke drivers search me nahi dikhenge | Replica + failover. 4 sec me drivers dobara location bhej ke index rebuild kar dete hain |
| Driver ka network gaya | Stale location, galat match | `lastSeen` > 30 sec to available set se hatao |
| Matching service crash after lock | Driver locked reh gaya | Lock TTL 15 sec, khud chhoot jayega |
| WebSocket gateway down | Rider ko live location nahi dikhegi | Client reconnect karke doosre node pe, last location REST se fetch |
| Hot area (stadium ke baad match) | Ek cell pe bahut requests | Surge pricing se demand kam, aur cell ko chhote cells me todna |
| Double ride request (rider ne 2 baar tap kiya) | Do rides ban sakti thi | Idempotency-Key, `UNIQUE` constraint |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Batch matching:** har 2 sec ke window me saare requests aur drivers ko ek saath match karna (global optimal), greedy nearest-first ki jagah
- **Driver ki next location predict karna** (speed + direction), taaki matching me stale location ka asar kam ho
- **Multi-region, city-wise cells:** har city ka pura stack apne region me, ek city ka outage doosri ko na chhue
- **Trip ke khatam hone se pehle next ride offer** (chaining), driver idle time kam
- **Fraud detection:** GPS spoofing pakadna (impossible speed jumps)
- Location history ko compress (polyline encoding) karke S3 cost kam karna

## Step 13: Interviewer ke likely follow-up sawal

- "Location Postgres me kyun nahi?" → 250K writes/sec, sirf latest chahiye. Redis GEO in-memory hai → Step 9.1
- "Geohash boundary pe driver miss ho to?" → apna cell + 8 neighbours search karo
- "Do matching instances ne same driver chuna to?" → Redis lock `NX` + DB conditional update → Step 9.3
- "Driver ne accept nahi kiya to?" → 15 sec timeout, lock release, next driver. 3 fail ke baad radius badhao
- "Rider ko driver ki location kaise dikhti hai?" → driver → Location Service → Kafka → WS Gateway → rider
- "Redis crash me data loss?" → acceptable, drivers 4 sec me fresh location bhej dete hain
- "Kafka kyun, SQS kyun nahi?" → 250K events/sec, 3 independent consumers + replay. Queue me ek message ek consumer leta hai
- **Senior signal:** khud bolo ki hot city (Mumbai peak) ka Redis GEO shard aur matching hotspot banega; city ko geohash cells me split karke shard karo, aur Redis failover pe lock lost hone ka risk DB conditional update se cover hai.

## 2-minute recap (interview se pehle ye padho)

> Uber me asli load driver location ka hai: 1M drivers × har 4 sec = 250K writes/sec. Isliye latest location Redis GEO me (geohash based, city-wise sharded), Postgres me nahi. Rider request aata hai to Matching Service `GEOSEARCH` se paas ke 10–20 available drivers leta hai, Maps se road ETA nikaal ke rank karta hai, aur driver pe Redis lock (`SET NX PX 15s`) lagake offer WebSocket se bhejta hai. Lock + DB conditional update se ek driver ko ek hi ride milti hai. Ride Postgres me state machine (REQUESTED → ACCEPTED → STARTED → COMPLETED) ke saath. Ride ke dauraan location Kafka (250K events/sec, 3 consumers: tracking, surge, S3 history) se WebSocket Gateway tak aur rider ko push hoti hai. Surge = cell-wise demand/supply ratio, estimate pe lock.

## Checklist

- [ ] 250K writes/sec ka estimate nikaal ke bata sakta hoon ki Postgres kyun nahi
- [ ] Redis GEO aur geohash ka nearby search (neighbour cells ke saath) samjha sakta hoon
- [ ] Driver pe distributed lock + DB conditional update se double assign rokna bata sakta hoon
- [ ] Ride state machine draw kar sakta hoon
- [ ] Live location ka path (driver → Kafka → WS → rider) explain kar sakta hoon
- [ ] Surge pricing aur ETA ka basic logic bata sakta hoon
- [ ] HLD diagram 5 min me bana sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
