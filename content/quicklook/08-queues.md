**Ek line:** Roz ke kaam ke liye do hi classes: `ArrayDeque` (stack + queue) aur `PriorityQueue` (heap); top-K, sliding window aur producer-consumer inhi pe bante hain.

- **Queue ops:** `offer`/`poll`/`peek` null/false dete hain; `add`/`remove`/`element` exception. Interview me pehla set likho.
- **ArrayDeque:** circular array, dono ends O(1); stack aur queue dono ka default; null nahi, thread-safe nahi.
- **Stack kyun nahi:** `Vector` pe bana, synchronized, middle `add(index)` allowed; `LinkedList` bhi nahi (node per element).
- **push/pop:** hamesha front pe kaam karte hain; stack aur queue ops mix mat karo.
- **PriorityQueue:** binary heap array me, default min-heap; `offer`/`poll` O(log n), `peek` O(1).
- **Heapify:** `new PriorityQueue<>(coll)` O(n); `remove(Object)` O(n).
- **Max-heap:** `Comparator.reverseOrder()`; `b - a` overflow karta hai.
- **Top-K:** K largest ke liye size-K min-heap, O(n log k), O(k) memory, streaming pe bhi chalta hai.
- **Monotonic deque:** indices store karo (values nahi), decreasing order; sliding window max O(n).
- **BlockingQueue:** `put` full pe, `take` empty pe block; manual `wait/notify` nahi chahiye.
- **Unbounded queue:** `LinkedBlockingQueue` default `MAX_VALUE`, slow consumer = OOM.

**Interview me bolo:** "K largest ke liye size-K min-heap rakhta hu: O(n log k) time, O(k) space. Pehle sort bolta hu, phir heap, aur bonus me Quickselect."

**Galti mat karna:** `PriorityQueue` print karke sorted samajhna; queue me null daalna.
