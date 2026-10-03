**Ek line:** Interview se ek din pehle ka rapid-fire: Core Java, Strings, OOP, Collections, Exceptions, JVM, Java 8+ aur Concurrency ke 2-4 line ke jawab.

- **Pass-by-value:** hamesha value; objects me reference ki copy, to state badle par `obj = new Obj()` caller ko nahi dikhta.
- **Integer cache:** `127 == 127` true, `128 == 128` false; wrappers `equals` se compare karo.
- **`1 + 2 + "3" + 4 + 5`:** `"3345"`; left to right, string aate hi concat.
- **Init order:** Parent static > Child static > Parent instance + constructor > Child instance + constructor; static dobara nahi.
- **Unboxing null:** `Integer x = null; int y = x;` NPE, `int c = map.get(k)` me bhi.
- **Strings:** immutable (pool, security, thread-safe, hashCode cache); `new String("abc")` 1 ya 2 objects; pool heap me.
- **Field vs method:** fields reference type se, methods object type se (`"P C"`).
- **HashMap:** buckets, `(n-1) & hash`, 8+ nodes aur table 64+ pe tree, 0.75 pe resize.
- **Mutable key:** HashSet me key badli to `contains` false, size 1; keys immutable rakho.
- **finally:** `return` in finally try ke return ko override karta hai; sirf `System.exit()`/crash pe nahi chalta.
- **Heap vs stack:** stack per-thread (`StackOverflowError`), heap shared (`OutOfMemoryError`); leak = reachable par useless.
- **Streams:** lazy, single use; `map` 1-to-1, `flatMap` 1-to-many; Optional sirf return type.
- **Concurrency:** `synchronized` = lock + visibility; `volatile` = visibility only; `sleep` lock rakhta hai, `wait` chhodta hai.
- **Thread pool:** `newFixedThreadPool` unbounded queue = OOM risk; bounded `ThreadPoolExecutor`.

**Interview me bolo:** "Short answer pehle, phir ek example: jaise Integer cache me 127 true aur 128 false, kyunki valueOf -128 se 127 cache karta hai."

**Galti mat karna:** "objects pass-by-reference" bolna; `==` se wrappers ya strings compare karna.
