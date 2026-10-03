**In one line:** `String` is immutable (pool, security, hashCode cache, thread-safe), compare with `equals()`, and use `StringBuilder` when building in loops.

- **Why immutable:** pool sharing, security, hashCode caching, thread safety; give these four points.
- **Pool:** literals live in the pool (inside the heap, Java 7+); `new String("a")` always makes a new heap object.
- **new String("abc"):** up to 2 objects; one in the pool (if absent), one on the heap.
- **== vs equals:** `==` compares references, `equals()` content; always `equals()` for strings.
- **Compile-time constants:** `"ja" + "va"` goes to the pool; runtime concatenation makes a new object.
- **StringBuilder vs StringBuffer:** Builder is fast and not thread-safe; Buffer is synchronized and slow, practically never needed.
- **Loop concat:** `s += x` is O(n²), `StringBuilder` is O(n).
- **substring:** O(k), copies the data (since Java 7u6).
- **split:** takes a regex; escape `split(".")` and `split("|")`.
- **char math:** `c - 'a'` gives an index; `'0'`=48, `'A'`=65, `'a'`=97.
- **Frequency:** `int[26]` for lowercase; no hashing, no boxing.

**Say in the interview:** "String is immutable for pool sharing, security, hashCode caching and thread safety. In loops I use `StringBuilder` because `+=` is O(n²)."

**Avoid:** forgetting to assign the result of `s.trim()`; `new StringBuilder('a')` makes capacity 97, not content.
