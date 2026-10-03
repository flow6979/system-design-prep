---
title: Java Interview Rapid-fire
order: 15
time: 25
---

# Java Interview Rapid-fire

Read this file the day before the interview. Each question has a 2–4 line answer; say exactly that. For output prediction questions, work out the answer yourself first, then read. Each topic has its own file for detail.

## ⭐ Core Java

### Q: What is the difference between JDK, JRE and JVM?
The JVM runs bytecode (interpreter + JIT + GC). JRE = JVM + core libraries, only for running. JDK = JRE + tools (`javac`, `jar`, `jstack`), for developing. Since Java 11 there is no separate JRE download.

### Q: Is Java pass-by-value or pass-by-reference?
Always **pass-by-value**. For objects, a copy of the reference is passed. So `obj.name = "x"` inside a method is visible to the caller, but `obj = new Obj()` is not. You cannot swap two objects through a method.

### Q: Predict the output (Integer cache)
```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);       // ?
System.out.println(c == d);       // ?
System.out.println(c.equals(d));  // ?
```
`true`, `false`, `true`. Autoboxing uses `Integer.valueOf()`, which returns cached objects from -128 to 127. At 128 new objects are created, and `==` compares references. Always compare wrappers with `equals`.

### Q: Predict the output (static and instance init order)
```java
class Parent {
    static { System.out.println("Parent static"); }
    { System.out.println("Parent instance block"); }
    Parent() { System.out.println("Parent constructor"); }
}
class Child extends Parent {
    static { System.out.println("Child static"); }
    { System.out.println("Child instance block"); }
    Child() { System.out.println("Child constructor"); }
}
// main: new Child(); new Child();
```
First time: Parent static → Child static → Parent instance block → Parent constructor → Child instance block → Child constructor. The second time static blocks do **not** run (a class is loaded only once), only the other 4.

### Q: Predict the output: `System.out.println(1 + 2 + "3" + 4 + 5);`
`"3345"`. Left to right: `1 + 2 = 3` (int), then `3 + "3" = "33"` (String), after that everything is string concat: `"334"`, `"3345"`.

### Q: Difference between `==` and `equals()`?
`==` compares values for primitives and **references** (same object?) for objects. `equals()` is for logical equality and is overridden by classes (String, Integer, records). If not overridden, `Object.equals` is just `==`.

### Q: Difference between `final`, `finally`, `finalize`?
`final`: variable cannot be reassigned, method cannot be overridden, class cannot be extended. `finally`: block that always runs after try. `finalize()`: method called before GC, deprecated since Java 9, do not use it (use `try-with-resources` / `Cleaner`).

### Q: Predict the output: `Integer x = null; int y = x;`
`NullPointerException`. Unboxing calls `x.intValue()`. This bug shows up in `int count = map.get(key);` when the key is missing.

## Strings

### Q: Why is String immutable?
(1) **String pool**: one literal is shared in many places; if it were mutable, one change would show up everywhere. (2) **Security**: file paths, URLs, DB credentials cannot change midway. (3) **Thread-safe** without locks. (4) `hashCode` can be cached, which makes it fast as a HashMap key.

### Q: Predict the output (String ==)
```java
String a = "hi";
String b = "hi";
String c = new String("hi");
String d = "h" + "i";           // compile-time constant
String h = "h";
String e = h + "i";             // runtime concat
System.out.println(a == b);           // ?
System.out.println(a == c);           // ?
System.out.println(a == d);           // ?
System.out.println(a == e);           // ?
System.out.println(a == c.intern());  // ?
```
`true`, `false`, `true`, `false`, `true`. Literals are shared in the pool. `new` always makes a new heap object. The compiler itself turns `"h" + "i"` into `"hi"`. `h + "i"` creates a new object at runtime. `intern()` returns the pooled reference.

### Q: String, StringBuilder, StringBuffer?
String is immutable. `StringBuilder` is mutable, fast, not thread-safe. `StringBuffer` is mutable and synchronized (old, slow). For concat in a loop use `StringBuilder`; `+=` creates a new object each time (O(n²)).

