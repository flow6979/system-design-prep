**Ek line:** HashMap = bucket array + hash spreading + treeify + resize; Sets uske upar bane hain, aur TreeMap/LinkedHashMap/ConcurrentHashMap ke use-cases alag hain.

- **put steps:** `hash = h ^ (h>>>16)`, `index = hash & (n-1)`, chain me `equals()` se match, `size > cap*0.75` pe resize.
- **Defaults:** capacity 16, load factor 0.75 (12 entries pe resize), table lazily banti hai.
- **Power of 2:** `&` modulo jaisa chalta hai; resize pe entry `i` ya `i + oldCap` pe jaati hai.
- **Treeify:** chain 8+ aur table >= 64 pe red-black tree; chhoti table pe pehle resize.
- **Complexity:** get/put O(1) avg, worst O(log n) (Java 8+); `null` key bucket 0 me.
- **equals/hashCode:** equal objects ka hash same; mutable key badli to entry kho jaati hai; String best key.
- **Methods:** `merge(k,1,Integer::sum)` frequency ke liye; `computeIfAbsent`, `getOrDefault` (insert nahi karta).
- **Iterate:** `entrySet()` use karo, `keySet()+get` nahi; iterate me `map.remove` = CME.
- **LinkedHashMap:** `accessOrder=true` + `removeEldestEntry` = LRU cache.
- **TreeMap:** red-black, O(log n), `floorKey`/`ceilingKey`; comparator-0 matlab same key; null key nahi.
- **Sets:** HashSet/LinkedHashSet/TreeSet andar Map hain; `EnumMap` enum keys ke liye.
- **Concurrent:** HashMap thread-safe nahi; `ConcurrentHashMap` (CAS + bucket lock, no nulls), atomic ke liye `compute`/`merge`.

**Interview me bolo:** "HashMap bucket index `hash & (n-1)` se nikalta hai, chain 8 se badi aur table 64+ ho to tree banta hai, 0.75 load pe double resize hota hai."

**Galti mat karna:** `equals` bina `hashCode` override; ConcurrentHashMap pe `containsKey` + `put` (race), `putIfAbsent` use karo.
