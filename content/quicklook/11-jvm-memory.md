**Ek line:** `javac` bytecode banata hai, JVM use interpret + JIT karta hai, heap/stack/metaspace manage karta hai aur GC unreachable objects hatata hai; leaks tab hote hain jab useless object reachable rehta hai.

- **JDK/JRE/JVM:** JVM bytecode chalata hai; JRE = JVM + libs; JDK = JRE + `javac`, tools. Bytecode platform-independent hai, JVM nahi.
- **JIT:** hot code native ban jaata hai (C1 + C2 tiered); isiliye warm-up time lagta hai.
- **Class loading:** lazy, parent delegation (Bootstrap, Platform, Application); fake `java.lang.String` load nahi hota.
- **Heap:** saare objects + String pool (Java 7+); `OutOfMemoryError`. **Metaspace:** class metadata, native memory (Java 8, PermGen gaya).
- **Stack:** per thread, frames, local primitives/references; deep recursion = `StackOverflowError`.
- **Primitives:** "hamesha stack pe" galat; object ka `int` field heap pe.
- **GC:** GC roots se unreachable = garbage (ref counting nahi, cycles bhi saaf).
- **Generational:** Eden > Survivor > Old; minor GC fast, full GC long pause. G1 default (Java 9+), ZGC low pause.
- **Leaks:** static cache, unregistered listeners, `ThreadLocal` without `remove()`, unclosed resources, mutable keys.
- **Debug:** `-XX:+HeapDumpOnOutOfMemoryError` + Eclipse MAT dominator tree.
- **Flags:** `-Xms`/`-Xmx` same rakho, `-Xss`, `-XX:MaxMetaspaceSize`, containers me `MaxRAMPercentage=75`.
- **finalize():** deprecated; try-with-resources ya `Cleaner` use karo.

**Interview me bolo:** "Java me leak possible hai: GC sirf unreachable objects hatata hai, to static cache ya ThreadLocal jaise reachable-par-useless objects leak karte hain."

**Galti mat karna:** `System.gc()` guarantee nahi, sirf request hai; `-Xss` badhana bahut threads ke saath native memory khaa sakta hai.