### Q: How many objects does `new String("abc")` create?
If `"abc"` is not already in the pool, **2**: one in the pool (the literal), one on the heap (`new`). If it is already in the pool, **1**.

### Q: Where is the String pool?
On the **heap** since Java 7 (earlier it was in PermGen). So pooled strings can also be garbage collected. Detail: [Strings](02-strings.md).

## OOP

### Q: Overloading vs overriding?
Overloading: same name, different parameters, in the same class, decided at **compile time** (static binding). Overriding: same signature in a subclass, decided at **runtime** by the object type (dynamic dispatch). Changing only the return type is not overloading.

### Q: Abstract class vs interface?
Abstract class: state (fields), constructor, single inheritance, "is-a" with shared code. Interface: a contract, multiple implementation, default/static methods since Java 8, but no instance state. Use an interface for a capability (`Comparable`), an abstract class for a common base.

### Q: Can we override static or private methods?
No. A static method with the same signature in a subclass is **hidden** (the reference type decides the call). A private method is not even visible to the subclass; a method with the same name is a new method. `final` methods cannot be overridden either.

### Q: Predict the output (field vs method)
```java
class P { String name = "P"; String show() { return "P"; } }
class C extends P { String name = "C"; String show() { return "C"; } }
P p = new C();
System.out.println(p.name + " " + p.show());
```
`"P C"`. Fields are not polymorphic; they resolve by the reference type (`P`). Methods are overridden and run by the object type (`C`).

