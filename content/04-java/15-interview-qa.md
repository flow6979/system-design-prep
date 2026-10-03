---
title: Java Interview Rapid-fire
order: 15
time: 25
---

# Java Interview Rapid-fire

Interview se ek din pehle ye file padho. Har sawal ka 2–4 line ka jawab hai, wahi bolo. Output prediction wale sawal pe pehle jawab khud socho, phir padho. Detail ke liye har topic ki apni file hai.

## ⭐ Core Java

### Q: JDK, JRE aur JVM me kya farak hai?
JVM bytecode chalata hai (interpreter + JIT + GC). JRE = JVM + core libraries, sirf chalane ke liye. JDK = JRE + tools (`javac`, `jar`, `jstack`), develop karne ke liye. Java 11 se alag JRE download nahi aata.

### Q: Java pass-by-value hai ya pass-by-reference?
Hamesha **pass-by-value**. Object ke case me reference ki copy jaati hai. Isliye method me `obj.name = "x"` caller ko dikhega, par `obj = new Obj()` nahi dikhega. Do objects ka swap method se nahi ho sakta.

### Q: Output batao (Integer cache)
```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);       // ?
System.out.println(c == d);       // ?
System.out.println(c.equals(d));  // ?
```
`true`, `false`, `true`. Autoboxing `Integer.valueOf()` use karta hai jo -128 se 127 tak cached objects deta hai. 128 pe naye objects bante hain, `==` reference compare karta hai. Wrapper hamesha `equals` se compare karo.

### Q: Output batao (static aur instance init order)
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
Pehli baar: Parent static → Child static → Parent instance block → Parent constructor → Child instance block → Child constructor. Dusri baar static blocks **nahi** chalte (class ek hi baar load hoti hai), sirf baaki 4.

### Q: Output batao: `System.out.println(1 + 2 + "3" + 4 + 5);`
`"3345"`. Left se right: `1 + 2 = 3` (int), phir `3 + "3" = "33"` (String), uske baad sab string concat: `"334"`, `"3345"`.

### Q: `==` aur `equals()` me farak?
`==` primitives me value aur objects me **reference** (same object?) compare karta hai. `equals()` logical equality ke liye hai, class override karti hai (String, Integer, records). Override na kiya to `Object.equals` bhi `==` hi hai.

### Q: `final`, `finally`, `finalize` me farak?
`final`: variable reassign nahi, method override nahi, class extend nahi. `finally`: try ke baad hamesha chalne wala block. `finalize()`: GC se pehle call hone wala method, Java 9 se deprecated, use mat karo (`try-with-resources` / `Cleaner` lo).

### Q: Output batao: `Integer x = null; int y = x;`
`NullPointerException`. Unboxing `x.intValue()` call karta hai. Map se `int count = map.get(key);` me yahi bug aata hai jab key nahi hoti.

## Strings

### Q: String immutable kyun hai?
(1) **String pool**: ek literal kai jagah share hota hai, mutable hota to ek change sab me dikhta. (2) **Security**: file path, URL, DB credentials beech me badal nahi sakte. (3) **Thread-safe** bina lock. (4) `hashCode` cache ho jaata hai, HashMap key ke liye fast.

### Q: Output batao (String ==)
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
`true`, `false`, `true`, `false`, `true`. Literals pool me share hote hain. `new` hamesha naya heap object. `"h" + "i"` compiler hi `"hi"` bana deta hai. `h + "i"` runtime pe naya object. `intern()` pool wala reference deta hai.

### Q: String, StringBuilder, StringBuffer?
String immutable. `StringBuilder` mutable, fast, thread-safe nahi. `StringBuffer` mutable, synchronized (purana, slow). Loop me concat ke liye `StringBuilder` lo, `+=` har baar naya object banata hai (O(n²)).

### Q: `new String("abc")` kitne objects banata hai?
Agar `"abc"` pool me pehle se nahi hai to **2**: ek pool me (literal), ek heap me (`new`). Pool me pehle se hai to **1**.

### Q: String pool kahan hota hai?
Java 7 se **heap** me (pehle PermGen me tha). Isliye pool ke strings bhi GC ho sakte hain. Detail: [Strings](02-strings.md).

