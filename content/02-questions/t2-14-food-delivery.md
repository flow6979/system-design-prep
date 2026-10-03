---
title: Design Swiggy / Zomato (Food Delivery)
order: 14
tier: 2
time: 22
patterns: [Geospatial, State machine, Locks, Real-time tracking, Async events]
topics: [13-geospatial, 14-search-indexing, 09-locks-and-contention, 08-real-time-communication, 07-message-queues-kafka, 16-distributed-transactions, 10-idempotency-retries]
askedAt: [Swiggy, Zomato, Uber, DoorDash, Amazon, Flipkart]
---

# Design Swiggy / Zomato (Food Delivery)

**Ek line me:** user apne paas ke restaurants dhoondhta hai, menu se cart banata hai, pay karta hai, aur ek delivery partner khana pickup karke live tracking ke saath deliver karta hai.

**Is question me interviewer kya check karta hai:** geo search (nearby restaurants), order ka clean state machine, delivery partner ko **ek hi order do baar assign na ho** (lock), live location tracking ka scale, aur services ke beech async events.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Scope: search, menu, cart, order, partner assignment, tracking? Payment third-party gateway?" | Haan | Payment gateway black box, webhook se result |
| "Delivery radius kitna? 5–7 km?" | Haan, ~7 km | Geohash precision 5–6 cells, nearby cells query |
| "Partner location kitni baar aati hai?" | Har 5 sec | Location writes bahut zyada, DB nahi, Redis geo |
| "Ek partner ek time pe ek order? Ya batching?" | Pehle ek, batching bonus | Assignment me partner pe lock |
| "Scale?" | ~20M orders/day peak city-wise lunch/dinner, 5 lakh active partners | Search read-heavy, location write-heavy |
| "Ratings, offers engine, grocery scope me?" | Nahi | Out of scope |

> **Bolo:** "Main 4 core flows design karunga: nearby restaurant search, order place karna, partner assign karna, aur live tracking. Order aur assignment pe consistency rakhunga, search aur tracking pe low latency aur availability."

## Step 2: Requirements

**Functional**
1. Users should be able to apne paas ke open restaurants search kar sakein (cuisine, dish name, rating filters)
2. Users should be able to menu dekh ke cart banayein, order place karein aur pay karein
3. Users should be able to restaurant accept karte hi ek nearby free partner assigned paayein
4. Users should be able to partner ko live map pe ETA ke saath dekhein, har status change pe push mile

**Out of scope:** ratings/reviews, offers engine, grocery, partner payouts, order batching.

**Non-functional (priority order me)**
1. **Correctness:** ek order ek hi partner ko, ek partner ek time pe ek order, payment double charge nahi
2. **Latency:** search p99 < 300 ms, partner location user tak < 2 sec
3. **Availability:** search aur menu 99.99%, lunch/dinner peak pe bhi
4. **Scale:** 20M orders/day, 5 lakh active partners, search read-heavy (~10 searches per order), location write-heavy

**CAP choice:** order, payment aur assignment pe consistency (galat assignment = paisa aur trust gaya). Search, menu aur tracking pe availability: 1–2 min purani list ya 5 sec purani location chalegi.

## Step 3: Estimation (sirf jo design badle)

- 20M orders/day, peak 3x → ~**700 orders/sec** peak. SQL sharded by city sambhal lega.
- Order events: ~6 status changes per order → peak ~**4K events/sec**, 3 alag consumers (assignment, notification, analytics).
- Search: har order pe ~10 searches → 200M/day ≈ 2.3K/sec avg, peak 3x ≈ **7K QPS**. Geohash cache se zyada tar hits cache pe.
- Location: 5 lakh partners / 5 sec → **1 lakh writes/sec**. Ye Postgres pe nahi jaayega, Redis GEO me in-memory.

> **Bolo:** "Order write load manageable hai. Asli load partner location updates ka hai, 1 lakh/sec, isliye location Redis me, aur sirf sampled history S3 me."

## Step 4: Core entities

- **Restaurant**: id, name, lat, lng, geohash, cuisines, is_open, rating
- **MenuItem**: id, restaurant_id, name, price, in_stock
- **Cart**: user_id, restaurant_id, items (Redis me, temporary)
- **Order**: id, user_id, restaurant_id, partner_id, items, amount, status, idempotency_key
- **DeliveryPartner**: id, status (`OFFLINE`, `AVAILABLE`, `BUSY`), current_lat, current_lng

