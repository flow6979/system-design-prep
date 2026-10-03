**In one line:** LRU = HashMap + doubly linked list: O(1) `get` and `put`, evicting the tail (least recent) when full.

- **Requirements:** `get` refreshes recency, `put` inserts/updates, evict LRU when full, capacity in entries, reject `capacity <= 0`.
- **Scale:** O(1) get/put/evict, space O(capacity); a naive list scan is O(n).
- **Components:** `Node(key, value, prev, next)`, sentinel head/tail, `HashMap<K, Node>`, `LRUCache`, optional `EvictionPolicy`.
- **Map + DLL:** map gives O(1) lookup, DLL gives O(1) move/remove; head = MRU, tail = LRU; node keeps its key to remove from the map on evict.
- **Strategy for policy:** plug LRU/LFU/FIFO; storage + TTL stay the same.
- **Single lock over ReadWriteLock:** `get` also writes; `ConcurrentHashMap` alone does not make map + list atomic.
- **Segmenting:** `hash(key) % N` with per-segment locks; more throughput but only approximate LRU.
- **Bottleneck:** pointer bugs and expired TTL entries hogging capacity; fix by checking unlink order, removing expired entries before evicting, or a sweeper.
- **Senior signal:** LFU structure (`freq -> LinkedHashSet`, `minFreq`), Caffeine in production, mention the `LinkedHashMap` alternative.

**Say in the interview:** "The HashMap returns the node and the doubly linked list reorders it in O(1). For thread-safety I use one ReentrantLock because in LRU even a read is a write."

**Avoid:** forgetting `map.remove(lru.key)` on evict, or not setting `head.next.prev` in `addFirst`.
