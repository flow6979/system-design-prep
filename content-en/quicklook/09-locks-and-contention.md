**In one line:** When many people grab one thing (last seat, last iPhone) at once, exactly one must win and data must stay correct.

- **Root cause:** the gap between check and write (a race) causes double booking.
- **DB unique constraint:** `UNIQUE(show_id, seat_id)`. Always the last line of defense; it does not hold anything.
- **Pessimistic lock:** `SELECT ... FOR UPDATE`. High conflict, short txn; slow, deadlock risk.
- **Optimistic lock:** `version` column. Low conflict; many retries under high contention.
- **Redis lock:** `SET seat:A5 rahul NX PX 600000`. Temporary hold (10 min payment window).
- **Release:** verify the value (Lua), or you may delete someone else's lock.
- **Always set a TTL:** the lock frees itself if the holder crashes.
- **Defense in depth:** Redis hold plus DB constraint as the final check.
- **Extreme contention:** virtual waiting queue, Redis `DECR stock`, or serialize via one Kafka partition per item.
- **Never hold a pessimistic lock for the 10 min payment:** you'll exhaust DB connections.

**Say in the interview:** "Redis lock with TTL for the seat hold, so it frees itself if the user abandons payment. Final booking in DB with a unique constraint, so even if Redis fails there's no double booking."

**Avoid:** A lock with no TTL, or trusting only the Redis lock without a DB constraint.