## Step 5: APIs

```http
GET  /restaurants?lat=18.52&lng=73.85&cuisine=biryani   → nearby list
GET  /restaurants/{id}/menu                             → menu items
PUT  /cart  {restaurantId, items}                       → cart
POST /orders {cartId, addressId, paymentToken}          → {orderId, status}
     Header: Idempotency-Key: <uuid>
POST /partners/location {lat, lng}                      → 204 (har 5 sec)
WS   /orders/{orderId}/track                            → live location + ETA push
```

## Step 6: High-level design

**Simple v1 pehle:** apps → ek backend service → ek Postgres + PostGIS (restaurants, orders, partner location), user polling se tracking. Sab FRs poore. Phir numbers isko todte hain: 1 lakh location writes/sec (→ Redis GEO + Location Service), dish text search at 7K QPS (→ Elasticsearch), 3 consumers per order event (→ Kafka), lakhs users ka 5 sec polling (→ WebSocket gateway).

```mermaid
flowchart LR
  C["User app"] --> G["API Gateway"]
  P["Partner app"] --> G
  G --> S["Search Service"]
  G --> O["Order Service"]
  G --> L["Location Service"]
  S --> SC[("Redis search cache")]
  S --> ES[("Elasticsearch geo")]
  O --> DB[("Postgres orders")]
  O --> PG["Payment Gateway"]
  O --> K[["Kafka order events"]]
  K --> A["Assignment Service"]
  A --> RG[("Redis GEO partners")]
  L --> RG
  L --> T["Tracking WS Gateway"]
  K --> N["Notification Service"]
  T --> C
```

**Har component kyun:** (FR1 → Search + ES, FR2 → Order Service + Postgres + Payment, FR3 → Assignment + Redis GEO, FR4 → Location + Tracking WS + Notification)
- **Elasticsearch:** dish name ("paneer tikka") pe typo-tolerant text + geo + filters, 7K QPS. Sirf geo filter hota to **PostGIS + read replicas** kaafi tha. CDC se sync.
- **Redis search cache:** `geohash6 + filters` key, 1–2 min TTL. Ek area ke sab users ko same list, ES load kam.
- **Order Service + Postgres:** state machine aur payment ko ACID chahiye. 700 orders/sec city-sharded Postgres sambhal leta hai.
- **Kafka:** ~4K events/sec par **3 independent consumers** + analytics replay. Ek hi consumer hota to outbox + SQS worker kaafi tha.
- **Assignment Service:** alag worker, kyunki 30 sec offer windows aur retries order request path ko block na karein.
- **Location Service + Redis GEO:** 1 lakh writes/sec, order flow se 100x alag scale, isliye alag service.
- **Tracking WS Gateway:** push, kyunki lakhs users ka 5 sec poll bekaar load hai.

## Step 7: Main flow: order se delivery tak

```mermaid
sequenceDiagram
  participant U as User
  participant O as Order Service
  participant K as Kafka
  participant A as Assignment
  participant R as Redis GEO
  participant P as Partner
  U->>O: POST /orders with Idempotency-Key
  O->>O: payment success, status PLACED
  O->>K: OrderAccepted by restaurant
  K->>A: consume event
  A->>R: GEOSEARCH partners near restaurant 3 km
  A->>R: SET lock:partner:p7 order1 NX PX 30000
  A->>P: offer order1, accept in 30 sec
  P-->>A: accept
  A->>O: UPDATE order SET partner p7 WHERE partner IS NULL
  O->>K: PartnerAssigned
  K-->>U: push notification and live tracking starts
```

## Step 8: Data model & DB choice

```sql
orders(id PK, user_id, restaurant_id, partner_id NULL, status, amount,
       idempotency_key UNIQUE, created_at, updated_at)   -- shard by city_id
order_events(order_id, from_status, to_status, at)       -- audit trail
restaurants(id PK, name, lat, lng, geohash, is_open, cuisines)
```

