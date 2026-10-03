**Ek line:** Threads shared memory pe chalte hain, isliye race condition, visibility aur deadlock ke tools yaad rakho: `synchronized`, `volatile`, atomics, locks, thread pools, `CompletableFuture`, concurrent collections.

- **Runnable vs Callable:** Runnable kuch return nahi karta; Callable value return karta hai aur checked exception throw kar sakta hai.
- **start vs run:** `start()` naya thread; `run()` normal method call; `start()` do baar = `IllegalThreadStateException`.
- **States:** NEW, RUNNABLE, BLOCKED (synchronized lock), WAITING, TIMED_WAITING, TERMINATED.
- **sleep vs wait:** sleep lock nahi chhodta (Thread static); wait lock chhodta hai (Object, synchronized ke andar, `while` me).
- **Race:** `count++` 3 steps (read, +1, write); fix: `synchronized`/`AtomicInteger`/lock.
- **synchronized:** monitor lock + visibility, reentrant; instance (this) aur static (Class) ke locks alag; `private final Object lock` use karo.
- **volatile:** visibility + no reordering, atomicity nahi; `volatile count++` race hai.
- **Deadlock:** 4 Coffman conditions; fix: fixed lock order, `tryLock` timeout; detect: `jstack`.
- **ReentrantLock:** `tryLock`, timeout, `Condition`; `unlock()` hamesha `finally` me.
- **Atomics/CAS:** compare-and-swap, lock-free; ABA = `AtomicStampedReference`; high contention = `LongAdder`.
- **Thread pool:** core > queue > max > reject; `newFixedThreadPool` ki unbounded queue OOM kar sakti hai, bounded `ThreadPoolExecutor` banao.
- **CompletableFuture:** `thenApply` (map), `thenCompose` (flatMap), `thenCombine`, `exceptionally`; executor pass karo.
- **Concurrent collections:** `ConcurrentHashMap` (CAS + bucket lock, no nulls); `CopyOnWriteArrayList` read-heavy; `BlockingQueue` producer-consumer.
- **Utilities:** `CountDownLatch` (one-time), `CyclicBarrier` (reusable), `Semaphore` (n permits); `ThreadLocal` me `remove()`.
- **Singleton:** enum, DCL with `volatile`, ya holder idiom.

**Interview me bolo:** "volatile sirf visibility deta hai, atomicity nahi, isliye counter ke liye AtomicInteger. Deadlock se bachne ke liye locks hamesha ek fixed order me leta hu."

**Galti mat karna:** pool me `ThreadLocal.remove()` bhoolna; `thenApply` me future return karke `CompletableFuture<CompletableFuture<T>>` banana.
