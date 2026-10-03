**In one line:** A multi-floor lot: assign a spot and ticket at entry, price and pay at exit, and never let two gates take the same spot.

- **Requirements:** at entry assign a compatible spot + ticket; at exit price by duration, pay, free the spot; reject when full.
- **Scale:** multiple floors, 2+ gates in parallel; at 10k spots use a per-type free queue for O(1) allocation.
- **Components:** `ParkingLot` (Singleton) > `ParkingFloor` > `ParkingSpot`; `Vehicle` + `VehicleFactory`, `Ticket`, strategies, `DisplayBoard`.
- **Strategy over if-else:** `PricingStrategy` and `SpotAllocationStrategy` add weekend/floor rules without touching `ParkingLot`.
- **Factory over scattered `new`:** the gate only knows type + plate; a new vehicle is enum + class + factory case.
- **Observer over polling:** display board / app listeners, a new listener needs zero change.
- **CAS over global lock:** `tryOccupy` = `compareAndSet(null, vehicle)`; a global `synchronized` is correct but serializes gates.
- **Bottleneck:** Gates A and B both see a spot free and both assign; fix with atomic CAS, loser tries the next spot. In a DB: `UPDATE ... WHERE vehicle_id IS NULL`.
- **Senior signal:** inject a `Clock`, payment failure keeps the spot occupied, and mention DI instead of a static Singleton.

**Say in the interview:** "Entities and class diagram first, then the park/unpark flow, and finally the two-gate race handled with a `tryOccupy` CAS. I would say Singleton but use DI in production."

**Avoid:** treating the `isFree()` check as correctness (it is a cheap filter, CAS is the guard); using `double` or hardcoded `Instant.now()`.