- **Postgres** orders ke liye (transactions, conditional update). City ke basis pe shard, kyunki order kabhi city cross nahi karta.
- **Redis GEO** partner live location ke liye. **Location history:** har 30 sec ka point Redis list me, `DELIVERED` pe route S3 me (`order_id` key). Sirf per order padhi jaati hai, isliye Cassandra nahi.
- **Elasticsearch** restaurant + dish search ke liye (source of truth Postgres, ES sirf read copy).

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 Nearby restaurants kaise dhoondhoge?
**NFR:** search p99 < 300 ms, 7K QPS peak, 99.99% available.
- Restaurant ka **geohash** (precision 6 ≈ 1.2 km cell) store karo. User ka cell + 8 neighbours query karo, phir exact distance se filter.
- Practical: Elasticsearch `geo_point` + `geo_distance` filter + `is_open` + cuisine. Ek hi query me sab.
- Result ko `geohash6 + filters` key se Redis me 1–2 min cache karo. Ek area ke sab users ko same list milti hai.
- Delivery radius restaurant-wise alag ho sakta hai, isliye "serviceable polygon" check bhi lagao.
- **Trade-off:** cache + CDC se `is_open`/menu 1–2 min stale ho sakta hai; order time pe Postgres se final check.

### 9.2 Order state machine
**NFR:** correctness, koi invalid ya duplicate transition nahi.
```mermaid
flowchart LR
  A["PLACED"] --> B["ACCEPTED"]
  B --> C["PARTNER_ASSIGNED"]
  C --> D["PICKED_UP"]
  D --> E["DELIVERED"]
  A --> X["CANCELLED"]
  B --> X
  B --> F["PREPARING"]
  F --> C
```
- Transition sirf conditional update se: `UPDATE orders SET status='PICKED_UP' WHERE id=? AND status='PARTNER_ASSIGNED'`. 0 rows updated matlab invalid ya duplicate transition.
- Har transition `order_events` me likho aur Kafka pe publish karo (outbox pattern, taaki DB aur Kafka out of sync na hon).
- **Trade-off:** outbox events thode late aur at-least-once, consumers `order_id + status` pe dedup karein.

### 9.3 Partner assignment: ek partner do orders pe na jaaye
**NFR:** ek order ek partner, ek partner ek order (no double assignment).
- `GEOSEARCH` se 3 km me `AVAILABLE` partners, distance + rating + current load se score karo.
- Top partner pe **Redis lock** `SET lock:partner:p7 order1 NX PX 30000`. Lock mila to hi offer bhejo. 30 sec me accept nahi kiya to lock expire, agla partner.
- Final truth DB: `UPDATE orders SET partner_id=p7 WHERE id=order1 AND partner_id IS NULL`. Do assigners race karein to bhi ek hi jeetega.
- Partner ko `BUSY` mark karo taaki agle search me na aaye.
- **Trade-off:** ek-ek partner ko offer = har decline pe 30 sec wait. Top-2 ko parallel offer tez hai par complex.

