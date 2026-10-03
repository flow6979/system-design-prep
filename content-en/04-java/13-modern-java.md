---
title: Modern Java 8–21
order: 13
time: 22
---

# Modern Java 8–21

Interviewers often ask "What changed after Java 8?" or "Why should we upgrade to Java 17/21?". This file covers the main features of each LTS with short code. Lambdas/streams have their own file: [Lambdas & Streams](12-streams-lambdas.md).

## ⭐ Version timeline (LTS)

**In one line:** Java ships every 6 months, but companies run only on **LTS** (Long Term Support) versions: 8, 11, 17, 21 (and now 25).

| Version | Year | Headline features |
|---|---|---|
| **8 (LTS)** | 2014 | Lambdas, Streams, `Optional`, default methods, `java.time`, `CompletableFuture` |
| 9 | 2017 | Modules (JPMS), `List.of`/`Map.of`, private interface methods, JShell |
| 10 | 2018 | `var` (local type inference) |
| **11 (LTS)** | 2018 | New `String` methods, `HttpClient`, `Files.readString`, run `java Main.java` directly |
| 14 | 2020 | Switch expressions (final), helpful NullPointerException messages |
| 15 | 2020 | Text blocks |
| 16 | 2021 | Records, pattern matching for `instanceof`, `Stream.toList()` |
| **17 (LTS)** | 2021 | Sealed classes, strong encapsulation of JDK internals |
| **21 (LTS)** | 2023 | Virtual threads, pattern matching for `switch`, record patterns, `SequencedCollection` |
| 25 (LTS) | 2025 | Latest LTS. Interviews still focus mostly on 17/21 |

**Interview tip:** say "We are on Java 17/21. We use records, sealed classes, switch patterns and virtual threads daily", and keep a one-line use case ready for each.

**Common mistake:** calling records a Java 17 feature (they became final in 16; 17 is the first LTS that has them). If you do not remember exact versions, say "it was in by 17 LTS".

## ⭐ Lambdas, Streams, Optional (Java 8)

**In one line:** Java 8 brought a functional style: pass a function as a value (lambda), run pipelines over collections (stream), and use `Optional` instead of null.

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    record Order(String city, int amount) {}

    public static void main(String[] args) {
        List<Order> orders = List.of(new Order("Pune", 300), new Order("Delhi", 900), new Order("Pune", 150));

        // total per city
        Map<String, Integer> byCity = orders.stream()
            .collect(Collectors.groupingBy(Order::city, Collectors.summingInt(Order::amount)));
        System.out.println(byCity); // {Delhi=900, Pune=450} (HashMap, order not guaranteed)

        Optional<Order> big = orders.stream().filter(o -> o.amount() > 500).findFirst();
        System.out.println(big.map(Order::city).orElse("none")); // Delhi
    }
}
```

Full detail (functional interfaces, intermediate vs terminal, lazy evaluation, `flatMap`, collectors) is here: [Lambdas & Streams](12-streams-lambdas.md).

**Interview tip:** `Optional` is meant only as a **return type**. Do not use it for fields, method parameters or collection elements.

**Common mistake:** calling `optional.get()` without a check. Use `orElse`, `orElseGet`, `orElseThrow`.

## Default methods (Java 8)

**In one line:** a method with a body inside an interface, so a new method can be added to an interface without breaking old implementations.

This is how Java 8 could add `forEach`, `sort`, `removeIf` to `List`. Since Java 9, interfaces can also have `private` methods (to share common code between default methods).

```java
interface Payment {
    void pay(int amount);
    default void receipt(int amount) { System.out.println("Paid " + amount); }
    static Payment upi() { return amt -> System.out.println("UPI " + amt); }
}

interface Rewards {
    default void receipt(int amount) { System.out.println("Cashback on " + amount); }
}

