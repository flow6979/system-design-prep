**In one line:** Collections = interfaces (List/Set/Queue/Map) + implementations + utilities; interviews ask hierarchy, picking the right collection, fail-fast iterators and Comparable vs Comparator.

- **Hierarchy:** `Iterable` > `Collection` > `List`/`Set`/`Queue`; `Map` is a separate tree and does not extend Collection.
- **Interface type:** declare variables with the interface, create with an implementation.
- **Choosing:** index access = `ArrayList`; unique = `HashSet`; sorted = `TreeSet`/`TreeMap`; stack/queue = `ArrayDeque`; min/max = `PriorityQueue`.
- **Stack:** use `ArrayDeque`, not the legacy `Stack`.
- **Repeated contains:** `List.contains` is O(n); build a `HashSet` for many lookups.
- **Fail-fast:** `modCount` check throws CME; happens in a single thread too (`list.remove` in for-each).
- **Safe remove:** use `it.remove()`, not `list.remove()`.
- **Fail-safe:** `CopyOnWriteArrayList` and `ConcurrentHashMap` do not throw CME.
- **List.of:** truly immutable, no nulls, duplicate in `Set.of` throws IAE; `unmodifiableList` is only a view.
- **Comparable vs Comparator:** natural order inside the class (`compareTo`); custom orders outside (`compare`).
- **Equals/hash:** hash collections use `hashCode`+`equals`, tree collections use `compareTo`.

**Say in the interview:** "Map does not extend Collection because a Collection holds single elements and a Map holds pairs. For a stack I use ArrayDeque."

**Avoid:** mixing up `Collection` and `Collections`; treating CME as only a multi-threading issue.
