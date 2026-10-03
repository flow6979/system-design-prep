**In one line:** Model City > Theatre > Screen > Seat, hold seats for 10 minutes, confirm on payment, and never sell one seat twice.

- **Requirements:** show list + seat map, hold seats 10 min, pay then CONFIRMED, release on expiry, cancel + refund + notify.
- **Scale:** single process, thread-safe; multi-server needs Redis `SET NX PX` + DB unique constraint (HLD).
- **Components:** `Show` (movie + screen + time, booked seats tracked here), `SeatLockProvider`, `BookingService` (Facade), Pricing/Payment Strategy, `BookingObserver`.
- **Per-show lock over global:** check + put inside one `synchronized(showMap)`; a Jawan rush does not block Pushpa.
- **Per-show over per-seat:** multi-seat booking can deadlock (A1>A2 vs A2>A1); with per-seat locks, sort the ids.
- **Lazy expiry over cleanup job:** the `expiresAt` check gives correctness; `purgeExpired()` is only for memory.
- **Strategy + Factory + Decorator:** pluggable pricing/payment, `WeekendPricing` wraps to stack rules.
- **Bottleneck:** lock expires mid-payment; fix by refreshing the lock in `confirm()` first, and if `commit()` still fails, refund + EXPIRED.
- **Senior signal:** double-click on Pay (`synchronized(booking)` + PENDING check), `unlock()` removes only the caller's `userId` locks.

**Say in the interview:** "Seat status lives on the show, not the seat. `hold()` is all-or-nothing under a per-show lock, expiry is lazy, and for multiple servers I would use a Redis lock plus a DB constraint."

**Avoid:** a global lock, or freeing someone else's seat when cancelling a PENDING booking.
