**In one line:** Day to day you need just two classes: `ArrayDeque` (stack + queue) and `PriorityQueue` (heap); top-K, sliding window and producer-consumer are built on them.

- **Queue ops:** `offer`/`poll`/`peek` return false/null; `add`/`remove`/`element` throw. Write the first set in interviews.
- **ArrayDeque:** circular array, O(1) at both ends; default for stack and queue; no nulls, not thread-safe.
- **Why not Stack:** built on `Vector`, synchronized, allows middle `add(index)`; not `LinkedList` either (node per element).
- **push/pop:** always operate on the front; do not mix stack and queue ops.
- **PriorityQueue:** binary heap in an array, min-heap by default; `offer`/`poll` O(log n), `peek` O(1).
- **Heapify:** `new PriorityQueue<>(coll)` is O(n); `remove(Object)` is O(n).
- **Max-heap:** `Comparator.reverseOrder()`; `b - a` overflows.
- **Top-K:** for K largest keep a size-K min-heap, O(n log k), O(k) memory, works on streams.
- **Monotonic deque:** store indices (not values) in decreasing order; sliding window max in O(n).
- **BlockingQueue:** `put` blocks when full, `take` when empty; no manual `wait/notify`.
- **Unbounded queue:** `LinkedBlockingQueue` defaults to `MAX_VALUE`; a slow consumer causes OOM.

**Say in the interview:** "For K largest I keep a size-K min-heap: O(n log k) time, O(k) space. I mention sort first, then heap, then Quickselect as a bonus."

**Avoid:** assuming a printed `PriorityQueue` is sorted; putting null into a queue.
