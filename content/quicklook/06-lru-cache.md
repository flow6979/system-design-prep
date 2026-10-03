**Ek line:** LRU = HashMap + doubly linked list: `get` aur `put` O(1), full hone pe tail (least recent) evict.

- **Requirements:** `get` recency badhaye, `put` insert/update, full pe LRU evict, capacity count me, `capacity <= 0` reject.
- **Scale:** O(1) get/put/evict, space O(capacity); naive list scan O(n).
- **Components:** `Node(key, value, prev, next)`, sentinel head/tail, `HashMap<K, Node>`, `LRUCache`, optional `EvictionPolicy`.
- **Map + DLL:** map O(1) lookup, DLL O(1) move/remove; head = MRU, tail = LRU; node me key evict pe map se hatane ko.
- **Strategy for policy:** LRU/LFU/FIFO plug; storage + TTL same.
- **Single lock over ReadWriteLock:** `get` bhi write hai; `ConcurrentHashMap` akela map + list atomic nahi karta.
- **Segmenting:** `hash(key) % N` per-segment lock; throughput up, par LRU approximate.
- **Bottleneck:** pointer bugs aur TTL entries capacity gherna; fix unlink order check, evict se pehle expired hatao ya sweeper.
- **Senior signal:** LFU structure (`freq -> LinkedHashSet`, `minFreq`), Caffeine production me, `LinkedHashMap` alternative bolna.

**Interview me bolo:** "HashMap node deta hai, doubly linked list O(1) me reorder karti hai. Thread-safe ke liye ek ReentrantLock, kyunki LRU me read bhi write hai."

**Galti mat karna:** `evict` me `map.remove(lru.key)` bhoolna, ya `addFirst` me `head.next.prev` set na karna.
