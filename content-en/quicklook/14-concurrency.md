**In one line:** Threads share memory, so know the tools for races, visibility and deadlocks: `synchronized`, `volatile`, atomics, locks, thread pools, `CompletableFuture` and concurrent collections.

- **Runnable vs Callable:** Runnable returns nothing; Callable returns a value and can throw a checked exception.
- **start vs run:** `start()` creates a new thread; `run()` is a plain method call; `start()` twice throws `IllegalThreadStateException`.
- **States:** NEW, RUNNABLE, BLOCKED (synchronized lock), WAITING, TIMED_WAITING, TERMINATED.
- **sleep vs wait:** sleep keeps the lock (static on Thread); wait releases it (on Object, inside synchronized, in a `while`).
- **Race:** `count++` is 3 steps (read, +1, write); fix with `synchronized`/`AtomicInteger`/a lock.
- **synchronized:** monitor lock + visibility, reentrant; instance (this) and static (Class) locks differ; lock on a `private final Object`.
- **volatile:** visibility + no reordering, not atomicity; `volatile count++` is still a race.
- **Deadlock:** 4 Coffman conditions; fix with a fixed lock order or `tryLock` timeout; detect with `jstack`.
- **ReentrantLock:** `tryLock`, timeout, `Condition`; always `unlock()` in `finally`.
- **Atomics/CAS:** compare-and-swap, lock-free; ABA fixed by `AtomicStampedReference`; high contention use `LongAdder`.
- **Thread pool:** core > queue > max > reject; `newFixedThreadPool` has an unbounded queue that can OOM, build a bounded `ThreadPoolExecutor`.
- **CompletableFuture:** `thenApply` (map), `thenCompose` (flatMap), `thenCombine`, `exceptionally`; pass an executor.
- **Concurrent collections:** `ConcurrentHashMap` (CAS + bucket lock, no nulls); `CopyOnWriteArrayList` for read-heavy; `BlockingQueue` for producer-consumer.
- **Utilities:** `CountDownLatch` (one-time), `CyclicBarrier` (reusable), `Semaphore` (n permits); call `ThreadLocal.remove()` in pools.
- **Singleton:** enum, DCL with `volatile`, or the holder idiom.

**Say in the interview:** "volatile gives visibility, not atomicity, so for a counter I use AtomicInteger. To avoid deadlock I always take locks in one fixed order."

**Avoid:** forgetting `ThreadLocal.remove()` in a pool; using `thenApply` with a future and getting `CompletableFuture<CompletableFuture<T>>`.