// Same default method in both interfaces: the class must override it
class PaytmPay implements Payment, Rewards {
    public void pay(int amount) { System.out.println("Paytm " + amount); }
    @Override
    public void receipt(int amount) {
        Payment.super.receipt(amount); // call a specific parent's version
        Rewards.super.receipt(amount);
    }
}
```

**Interview tip:** "How is the diamond problem solved?" Rules: (1) a class method always wins, (2) the more specific interface wins, (3) if there is still a conflict it is a compile error; the class must override and pick with `X.super.m()`.

**Common mistake:** treating default methods as a replacement for abstract classes. Interfaces have no state (instance fields), only constants.

## var (Java 10)

**In one line:** the compiler infers the type of a local variable. This is still **static typing**, not dynamic.

```java
var map = new HashMap<String, List<Integer>>(); // type: HashMap<String, List<Integer>>
for (var e : map.entrySet()) { /* e is a Map.Entry<...> */ }
// var x;            // error: needs an initializer
// var y = null;     // error: type cannot be inferred
// var list = new ArrayList<>(); // compiles, but becomes ArrayList<Object>
```

Only for local variables, for-loop variables and (since Java 11) lambda parameters. Not for fields, method parameters or return types.

**Interview tip:** "var helps readability when the type is already visible on the right side (`new ...`). Where the type is not obvious (`var x = service.get()`), write the explicit type."

**Common mistake:** thinking `var` is dynamic like JavaScript. Once the type is set it cannot change.

## New String methods (Java 11)

**In one line:** small helper methods for everyday string work.

| Method | What it does | Note |
|---|---|---|
| `isBlank()` | true if only whitespace | `isEmpty()` only checks length 0 |
| `strip()` / `stripLeading()` / `stripTrailing()` | Unicode-aware trim | `trim()` only removes ASCII space (<= ` `) |
| `lines()` | `Stream<String>` of lines | handles both `\n` and `\r\n` |
| `repeat(n)` | string n times | `"ab".repeat(3)` = `"ababab"` |

Along with `Files.readString(path)` / `Files.writeString(path, s)` (11), plus `indent`, `transform` in Java 12 and `formatted` in Java 15.

```java
System.out.println("   ".isBlank());            // true
System.out.println(" hi ".strip());   // "hi" (trim() does not remove this em-space)
System.out.println("a\nb\nc".lines().count());   // 3
System.out.println("Order %d: %s".formatted(42, "PAID")); // Java 15
```

**Common mistake:** using `isEmpty()` to validate user input. `"  "` passes; use `isBlank()`.

## HTTP client (Java 11)

**In one line:** built-in `java.net.http.HttpClient` with HTTP/2 and async support. No more need for the old `HttpURLConnection`.

```java
import java.net.URI;
import java.net.http.*;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();   // reuse it, do not create one per call
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.example.com/orders/1"))
            .header("Accept", "application/json")
            .GET().build();

        // sync
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.statusCode() + " " + res.body());

        // async: returns a CompletableFuture
        client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
              .thenApply(HttpResponse::body)
              .thenAccept(System.out::println)
              .join();
    }
}
```

**Interview tip:** in production people use Spring `WebClient`/`RestClient` or OkHttp, but this is the answer to "how would you make an HTTP call without a library?".

## ⭐ Switch expressions (Java 14)

**In one line:** `switch` can now return a value, with `->` arrow syntax, no `break` and no fall-through.

```java
enum Status { PLACED, PAID, SHIPPED, DELIVERED, CANCELLED }

static String label(Status s) {
    return switch (s) {
        case PLACED, PAID -> "Processing";
        case SHIPPED -> "On the way";
        case DELIVERED -> "Done";
        case CANCELLED -> {
            System.out.println("trigger refund");
            yield "Cancelled";          // yield returns a value from a block
        }
    }; // all enum cases covered, so default is not required
}
```

**Interview tip:** a switch **expression** must be exhaustive (all cases or a `default`), else it is a compile error. If a new enum constant is added, the compiler tells you. That is a big win.

**Common mistake:** writing `return` inside the block. A value leaves a switch expression block through `yield`.

## Text blocks (Java 15)

**In one line:** multi-line strings with `"""`, without `\n` and escapes. For JSON, SQL, HTML.

```java
String sql = """
    SELECT id, amount
    FROM orders
    WHERE city = ?
    """;                       // position of the closing """ decides indentation
String json = """
    {"id": %d, "status": "%s"}
    """.formatted(7, "PAID");