### Q: What is the equals and hashCode contract?
If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` is **required**. The reverse is not required (collisions are allowed). If you override only `equals`, equal objects go into different buckets in HashMap/HashSet and you get duplicates.

### Q: How do you make an immutable class?
Class `final`, fields `private final`, no setters, defensive copies of mutable inputs in the constructor (`List.copyOf`), and copies or unmodifiable views in getters too. In Java 16+, use a `record` and copy in the compact constructor.

## ⭐ Collections

### Q: How does HashMap work internally?
An array of buckets. `hash(key)` (mixes the high bits of hashCode) gives index = `(n-1) & hash`. On collision, a linked list in the bucket; since Java 8 at 8+ nodes (and table size 64+) it becomes a **red-black tree**, so worst case is O(log n). When the load factor 0.75 is crossed, size doubles and it rehashes. Detail: [HashMap, TreeMap & Sets](07-maps-sets.md).

### Q: HashMap vs Hashtable vs ConcurrentHashMap?
HashMap: not thread-safe, one null key allowed. Hashtable: every method synchronized (whole map locked), no nulls, legacy. ConcurrentHashMap: bucket-level locking + CAS, lock-free reads, no nulls. In multi-threaded code always ConcurrentHashMap.

### Q: Predict the output (mutable key in a HashSet)
```java
class Key {
    int id;
    Key(int id) { this.id = id; }
    @Override public boolean equals(Object o) { return o instanceof Key k && k.id == id; }
    @Override public int hashCode() { return Integer.hashCode(id); }
}
Set<Key> set = new HashSet<>();
Key k = new Key(1);
set.add(k);
k.id = 2;
System.out.println(set.contains(k));          // ?
System.out.println(set.contains(new Key(1))); // ?
System.out.println(set.size());               // ?
```
`false`, `false`, `1`. `k` sits in the bucket for hash(1), but the lookup now goes to the bucket for hash(2). `new Key(1)` goes to the right bucket, but the stored object's id is now 2, so `equals` fails. The object is "lost" but size is 1. That is why keys should be immutable.

### Q: ArrayList vs LinkedList?
ArrayList: dynamic array, `get(i)` O(1), add at end amortized O(1), insert in the middle O(n), cache friendly. LinkedList: doubly linked, `get(i)` O(n), add/remove at the ends O(1), extra memory per node. ArrayList in 95% of cases; for a queue use `ArrayDeque`.

### Q: Fail-fast vs fail-safe iterator? When is ConcurrentModificationException thrown?
Fail-fast (ArrayList, HashMap): if the collection is structurally modified while iterating, `modCount` mismatches → `ConcurrentModificationException`. Fail-safe / weakly consistent (CopyOnWriteArrayList, ConcurrentHashMap): work on a copy or snapshot, no exception. To remove inside a loop, use `iterator.remove()` or `removeIf`.

### Q: Comparable vs Comparator?
`Comparable`: `compareTo` inside the class, one **natural order** (String, Integer). `Comparator`: outside, many different orders, works with lambdas: `Comparator.comparing(Order::amount).reversed().thenComparing(Order::id)`.

### Q: HashMap vs LinkedHashMap vs TreeMap? How do you build an LRU cache?
HashMap: no order, O(1). LinkedHashMap: insertion (or access) order, O(1). TreeMap: sorted keys, O(log n), `floorKey`/`ceilingKey`. LRU: `new LinkedHashMap<>(16, 0.75f, true)` (access order) + override `removeEldestEntry` to return true when `size() > capacity`.

## Exceptions

### Q: Checked vs unchecked exceptions?
Checked (`IOException`, `SQLException`): must be handled or declared with `throws` at compile time; recoverable situations. Unchecked (children of `RuntimeException`: NPE, `IllegalArgumentException`): programming bugs, handling not required. `Error` (OOM, StackOverflow) are JVM-level problems; do not catch them.

### Q: Predict the output (finally and return)
```java
static int f() {
    try { return 1; } finally { return 2; }
}
static int g() {
    int x = 1;
    try { return x; } finally { x = 5; }
}
// println(f()); println(g());
```
`2` and `1`. In `f`, the `return` in finally overrides the try's return (it also swallows exceptions, so never return from finally). In `g`, the return value (1) was already saved; `x = 5` does not change it.

### Q: When does finally not run?
When `System.exit()` is called, the JVM crashes, or the process is killed (kill -9). In every other case it runs, whether there is an exception or a `return`.

### Q: throw vs throws?
`throw` is a statement that throws an exception object: `throw new IllegalStateException("x")`. `throws` in a method signature declares which checked exceptions the method can throw.

### Q: What is try-with-resources?
`try (var in = new FileInputStream(f)) { ... }`: `close()` is called automatically when the block ends, in reverse order. The resource must be `AutoCloseable`. If `close()` also throws, that exception becomes **suppressed** (`e.getSuppressed()`), so the main exception is not lost.

## JVM

### Q: Heap vs stack?
Stack: one per thread, method frames, local variables and references, LIFO, freed automatically. Heap: shared by all threads, all objects, cleaned by GC. Stack full = `StackOverflowError` (deep recursion), heap full = `OutOfMemoryError`.

### Q: How does garbage collection work?
Objects reachable from GC Roots (stack variables, static fields, active threads) are alive; the rest is garbage. Generational: new objects go into **Young gen** (Eden → Survivor), and most die there (minor GC, fast). Survivors move to **Old gen** (major GC). G1 is the default since Java 9; ZGC for low pause. Detail: [JVM & Memory](11-jvm-memory.md).

### Q: Can Java have a memory leak?
Yes. GC only cleans unreachable objects. A leak happens when objects stay reachable but are no longer useful: a static `Map` cache that is never cleared, listeners not unregistered, `ThreadLocal` not removed, a mutable HashMap key.

### Q: ClassLoader hierarchy and parent delegation?
Bootstrap (core `java.*`) → Platform (since Java 9, earlier Extension) → Application (classpath). A load request goes to the parent first; the child loads only if the parent cannot. This stops anyone from loading their own fake `java.lang.String`.

### Q: PermGen and Metaspace?
Java 8 removed PermGen and added **Metaspace**, which keeps class metadata in native memory and auto-grows by default. So `OutOfMemoryError: PermGen space` no longer happens, but without `-XX:MaxMetaspaceSize` a metaspace leak can eat all the RAM.

## ⭐ Java 8+

### Q: What is a functional interface?
An interface with exactly **one abstract method** (default/static methods are fine). A lambda is an instance of it. Built-ins: `Function<T,R>`, `Predicate<T>`, `Consumer<T>`, `Supplier<T>`, `BiFunction`. `@FunctionalInterface` for a compiler check.

### Q: `map` vs `flatMap`?
`map`: one result per element (1 → 1). `flatMap`: each element gives a stream, and all are joined into one flat stream (1 → many). Example: all items from a list of orders: `orders.stream().flatMap(o -> o.items().stream())`.

### Q: Intermediate vs terminal operations? Why lazy?
Intermediate ops (`filter`, `map`, `sorted`) return a new stream and are **lazy**; nothing runs yet. Terminal ops (`collect`, `forEach`, `count`, `findFirst`) run the pipeline. Laziness allows short-circuiting: `filter().findFirst()` stops at the first match. A stream can be used only once.

### Q: How do you use Optional correctly?
Only as a return type, to say "there may be no value". `orElse` (value always evaluated), `orElseGet` (lazy supplier), `orElseThrow`, `map`, `ifPresent`. Do not keep it in fields, parameters or collections, and do not call `get()` without a check.

### Q: What is new in Java 17/21 that you use?
Records (DTOs), sealed classes + pattern matching switch (exhaustive checks), text blocks (SQL/JSON), switch expressions, virtual threads (I/O-bound services). Detail: [Modern Java 8–21](13-modern-java.md).

## ⭐ Concurrency

### Q: `synchronized` vs `volatile`?
`synchronized`: mutual exclusion + visibility, one thread at a time. `volatile`: only visibility and no reordering, **no atomicity**. `volatile int count; count++` is still a race; use `AtomicInteger`.

### Q: `sleep()` vs `wait()`?
`sleep`: static method of `Thread`, does **not** release the lock, wakes by itself after the time. `wait`: method of `Object`, only inside `synchronized`, **releases** the lock, wakes on `notify`/`notifyAll` or timeout. Always call `wait` in a `while` loop.

### Q: Runnable vs Callable?
`Runnable.run()` returns nothing and cannot throw a checked exception. `Callable.call()` returns a value and can throw `Exception`. `submit(callable)` on an executor gives a `Future<T>`.

### Q: What is a deadlock and how do you avoid it?
Two threads get stuck, each asking for the lock the other holds. Avoid: all threads take locks in **one fixed order** (e.g. by id), use `tryLock(timeout)`, keep nested locks to a minimum. Detect: `jstack` thread dump.

### Q: Why a thread pool? What is the risk with `newFixedThreadPool`?
Creating threads is expensive, and unlimited threads eat memory and context switches. A pool reuses threads and limits concurrency. `newFixedThreadPool` has an **unbounded** queue, so under load it can OOM. In production build a `ThreadPoolExecutor` with a bounded queue and a rejection policy.

### Q: Future vs CompletableFuture?
`Future`: result only by blocking on `get()`, no chaining. `CompletableFuture`: non-blocking chaining (`thenApply`, `thenCompose`), combining (`allOf`, `thenCombine`), error handling (`exceptionally`, `handle`). Pass a custom executor, else the common ForkJoinPool is used. Detail: [Concurrency](14-concurrency.md).

## Checklist

- [ ] I can solve output questions like Integer cache, String == and `1 + 2 + "3"` without mistakes
- [ ] I can tell the output of static/instance init order and field vs method polymorphism
- [ ] I can explain HashMap internals and the mutable-key HashSet bug
- [ ] I can explain the equals/hashCode contract and how to make an immutable class
- [ ] I can tell the output of finally + return and the difference between checked and unchecked
- [ ] I can explain heap vs stack, GC generations and examples of memory leaks in Java
- [ ] I can explain functional interfaces, `map` vs `flatMap`, lazy streams and correct Optional use
- [ ] I can give crisp answers on `synchronized` vs `volatile`, `sleep` vs `wait`, deadlock and thread pool risk
