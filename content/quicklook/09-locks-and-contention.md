**Ek line:** Jab bahut log ek hi cheez (last seat, last iPhone) ek saath lein, to sirf ek jeete aur data galat na ho.

- **Root cause:** check aur write ke beech ka gap (race) = double booking.
- **DB unique constraint:** `UNIQUE(show_id, seat_id)`. Hamesha last line of defense; hold nahi karta.
- **Pessimistic lock:** `SELECT ... FOR UPDATE`. High conflict, chhota txn; slow, deadlock risk.
- **Optimistic lock:** `version` column. Kam conflict; high contention me retries.
- **Redis lock:** `SET seat:A5 rahul NX PX 600000`. Temporary hold (10 min payment window).
- **Release:** value check karo (Lua), warna kisi aur ka lock delete ho sakta hai.
- **Hamesha TTL:** crash pe lock apne aap free ho.
- **Defense in depth:** Redis hold + DB constraint final.
- **Extreme contention:** virtual waiting queue, Redis `DECR stock`, ya Kafka partition per item se serialize.
- **Pessimistic lock payment ke dauran 10 min mat pakdo:** DB connections khatam.

**Interview me bolo:** "Seat hold ke liye Redis lock with TTL, taaki payment chhodne pe seat free ho. Final booking DB me unique constraint ke saath, Redis fail bhi ho to double booking nahi."

**Galti mat karna:** Lock pe TTL na lagana, ya sirf Redis lock pe bharosa bina DB constraint ke.