```

**Common mistake:** writing text on the same line right after the opening `"""`. Compile error; content starts from the next line.

## ⭐ Records (Java 16)

**In one line:** an immutable data carrier class in one line. The compiler generates `private final` fields, constructor, accessors, `equals`, `hashCode`, `toString`.

**Compact constructor:** a constructor without the parameter list, used for validation or normalization. The compiler assigns the fields at the end by itself.

```java
public class Main {
    record Money(long paise, String currency) {
        Money {                                   // compact constructor
            if (paise < 0) throw new IllegalArgumentException("negative amount");
            currency = currency.toUpperCase();    // you can reassign the parameter
        }
        Money add(Money o) { return new Money(paise + o.paise, currency); } // new object
        static Money inr(long p) { return new Money(p, "INR"); }
    }

    public static void main(String[] args) {
        Money a = new Money(500, "inr");
        Money b = Money.inr(500);
        System.out.println(a);            // Money[paise=500, currency=INR]
        System.out.println(a.equals(b));  // true (value based equals)
        System.out.println(a.paise());    // accessor is named like the field, not getPaise()
    }
}
```

Records are implicitly `final`, cannot extend any class (they implicitly extend `java.lang.Record`), but can implement interfaces. Static fields/methods are allowed, extra instance fields are not.

**Interview tip:** "Record vs Lombok `@Data`?" A record is a language feature, immutable, with no setters. Perfect for DTOs, API responses, map keys and intermediate results in streams.

**Common mistake:** keeping a `List` field in a record and thinking it is fully immutable. The list itself can be mutable: do `items = List.copyOf(items);` in the compact constructor.

## ⭐ Sealed classes (Java 17)

**In one line:** a class/interface decides **who** can extend/implement it. A closed hierarchy.

```java
sealed interface Payment permits Upi, Card, Wallet {}
record Upi(String vpa, long amount) implements Payment {}
record Card(String network, long amount) implements Payment {}
non-sealed class Wallet implements Payment {   // anyone can extend this further
    long amount = 0;
}
```

Every permitted subclass must be `final`, `sealed` or `non-sealed` (records are already `final`). If they are in the same file you can drop `permits`.

**Interview tip:** sealed + records = **algebraic data types**. The win: in a `switch` the compiler knows all subtypes, so no `default` is needed, and if you add a new subtype every switch gives a compile error. Impossible to forget.

**Common mistake:** confusing sealed with `final`. `final` = nobody can extend, sealed = only the listed classes can.

## ⭐ Pattern matching: instanceof (16) and switch (21)

**In one line:** type check + cast in one step. In Java 21, `switch` also matches on types and on fields inside a record (record patterns).

```java
// Old way
if (obj instanceof String) { String s = (String) obj; System.out.println(s.length()); }
// Java 16
if (obj instanceof String s && !s.isBlank()) { System.out.println(s.length()); }
```

```java
// Java 21: on the sealed Payment above
static double fee(Payment p) {
    return switch (p) {
        case Upi u -> 0.0;                                        // UPI is free
        case Card(String network, long amt) when amt > 10_000 -> amt * 0.02; // record pattern + guard
        case Card c -> c.amount() * 0.01;
        case Wallet w -> 5.0;
    };  // sealed, all covered, no default needed
}

static String describe(Object o) {
    return switch (o) {
        case null -> "got null";                // Java 21: null can be a case too
        case Integer i when i > 100 -> "big number";
        case Integer i -> "number " + i;
        case String s -> "string " + s;
        default -> "something else";
    };
}
```

**Interview tip:** case order matters. A specific case (with a `when` guard) must come **before** the general one, else you get a "dominated" compile error.

**Common mistake:** passing null to a pattern switch without `case null`. Like the old switch, it throws `NullPointerException`.

## ⭐ Virtual threads (Java 21)

**In one line:** very lightweight threads managed by the JVM. You can create millions, because on a blocking call (DB, HTTP, sleep) a virtual thread releases its carrier (OS) thread.

Platform thread = 1 OS thread (~1 MB stack, limited to thousands). Virtual thread = a small object on the heap, mounted/unmounted on a few carrier threads (default = CPU cores).

```java
import java.time.Duration;
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        // 10,000 tasks, each blocks on a 1 sec "DB call". Total takes ~1 sec.
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 10_000).forEach(i ->
                executor.submit(() -> {
                    Thread.sleep(Duration.ofSeconds(1)); // blocking: carrier gets freed
                    return i;
                }));
        } // try-with-resources: close() waits for all tasks

        Thread t = Thread.ofVirtual().name("vt-1").start(() -> System.out.println("hello"));
        Thread.startVirtualThread(() -> System.out.println("one more"));
    }
}
```

**When they help / when not:**
- Help: **I/O-bound** work, like a thread-per-request server waiting on DB/HTTP. Write simple blocking code, without reactive (WebFlux) complexity.
- Not: **CPU-bound** work (image processing, heavy math). Cores are the same, virtual threads will not make it faster.
- Do not pool them. Create a new virtual thread per task, it is cheap. If you need a concurrency limit, use a `Semaphore`.
- In Java 21, a blocking call inside a `synchronized` block **pins** the carrier (fixed in Java 24). On 21, prefer `ReentrantLock`.
- Do not keep heavy objects in `ThreadLocal`; millions of threads = millions of copies.

**Interview tip:** "Virtual threads increase throughput, not latency. A single request does not get faster, but one machine handles more concurrent requests." Spring Boot 3.2+: `spring.threads.virtual.enabled=true`.

**Common mistake:** creating a fixed pool of virtual threads (thinking like `newFixedThreadPool`). That defeats their whole point.

For concurrency basics: [Concurrency](14-concurrency.md).

## SequencedCollection (Java 21)

**In one line:** a common interface for collections with a defined order (List, Deque, LinkedHashSet, TreeSet): first/last element and a reversed view.

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();          // "a"  (earlier list.get(0))
list.getLast();           // "c"  (earlier list.get(list.size() - 1))
list.addFirst("z");       // O(n) on ArrayList
list.reversed();          // reversed view, not a copy

LinkedHashMap<String, Integer> m = new LinkedHashMap<>();
m.put("x", 1); m.put("y", 2);
m.firstEntry();           // x=1  (SequencedMap)
m.pollLastEntry();        // removes and returns y=2
```

**Common mistake:** calling `addFirst`/`removeLast` on `List.of(...)` (immutable): `UnsupportedOperationException`.

## ⭐ Upgrading 8 → 17/21: what interviewers ask

**In one line:** keep answers ready for both sides: "why upgrade, and what breaks?"

**Why upgrade:**
- Performance: better GC (G1 default since 9, ZGC/Shenandoah low pause, generational ZGC in Java 21), faster startup, less memory.
- Language: less boilerplate with records, sealed, switch patterns, text blocks.
- Virtual threads: high concurrency with blocking code.
- Ecosystem: Spring Boot 3 needs at least Java 17. Free public support for Java 8 ended long ago.

**What breaks:**
- Java 11 removed Java EE modules: JAXB (`javax.xml.bind`), JAX-WS. You must add them as separate dependencies.
- Java 16/17 strongly encapsulated JDK internals: old libraries using `sun.misc.*` or deep reflection fail. Upgrade the library or use `--add-opens`.
- Spring Boot 3: `javax.*` → `jakarta.*` package rename.
- Nashorn JS engine (15) was removed, and some GC flags (CMS) too.

**How it is done:** first upgrade build tools and libraries (Lombok, Mockito, ASM), check internal API usage with `jdeps`, go in steps 8 → 11 → 17, run tests on both versions in CI.

**Interview tip:** "I migrated from 8 to 17. Most of the time went into upgrading libraries (Lombok, Mockito) and the javax to jakarta rename. The payoff: lower GC pauses and DTOs converted to records."

## Checklist

- [ ] I can name 2–3 headline features of Java 8, 11, 17 and 21
- [ ] I can explain default methods and the diamond conflict rule (`X.super.m()`)
- [ ] I can tell where `var` is allowed and where it is not
- [ ] I can write a switch expression with `yield` and exhaustiveness
- [ ] I can write a record with validation in a compact constructor
- [ ] I can write a sealed interface + records + pattern matching switch (record pattern, `when` guard)
- [ ] I can explain when virtual threads help (I/O-bound) and when not (CPU-bound, pinning)
- [ ] I can tell the benefits of an 8 → 17/21 upgrade and what breaks (JAXB, encapsulation, jakarta)