### 9.4 Live tracking aur ETA
**NFR:** location user tak < 2 sec, 1 lakh writes/sec.
- Partner app har 5 sec `lat,lng` bheje → Location Service → Redis `GEOADD` + Redis pub/sub channel `order:{id}`.
- Tracking WS Gateway us channel ko subscribe karta hai jahan user connected hai, aur push karta hai. User ke paas WebSocket, polling nahi.
- **ETA** = restaurant prep time (history se) + partner → restaurant + restaurant → user travel time (maps API / road graph, traffic ke saath). Har location update pe recalculate, user ko smooth karke dikhao.
- **Trade-off:** pub/sub me update miss ho sakta hai; 5 sec me agla aata hai.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Elasticsearch geo** for restaurant search | Dish text + typo + geo + filters, 7K QPS | **PostGIS:** geo-only ke liye kaafi, text search kamzor. Sacrifice: ek aur cluster, 1–2 min CDC lag |
| **Redis GEO** for partner location | 1 lakh writes/sec in-memory, fast `GEOSEARCH` | **Postgres:** index thrash. **Custom quadtree:** banana mehnga. Sacrifice: crash pe last 5 sec ki locations gayab |
| **Redis lock + DB conditional update** for assignment | Lock = offer control, DB = final guarantee | **Sirf `SELECT FOR UPDATE`:** 30 sec tak row lock nahi pakad sakte. Sacrifice: logic do jagah |
| **Kafka** for order events | 3 independent consumers + replay | **Outbox + SQS:** ek consumer ke liye simpler, 3 ke liye fan-out chahiye. **Sync REST chain:** ek slow to sab slow. Sacrifice: 4K/sec pe Kafka ka ops cost |
| **WebSocket** for tracking | Push, < 2 sec | **Polling:** bekaar load. **SSE:** chalega. Sacrifice: stateful connections, reconnect handling |
| **Postgres sharded by city** | ACID, order city ke andar | **Single DB:** peak pe limit. **Cassandra:** conditional updates kamzor. Sacrifice: cross-city reports alag store se |
| **Outbox pattern** | DB write + event atomic | **Dual write:** publish fail pe event gayab. Sacrifice: relay + thoda lag |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Koi partner accept nahi kar raha | Order atka | Radius badhao, incentive badhao, 10 min baad user ko notify / auto cancel + refund |
| Redis GEO node down | Partner location gayab | Replica failover. Partner app 5 sec me fir bhej dega, data khud recover |
| Payment webhook miss | Paisa kata, order PENDING | Reconciliation job gateway se status poochhe |
| Partner app offline | Tracking ruk gaya | Last known location + "updating" dikhao, partner ko call option |
| Lunch peak ek city me | Search aur order service pe load | City-wise autoscale, search cache, restaurant ko "busy" mark karke throttle |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Order batching:** ek partner ko same direction ke 2 orders, cost kam
- **Pre-assignment:** restaurant ka prep time khatam hone se pehle hi partner bhejna, taaki partner wait na kare
- ETA ke liye **ML model** (historical prep time, weather, traffic)
- Restaurant ke paas **H3 hexagon** grid se demand-supply heatmap, partners ko wahan reposition karna

## Step 13: Interviewer ke likely follow-up sawal

- "Do assignment workers same partner ko pakad lein to?" → Redis `NX` lock + DB `WHERE partner_id IS NULL` (Step 9.3)
- "Restaurant ne item out of stock kar diya order ke baad?" → restaurant reject kare, order `CANCELLED`, auto refund
- "User ne cancel kiya pickup ke baad?" → state machine allow nahi karega ya cancellation fee policy
- "Location history kyun aur kahan?" → disputes, ETA training. 30 sec sampled route, S3 me per order, 90 din TTL
- "Geohash edge problem?" → user cell boundary pe ho to neighbour cells bhi query karo
- **Senior signal:** khud bolo: lunch peak pe kisi city me partners kam hon to assignment backlog badhta hai aur sequential 30 sec offers delay multiply karte hain. Assignment lag ko metric banao, radius/incentive auto-adjust karo, Redis GEO city-wise shard karo.

## 2-minute recap (interview se pehle ye padho)

> Swiggy me 4 flows hain: search, order, assignment, tracking. Simple v1 (ek service + PostGIS) se shuru, numbers pe evolve. Search Elasticsearch (dish text + geo_distance + filters) se, result Redis me geohash key pe cached. Order Postgres me, city se sharded, aur ek strict state machine jo conditional `UPDATE ... WHERE status=?` se chalti hai. Har transition outbox se Kafka pe jaata hai (3 consumers: assignment, notification, analytics). Assignment service Redis GEO se nearby free partners leti hai, top partner pe `SET NX PX 30s` lock, aur final `UPDATE WHERE partner_id IS NULL` se guarantee. Partner location 1 lakh writes/sec, Redis me, aur Redis pub/sub + WebSocket gateway se user tak live. ETA = prep time + travel time, har update pe recalculate. Payment pe idempotency key + reconciliation, notifications Kafka se async.

## Checklist

- [ ] Clarifying sawal aur scale numbers bina dekhe bata sakta hoon
- [ ] Geohash / ES geo se nearby restaurant search samjha sakta hoon
- [ ] Order state machine draw kar sakta hoon aur conditional update bata sakta hoon
- [ ] Partner assignment me double assignment kaise rokte hain bata sakta hoon
- [ ] Live tracking ka flow (Redis GEO, pub/sub, WebSocket) explain kar sakta hoon
- [ ] ETA ke components bata sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
