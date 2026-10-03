**In one line:** A day-before rapid-fire of 2-4 line answers across Core Java, Strings, OOP, Collections, Exceptions, JVM, Java 8+ and Concurrency.

- **Pass-by-value:** always; objects pass a copy of the reference, so state changes show but `obj = new Obj()` does not.
- **Integer cache:** `127 == 127` is true, `128 == 128` is false; compare wrappers with `equals`.
- **`1 + 2 + "3" + 4 + 5`:** `"3345"`; left to right, concatenation starts at the first String.
- **Init order:** Parent static > Child static > Parent instance + constructor > Child instance + constructor; statics run once.
- **Unboxing null:** `Integer x = null; int y = x;` throws NPE, also `int c = map.get(k)`.
- **Strings:** immutable (pool, security, thread-safe, hashCode cache); `new String("abc")` is 1 or 2 objects; pool is on the heap.
- **Field vs method:** fields resolve by reference type, methods by object type (`"P C"`).
- **HashMap:** buckets, `(n-1) & hash`, tree at 8+ nodes with table 64+, resize at 0.75.
- **Mutable key:** mutate a key in a HashSet and `contains` is false but size stays 1; keep keys immutable.
- **finally:** `return` in finally overrides the try's return; it skips only on `System.exit()`/crash.
- **Heap vs stack:** stack is per thread (`StackOverflowError`), heap is shared (`OutOfMemoryError`); a leak is reachable but useless.
- **Streams:** lazy, single use; `map` is 1-to-1, `flatMap` is 1-to-many; Optional is for return types only.
- **Concurrency:** `synchronized` = lock + visibility; `volatile` = visibility only; `sleep` keeps the lock, `wait` releases it.
- **Thread pool:** `newFixedThreadPool` has an unbounded queue (OOM risk); use a bounded `ThreadPoolExecutor`.

**Say in the interview:** "Short answer first, then one example: Integer cache gives true at 127 and false at 128 because valueOf caches -128 to 127."

**Avoid:** saying "objects are pass-by-reference"; comparing wrappers or strings with `==`.