## OOP

### Q: Overloading vs overriding?
Overloading: same naam, alag parameters, same class me, **compile time** pe decide (static binding). Overriding: subclass me same signature, **runtime** pe object type se decide (dynamic dispatch). Sirf return type badalne se overloading nahi hoti.

### Q: Abstract class vs interface?
Abstract class: state (fields), constructor, single inheritance, "is-a" with shared code. Interface: contract, multiple implement, Java 8 se default/static methods, par instance state nahi. Capability ke liye interface (`Comparable`), common base ke liye abstract class.

### Q: Static ya private method override kar sakte hain?
Nahi. Static method subclass me same signature se **hide** hota hai (reference type se call decide). Private method subclass ko dikhta hi nahi, same naam ka method naya method hai. `final` method bhi override nahi hota.

### Q: Output batao (field vs method)
```java
class P { String name = "P"; String show() { return "P"; } }
class C extends P { String name = "C"; String show() { return "C"; } }
P p = new C();
System.out.println(p.name + " " + p.show());
```
`"P C"`. Fields polymorphic nahi hote, reference type (`P`) se resolve hote hain. Methods override hote hain, object type (`C`) se chalte hain.

### Q: equals aur hashCode ka contract?
Agar `a.equals(b)` true hai to `a.hashCode() == b.hashCode()` hona **zaroori** hai. Ulta zaroori nahi (collision allowed). Sirf `equals` override kiya to HashMap/HashSet me equal objects alag buckets me jaayenge aur duplicates ban jaayenge.

### Q: Immutable class kaise banate hain?
Class `final`, fields `private final`, setters nahi, constructor me mutable inputs ki defensive copy (`List.copyOf`), getters me bhi copy ya unmodifiable view. Java 16+ me `record` + compact constructor me copy.

## ⭐ Collections

### Q: HashMap internally kaise kaam karta hai?
Array of buckets. `hash(key)` (hashCode ke high bits mix) se index = `(n-1) & hash`. Collision pe bucket me linked list, Java 8 se 8+ nodes (aur table size 64+) pe **red-black tree**, to worst case O(log n). Load factor 0.75 cross hone pe size double aur rehash. Detail: [HashMap, TreeMap & Sets](07-maps-sets.md).

### Q: HashMap vs Hashtable vs ConcurrentHashMap?
HashMap: thread-safe nahi, ek null key allowed. Hashtable: har method synchronized (poora map lock), null nahi, legacy. ConcurrentHashMap: bucket-level locking + CAS, reads lock-free, null nahi. Multi-thread me hamesha ConcurrentHashMap.

### Q: Output batao (HashSet me mutable key)
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
`false`, `false`, `1`. `k` bucket of hash(1) me pada hai, ab hash(2) wale bucket me dhoondha jaata hai. `new Key(1)` sahi bucket me jaata hai par stored object ka id ab 2 hai, `equals` fail. Object "kho" gaya par size 1. Isliye keys immutable rakho.

### Q: ArrayList vs LinkedList?
ArrayList: dynamic array, `get(i)` O(1), end me add amortized O(1), beech me insert O(n), cache friendly. LinkedList: doubly linked, `get(i)` O(n), ends pe add/remove O(1), har node ka extra memory. 95% cases me ArrayList; queue chahiye to `ArrayDeque`.

### Q: Fail-fast vs fail-safe iterator? ConcurrentModificationException kab aata hai?
Fail-fast (ArrayList, HashMap): iterate karte waqt collection structurally modify hua to `modCount` mismatch → `ConcurrentModificationException`. Fail-safe / weakly consistent (CopyOnWriteArrayList, ConcurrentHashMap): copy ya snapshot pe chalte hain, exception nahi. Loop me remove karna ho to `iterator.remove()` ya `removeIf`.

### Q: Comparable vs Comparator?
`Comparable`: class ke andar `compareTo`, ek **natural order** (String, Integer). `Comparator`: bahar, kai alag orders, lambdas ke saath: `Comparator.comparing(Order::amount).reversed().thenComparing(Order::id)`.

