**In one line:** Protect shared data with mutexes/semaphores; deadlock needs all 4 Coffman conditions, and the easiest to break is circular wait via lock ordering.

- **Race condition:** result depends on thread order; `count++` is read-modify-write, use a lock or atomic/CAS.
- **Check-then-act:** `if (free) book()` is one whole critical section; locking only the write is not enough.
- **Mutex vs semaphore:** a mutex has an owner (locking); a semaphore is a counter (signaling, N threads).
- **Spinlock vs monitor:** a spinlock busy-loops (short sections); a monitor is lock + condition variables.
- **Unlock:** always in `finally`.
- **Condition variable:** wait in a `while`, not an `if` (spurious wakeups).
- **Producer-consumer:** semaphore order matters; never hold the mutex while waiting on empty.
- **Readers-writers:** RW lock for read-heavy data; reader preference can starve writers.
- **Coffman conditions:** mutual exclusion, hold and wait, no preemption, circular wait.
- **Lock ordering:** always one fixed order (e.g. ascending account id); say it for any wallet transfer.
- **Dining philosophers:** resource ordering, seat max 4, or take both forks or none.
- **Distributed lock:** `synchronized` is useless across instances; use Redis/ZooKeeper/etcd/DB row lock.

**Say in the interview:** "Deadlock needs all four Coffman conditions; in practice I break circular wait by always taking locks in one global order."

**Avoid:** Calling a mutex and a binary semaphore the same; relying on a JVM lock in a multi-instance deployment.
