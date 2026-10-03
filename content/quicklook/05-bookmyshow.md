**Ek line:** City > Theatre > Screen > Seat model; seat 10 min hold karo, payment pe confirm, ek seat do logon ko nahi.

- **Requirements:** show list + seat map, hold seats 10 min, pay then CONFIRMED, expire pe release, cancel + refund + notify.
- **Scale:** single process, thread-safe; multi-server ho to Redis `SET NX PX` + DB unique constraint (HLD).
- **Components:** `Show` (movie + screen + time, booked seats yahin), `SeatLockProvider`, `BookingService` (Facade), Pricing/Payment Strategy, `BookingObserver`.
- **Per-show lock over global:** check + put ek `synchronized(showMap)` me; Jawan ka rush Pushpa ko block nahi karta.
- **Per-show over per-seat:** multi-seat me deadlock (A1>A2 vs A2>A1); per-seat ho to ids sort karo.
- **Lazy expiry over cleanup job:** `expiresAt` check se correctness; `purgeExpired()` sirf memory ke liye.
- **Strategy + Factory + Decorator:** pricing/payment pluggable, `WeekendPricing` wrap karke rules stack.
- **Bottleneck:** payment ke beech lock expire; fix `confirm()` pehle lock refresh, phir bhi fail to `commit()` fail, refund + EXPIRED.
- **Senior signal:** double-click Pay (`synchronized(booking)` + PENDING check), `unlock()` sirf apne `userId` ke locks hataye.

**Interview me bolo:** "Seat status show pe track hota hai, seat pe nahi. `hold()` all-or-nothing hai per-show lock me, expiry lazy hai, aur multi-server me Redis lock + DB constraint."

**Galti mat karna:** global lock lagana, ya PENDING cancel me kisi aur ki seat free kar dena.
