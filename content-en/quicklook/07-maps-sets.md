**In one line:** HashMap = bucket array + hash spreading + treeify + resize; Sets are built on Maps, and TreeMap/LinkedHashMap/ConcurrentHashMap each have their own use case.

- **put steps:** `hash = h ^ (h>>>16)`, `index = hash & (n-1)`, match in the chain with `equals()`, resize when `size > cap*0.75`.
- **Defaults:** capacity 16, load factor 0.75 (resize after 12 entries), table created lazily.
- **Power of 2:** `&` acts as modulo; on resize an entry stays at `i` or moves to `i + oldCap`.
- **Treeify:** chain of 8+ and table >= 64 becomes a red-black tree; smaller tables resize first.
- **Complexity:** get/put O(1) average, worst O(log n) (Java 8+); `null` key lives in bucket 0.
- **equals/hashCode:** equal objects need equal hashes; a mutated key loses its entry; String is the best key.
- **Methods:** `merge(k,1,Integer::sum)` for frequency; `computeIfAbsent`, `getOrDefault` (does not insert).
- **Iterate:** use `entrySet()`, not `keySet()` + `get`; `map.remove` while iterating throws CME.
- **LinkedHashMap:** `accessOrder=true` + `removeEldestEntry` gives an LRU cache.
- **TreeMap:** red-black, O(log n), `floorKey`/`ceilingKey`; compare 0 means same key; no null key.
- **Sets:** HashSet/LinkedHashSet/TreeSet wrap a Map; use `EnumMap` for enum keys.
- **Concurrent:** HashMap is not thread-safe; `ConcurrentHashMap` (CAS + bucket lock, no nulls), atomic ops via `compute`/`merge`.

**Say in the interview:** "HashMap finds the bucket with `hash & (n-1)`, treeifies a chain beyond 8 when the table is 64+, and doubles at 0.75 load."

**Avoid:** overriding `equals` without `hashCode`; `containsKey` + `put` on ConcurrentHashMap (race), use `putIfAbsent`.
