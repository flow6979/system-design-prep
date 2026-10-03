**In one line:** Default to `ArrayList` (1.5x growth, amortized O(1) add); `LinkedList` almost never wins, and `remove(int)` vs `remove(Object)` is a classic trap.

- **ArrayList:** backed by `Object[]`; capacity 10 on first `add`, then `old + old>>1` (10, 15, 22, 33).
- **Amortized O(1):** resizes happen at geometric gaps, so n adds cost O(n) total.
- **Capacity vs size:** `new ArrayList<>(n)` is only capacity, `size()` is 0; `remove` never shrinks the array.
- **LinkedList:** doubly linked; `get(i)` is O(n), poor cache locality, more memory.
- **Middle insert:** still O(n) for LinkedList (walk first); O(1) only when already at the node via iterator.
- **Index loop:** `get(i)` loop on a LinkedList is O(n²); use for-each/iterator.
- **remove(int) vs remove(Object):** on `List<Integer>`, `remove(1)` removes index 1; use `remove(Integer.valueOf(1))` for the value.
- **Safe removal:** `removeIf` is best (one O(n) pass); forward index loop with remove skips elements.
- **subList:** a view; copy with `new ArrayList<>(...)`; delete a range with `subList(a,b).clear()`.
- **Legacy:** avoid `Vector`/`Stack`; use `CopyOnWriteArrayList` for read-heavy thread-safe lists.
- **Rule of thumb:** random access = ArrayList, both ends = `ArrayDeque`.

**Say in the interview:** "ArrayList add is amortized O(1) because capacity grows 1.5x. I almost never use LinkedList since even a middle insert needs an O(n) walk first."

**Avoid:** `(String[]) list.toArray()` throws ClassCastException; `Arrays.asList(int[])` does not give `List<Integer>`.
