**Ek line:** Shared data ko mutex/semaphore se protect karo, aur deadlock 4 Coffman conditions se hota hai; sabse aasan tod circular wait hai, lock ordering se.

- **Race condition:** result thread order pe depend; `count++` read-modify-write hai, lock ya atomic/CAS lagao.
- **Check-then-act:** `if (free) book()` poora ek critical section hai, sirf write lock karna kaafi nahi.
- **Mutex vs semaphore:** mutex ka owner hota hai (locking); semaphore counter hai (signaling, N threads).
- **Spinlock vs monitor:** spinlock loop karta hai (chhote critical section); monitor = lock + condition variables.
- **Unlock:** hamesha `finally` mein.
- **Condition variable:** `while` mein wait karo, `if` mein nahi (spurious wakeup).
- **Producer-consumer:** semaphore order matter karta hai; mutex pakad ke wait(empty) mat karo.
- **Readers-writers:** read-heavy data pe RW lock; reader-preference mein writer starve.
- **Coffman conditions:** mutual exclusion, hold and wait, no preemption, circular wait.
- **Lock ordering:** hamesha fixed order (jaise ascending account id); wallet transfer pe turant bolo.
- **Dining philosophers:** resource ordering, max 4 baithao, ya dono fork ya koi nahi.
- **Distributed lock:** multi-instance mein `synchronized` bekaar; Redis/ZooKeeper/etcd/DB row lock.

**Interview me bolo:** "Deadlock tab hota hai jab 4 Coffman conditions ek saath hon; practically circular wait todta hoon, har jagah ek hi lock order rakh ke."

**Galti mat karna:** Mutex aur binary semaphore ko same mat bolo; multi-instance deployment mein JVM lock pe depend mat karo.