### Q: HashMap vs LinkedHashMap vs TreeMap? LRU cache kaise?
HashMap: koi order nahi, O(1). LinkedHashMap: insertion (ya access) order, O(1). TreeMap: sorted keys, O(log n), `floorKey`/`ceilingKey`. LRU: `new LinkedHashMap<>(16, 0.75f, true)` (access order) + `removeEldestEntry` override karo jo `size() > capacity` pe true de.

## Exceptions

### Q: Checked vs unchecked exception?
Checked (`IOException`, `SQLException`): compile time pe handle ya `throws` karna zaroori, recoverable situations. Unchecked (`RuntimeException` ke children: NPE, `IllegalArgumentException`): programming bugs, handle karna zaroori nahi. `Error` (OOM, StackOverflow) JVM level problems, catch mat karo.

### Q: Output batao (finally aur return)
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
`2` aur `1`. `f` me finally ka `return` try ke return ko override kar deta hai (exception bhi nigal leta hai, isliye finally me return mat likho). `g` me return value (1) pehle hi save ho chuki thi, `x = 5` usse nahi badalta.

### Q: finally kabhi nahi chalta?
`System.exit()` call ho, JVM crash ho, ya thread kill ho (process kill -9). Baaki har case me chalta hai, exception aaye ya `return`.

### Q: throw vs throws?
`throw` statement hai jo exception object phenkta hai: `throw new IllegalStateException("x")`. `throws` method signature me batata hai ki ye method kaunse checked exceptions de sakta hai.

### Q: try-with-resources kya hai?
`try (var in = new FileInputStream(f)) { ... }`: block khatam hone pe `close()` automatically, reverse order me. Resource `AutoCloseable` hona chahiye. `close()` me bhi exception aaye to woh **suppressed** ban jaata hai (`e.getSuppressed()`), main exception nahi khota.

## JVM

### Q: Heap vs stack?
Stack: har thread ka apna, method frames, local variables aur references, LIFO, automatic free. Heap: sab threads share karte hain, saare objects, GC se saaf hota hai. Stack full = `StackOverflowError` (deep recursion), heap full = `OutOfMemoryError`.

### Q: Garbage collection kaise kaam karta hai?
GC Roots (stack variables, static fields, active threads) se reachable objects zinda, baaki garbage. Generational: naye objects **Young gen** (Eden → Survivor) me, zyada tar wahin mar jaate hain (minor GC, fast). Bache hue **Old gen** me (major GC). Java 9+ default G1, low pause ke liye ZGC. Detail: [JVM & Memory](11-jvm-memory.md).

### Q: Kya Java me memory leak ho sakta hai?
Haan. GC sirf unreachable objects saaf karta hai. Leak tab hota hai jab objects reachable rehte hain par kaam ke nahi: static `Map` cache jo kabhi saaf nahi hota, listeners unregister nahi kiye, `ThreadLocal` remove nahi kiya, mutable HashMap key.

### Q: ClassLoader hierarchy aur parent delegation?
Bootstrap (core `java.*`) → Platform (Java 9 se, pehle Extension) → Application (classpath). Load request pehle parent ko jaati hai; parent na load kar paaye tab child. Isse koi apni fake `java.lang.String` load nahi kar sakta.

### Q: PermGen aur Metaspace?
Java 8 me PermGen hata ke **Metaspace** aaya, jo class metadata native memory me rakhta hai aur default me auto-grow hota hai. Isliye `OutOfMemoryError: PermGen space` ab nahi aata, par `-XX:MaxMetaspaceSize` na ho to metaspace leak poori RAM kha sakta hai.

## ⭐ Java 8+

### Q: Functional interface kya hai?
Exactly **ek abstract method** wala interface (default/static methods chal jaate hain). Lambda isi ka instance hai. Built-ins: `Function<T,R>`, `Predicate<T>`, `Consumer<T>`, `Supplier<T>`, `BiFunction`. `@FunctionalInterface` compiler check ke liye.

