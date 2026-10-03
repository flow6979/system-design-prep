**In one line:** `javac` produces bytecode, the JVM interprets + JIT-compiles it and manages heap/stack/metaspace, and GC removes unreachable objects; leaks happen when a useless object stays reachable.

- **JDK/JRE/JVM:** JVM runs bytecode; JRE = JVM + libraries; JDK = JRE + `javac` and tools. Bytecode is platform-independent, the JVM is not.
- **JIT:** hot code is compiled to native (C1 + C2 tiered); that is why there is a warm-up time.
- **Class loading:** lazy, parent delegation (Bootstrap, Platform, Application); a fake `java.lang.String` never loads.
- **Heap:** all objects + String pool (Java 7+); `OutOfMemoryError`. **Metaspace:** class metadata in native memory (Java 8 replaced PermGen).
- **Stack:** per thread, frames, local primitives/references; deep recursion gives `StackOverflowError`.
- **Primitives:** "always on the stack" is wrong; an object's `int` field lives on the heap.
- **GC:** unreachable from GC roots means garbage (not ref counting, cycles are collected).
- **Generational:** Eden > Survivor > Old; minor GC is fast, full GC pauses long. G1 is default (Java 9+), ZGC for low pause.
- **Leaks:** static caches, unregistered listeners, `ThreadLocal` without `remove()`, unclosed resources, mutable keys.
- **Debug:** `-XX:+HeapDumpOnOutOfMemoryError` + Eclipse MAT dominator tree.
- **Flags:** keep `-Xms` and `-Xmx` equal, `-Xss`, `-XX:MaxMetaspaceSize`, `MaxRAMPercentage=75` in containers.
- **finalize():** deprecated; use try-with-resources or `Cleaner`.

**Say in the interview:** "Java can leak: GC only frees unreachable objects, so reachable-but-useless ones like a static cache or an unremoved ThreadLocal leak."

**Avoid:** `System.gc()` is only a request, not a guarantee; a large `-Xss` with many threads can exhaust native memory.
