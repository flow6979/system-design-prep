**Ek line:** `String` immutable hai (pool, security, hashCode cache, thread-safe), `equals()` se compare karo, aur loop me build karna ho to `StringBuilder`.

- **Immutable kyun:** pool sharing, security, hashCode caching, thread safety; yahi 4 points bolo.
- **Pool:** literals pool me (heap ke andar, Java 7+); `new String("a")` hamesha naya heap object.
- **new String("abc"):** max 2 objects; ek pool me (agar pehle se na ho), ek heap me.
- **== vs equals:** `==` reference, `equals()` content; strings pe hamesha `equals()`.
- **Compile-time constant:** `"ja" + "va"` pool me; runtime concat naya object.
- **StringBuilder vs StringBuffer:** Builder fast, not thread-safe; Buffer synchronized aur slow, practically kabhi nahi.
- **Loop concat:** `s += x` O(n²), `StringBuilder` O(n).
- **substring:** O(k), copy banata hai (Java 7u6+).
- **split:** regex leta hai; `split(".")`, `split("|")` escape karo.
- **char math:** `c - 'a'` index deta hai; `'0'`=48, `'A'`=65, `'a'`=97.
- **Frequency:** lowercase ho to `int[26]`; no hashing, no boxing.

**Interview me bolo:** "String immutable hai kyunki pool sharing, security, hashCode caching aur thread safety chahiye. Loop me `StringBuilder` use karta hu kyunki `+=` O(n²) hai."

**Galti mat karna:** `s.trim()` ka result assign karna mat bhoolna; `new StringBuilder('a')` capacity 97 ban jaata hai.