### Q: `map` vs `flatMap`?
`map`: har element ka ek result (1 → 1). `flatMap`: har element ek stream deta hai, sab ko ek flat stream me jod do (1 → many). Example: orders ki list se saare items: `orders.stream().flatMap(o -> o.items().stream())`.

### Q: Intermediate vs terminal operations? Lazy kyun?
Intermediate (`filter`, `map`, `sorted`) naya stream dete hain aur **lazy** hain, kuch nahi chalta. Terminal (`collect`, `forEach`, `count`, `findFirst`) pipeline chalata hai. Laziness se short-circuit hota hai: `filter().findFirst()` pehla match milte hi ruk jaata hai. Stream ek hi baar use ho sakta hai.

### Q: Optional kaise sahi use karein?
Sirf return type ke liye, jab "value nahi bhi ho sakti" batana ho. `orElse` (value hamesha evaluate), `orElseGet` (lazy supplier), `orElseThrow`, `map`, `ifPresent`. Field, parameter ya collection me mat rakho, aur `get()` bina check ke mat chalao.

### Q: Java 17/21 me kya naya hai jo tum use karte ho?
Records (DTOs), sealed classes + pattern matching switch (exhaustive checks), text blocks (SQL/JSON), switch expressions, virtual threads (I/O-bound services). Detail: [Modern Java 8–21](13-modern-java.md).

## ⭐ Concurrency

### Q: `synchronized` vs `volatile`?
`synchronized`: mutual exclusion + visibility, ek time pe ek thread. `volatile`: sirf visibility aur reordering rok, **atomicity nahi**. `volatile int count; count++` abhi bhi race hai; `AtomicInteger` lo.

### Q: `sleep()` vs `wait()`?
`sleep`: `Thread` ka static method, lock **nahi** chhodta, time ke baad khud jaagta hai. `wait`: `Object` ka method, `synchronized` ke andar hi, lock **chhod** deta hai, `notify`/`notifyAll` ya timeout se jaagta hai. `wait` hamesha `while` loop me.

### Q: Runnable vs Callable?
`Runnable.run()` kuch return nahi karta, checked exception nahi phenk sakta. `Callable.call()` value return karta hai aur `Exception` phenk sakta hai. Executor me `submit(callable)` se `Future<T>` milta hai.

### Q: Deadlock kya hai aur kaise bachoge?
Do threads ek dusre ka pakda hua lock maangte hue atak jaayein. Bachao: saare threads locks **ek fixed order** me lein (jaise id se), `tryLock(timeout)` use karo, nested locks kam rakho. Detect: `jstack` thread dump.

### Q: Thread pool kyun? `newFixedThreadPool` me kya risk hai?
Thread banana mehenga hai aur unlimited threads memory/context switch kha jaate hain. Pool threads reuse karta hai aur concurrency limit karta hai. `newFixedThreadPool` ki queue **unbounded** hai, load pe OOM. Production me bounded queue aur rejection policy wala `ThreadPoolExecutor` banao.

### Q: Future vs CompletableFuture?
`Future`: sirf `get()` pe block karke result, chaining nahi. `CompletableFuture`: non-blocking chaining (`thenApply`, `thenCompose`), combine (`allOf`, `thenCombine`), error handling (`exceptionally`, `handle`). Custom executor pass karo, warna common ForkJoinPool. Detail: [Concurrency](14-concurrency.md).

## Checklist

- [ ] Integer cache, String ==, `1 + 2 + "3"` jaise output sawal bina galti ke solve kar sakta hoon
- [ ] Static/instance init order aur field vs method polymorphism ka output bata sakta hoon
- [ ] HashMap internals aur mutable key wala HashSet bug samjha sakta hoon
- [ ] equals/hashCode contract aur immutable class banana bata sakta hoon
- [ ] finally + return ka output aur checked vs unchecked ka farak bata sakta hoon
- [ ] Heap vs stack, GC generations aur Java me memory leak ke examples bata sakta hoon
- [ ] Functional interface, `map` vs `flatMap`, lazy streams aur Optional ka sahi use samjha sakta hoon
- [ ] `synchronized` vs `volatile`, `sleep` vs `wait`, deadlock aur thread pool risk pe crisp jawab de sakta hoon
