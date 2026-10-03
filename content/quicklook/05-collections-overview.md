**Ek line:** Collections = interfaces (List/Set/Queue/Map) + implementations + utilities; interview me hierarchy, sahi collection chunna, fail-fast iterators aur Comparable vs Comparator puchhte hain.

- **Hierarchy:** `Iterable` > `Collection` > `List`/`Set`/`Queue`; `Map` alag tree, Collection extend nahi karta.
- **Interface type:** variable interface se declare karo, object implementation se.
- **Chunav:** index access = `ArrayList`; unique = `HashSet`; sorted = `TreeSet`/`TreeMap`; stack/queue = `ArrayDeque`; min/max = `PriorityQueue`.
- **Stack:** legacy `Stack` nahi, `ArrayDeque` use karo.
- **Repeated contains:** `List.contains` O(n); bahut lookups ho to `HashSet`.
- **Fail-fast:** `modCount` check se CME; single thread me bhi aata hai (for-each me `list.remove`).
- **Safe remove:** `it.remove()` use karo, `list.remove()` nahi.
- **Fail-safe:** `CopyOnWriteArrayList`, `ConcurrentHashMap` CME nahi dete.
- **List.of:** truly immutable, null nahi, duplicate `Set.of` pe IAE; `unmodifiableList` sirf view.
- **Comparable vs Comparator:** natural order andar (`compareTo`); custom orders bahar (`compare`).
- **Equals/hash:** Hash collections `hashCode`+`equals`, Tree collections `compareTo` pe chalte hain.

**Interview me bolo:** "Map Collection extend nahi karta kyunki Collection single elements ka group hai aur Map pairs ka. Stack ke liye main ArrayDeque use karta hu."

**Galti mat karna:** `Collection` aur `Collections` mix mat karna; CME ko sirf multi-threading ka issue mat samajhna.
