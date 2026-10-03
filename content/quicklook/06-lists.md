**Ek line:** Default `ArrayList` (1.5x growth, amortized O(1) add); `LinkedList` practically kabhi nahi, aur `remove(int)` vs `remove(Object)` jaisi galtiyan interview me pakadti hain.

- **ArrayList:** andar `Object[]`; capacity 10 pehle `add` pe, phir `old + old>>1` (10, 15, 22, 33).
- **Amortized O(1):** resize geometric gaps pe hota hai, n adds ka total work O(n).
- **Capacity vs size:** `new ArrayList<>(n)` sirf capacity hai, `size()` 0; `remove` array shrink nahi karta.
- **LinkedList:** doubly linked; `get(i)` O(n), cache locality kharab, memory zyada.
- **Middle insert:** LinkedList me bhi O(n) (pehle walk); O(1) sirf iterator pe khade hone par.
- **Index loop:** LinkedList pe `get(i)` loop O(n²); for-each/iterator use karo.
- **remove(int) vs remove(Object):** `List<Integer>` pe `remove(1)` index 1 hatata hai; value ke liye `remove(Integer.valueOf(1))`.
- **Safe removal:** `removeIf` best (O(n) ek pass); forward index loop me remove karo to element skip hota hai.
- **subList:** view hai; copy ke liye `new ArrayList<>(...)`; range delete `subList(a,b).clear()`.
- **Legacy:** `Vector`/`Stack` avoid; read-heavy thread-safe ke liye `CopyOnWriteArrayList`.
- **Kab kya:** random access = ArrayList, dono ends = `ArrayDeque`.

**Interview me bolo:** "ArrayList add amortized O(1) hai kyunki capacity 1.5x badhti hai. LinkedList almost kabhi nahi, kyunki middle insert se pehle bhi O(n) walk lagta hai."

**Galti mat karna:** `(String[]) list.toArray()` ClassCastException deta hai; `Arrays.asList(int[])` `List<Integer>` nahi banata.
