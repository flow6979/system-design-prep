**Ek line:** Multi-floor lot: gate pe spot assign + ticket, exit pe price + payment, aur do gates ek spot na dein.

- **Requirements:** entry pe compatible spot + ticket; exit pe duration se price, payment, spot free; lot full ho to mana.
- **Scale:** multiple floors, 2+ gates parallel; 10k spots pe per-type free queue se O(1) allocation.
- **Components:** `ParkingLot` (Singleton) > `ParkingFloor` > `ParkingSpot`; `Vehicle` + `VehicleFactory`, `Ticket`, strategies, `DisplayBoard`.
- **Strategy over if-else:** `PricingStrategy` aur `SpotAllocationStrategy` se weekend/floor rule bina `ParkingLot` chhede.
- **Factory over scattered `new`:** gate ko sirf type + plate pata hai; naya vehicle = enum + class + factory case.
- **Observer over polling:** display board / app listeners, naya listener = zero change.
- **CAS over global lock:** `tryOccupy` = `compareAndSet(null, vehicle)`; global `synchronized` bhi sahi par gates serialize.
- **Bottleneck:** Gate A aur B same spot free dekhein, dono assign; fix atomic CAS, haara gate agla spot try kare. DB me `UPDATE ... WHERE vehicle_id IS NULL`.
- **Senior signal:** `Clock` inject, payment fail pe spot free nahi, Singleton ki jagah DI bolna.

**Interview me bolo:** "Pehle entities aur class diagram, phir park/unpark flow, end me do gates ki race `tryOccupy` CAS se handle karunga. Singleton bolunga par production me DI."

**Galti mat karna:** `isFree()` check ko correctness samajhna (wo sasta filter hai, CAS asli guard); `double` ya `Instant.now()` hardcode.
