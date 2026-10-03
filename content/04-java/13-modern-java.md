---
title: Modern Java 8–21
order: 13
time: 22
---

# Modern Java 8–21

Interviewer aksar poochta hai "Java 8 ke baad kya naya aaya?" ya "Java 17/21 pe upgrade kyun karein?". Is file me har LTS ke main features hain, chhote code ke saath. Lambdas/streams ke liye alag file hai: [Lambdas & Streams](12-streams-lambdas.md).

## ⭐ Version timeline (LTS)

**Ek line me:** Java har 6 mahine release hota hai, par companies sirf **LTS** (Long Term Support) versions pe chalti hain: 8, 11, 17, 21 (aur ab 25).

| Version | Year | Headline features |
|---|---|---|
| **8 (LTS)** | 2014 | Lambdas, Streams, `Optional`, default methods, `java.time`, `CompletableFuture` |
| 9 | 2017 | Modules (JPMS), `List.of`/`Map.of`, private interface methods, JShell |
| 10 | 2018 | `var` (local type inference) |
| **11 (LTS)** | 2018 | Naye `String` methods, `HttpClient`, `Files.readString`, `java Main.java` direct run |
| 14 | 2020 | Switch expressions (final), helpful NullPointerException messages |
| 15 | 2020 | Text blocks |
| 16 | 2021 | Records, pattern matching for `instanceof`, `Stream.toList()` |
| **17 (LTS)** | 2021 | Sealed classes, strong encapsulation of JDK internals |
| **21 (LTS)** | 2023 | Virtual threads, pattern matching for `switch`, record patterns, `SequencedCollection` |
| 25 (LTS) | 2025 | Latest LTS. Interview me abhi bhi 17/21 hi focus hai |

**Interview tip:** "Hum Java 17/21 pe hain. Records, sealed classes, switch patterns aur virtual threads daily use karte hain" bolo, aur har ek ka ek line use-case ready rakho.

**Common galti:** records ko Java 17 ka feature bolna (final 16 me hua, 17 pehla LTS jisme aaya). Dates exact na yaad hon to "17 LTS tak aa gaya tha" bolo.

## ⭐ Lambdas, Streams, Optional (Java 8)

**Ek line me:** Java 8 ne functional style laaya: function ko value ki tarah pass karo (lambda), collections pe pipeline chalao (stream), aur null ki jagah `Optional` lo.

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    record Order(String city, int amount) {}

    public static void main(String[] args) {
        List<Order> orders = List.of(new Order("Pune", 300), new Order("Delhi", 900), new Order("Pune", 150));

        // city wise total
        Map<String, Integer> byCity = orders.stream()
            .collect(Collectors.groupingBy(Order::city, Collectors.summingInt(Order::amount)));
        System.out.println(byCity); // {Delhi=900, Pune=450} (HashMap, order guaranteed nahi)

        Optional<Order> big = orders.stream().filter(o -> o.amount() > 500).findFirst();
        System.out.println(big.map(Order::city).orElse("none")); // Delhi
    }
}
```

Poori detail (functional interfaces, intermediate vs terminal, lazy evaluation, `flatMap`, collectors) yahan hai: [Lambdas & Streams](12-streams-lambdas.md).

**Interview tip:** `Optional` sirf **return type** ke liye hai. Field, method parameter ya collection element me mat use karo.

**Common galti:** `optional.get()` bina check ke call karna. `orElse`, `orElseGet`, `orElseThrow` use karo.

## Default methods (Java 8)

**Ek line me:** interface me body wala method, taaki purane implementations tode bina interface me naya method add ho sake.

Isi wajah se Java 8 me `List` me `forEach`, `sort`, `removeIf` jaise methods add ho paaye. Java 9 se interface me `private` methods bhi allowed hain (default methods ka common code share karne ke liye).

```java
interface Payment {
    void pay(int amount);
    default void receipt(int amount) { System.out.println("Paid " + amount); }
    static Payment upi() { return amt -> System.out.println("UPI " + amt); }
}

interface Rewards {
    default void receipt(int amount) { System.out.println("Cashback on " + amount); }
}

// Dono interfaces me same default method: class ko override karna padega
class PaytmPay implements Payment, Rewards {
    public void pay(int amount) { System.out.println("Paytm " + amount); }
    @Override
    public void receipt(int amount) {
        Payment.super.receipt(amount); // specific parent ka version call
        Rewards.super.receipt(amount);
    }
}
```

**Interview tip:** "Diamond problem kaise solve hota hai?" Rule: (1) class ka method hamesha jeetta hai, (2) zyada specific interface jeetta hai, (3) phir bhi conflict ho to compile error, class ko override karna padta hai aur `X.super.m()` se choose karna hota hai.

**Common galti:** default methods ko abstract class ka replacement samajhna. Interface me state (instance fields) nahi hoti, sirf constants.

## var (Java 10)

**Ek line me:** local variable ka type compiler khud infer karta hai. Ye still **static typing** hai, dynamic nahi.

```java
var map = new HashMap<String, List<Integer>>(); // type: HashMap<String, List<Integer>>
for (var e : map.entrySet()) { /* e ka type Map.Entry<...> */ }
// var x;            // error: initializer chahiye
// var y = null;     // error: type infer nahi ho sakta
// var list = new ArrayList<>(); // compile hota hai par ArrayList<Object> banega
```

Sirf local variables, for-loop variables aur (Java 11 se) lambda parameters me. Fields, method parameters aur return type me nahi.

**Interview tip:** "var se readability tab badhti hai jab right side pe type already dikh raha ho (`new ...`). Jahan type obvious nahi (`var x = service.get()`), wahan explicit type likho."

**Common galti:** `var` ko JavaScript jaisa dynamic samajhna. Ek baar type set ho gaya to badal nahi sakta.

## New String methods (Java 11)

**Ek line me:** roz ke string kaam ke liye chhote helper methods.

| Method | Kya karta hai | Note |
|---|---|---|
| `isBlank()` | sirf whitespace ho to true | `isEmpty()` sirf length 0 check karta hai |
| `strip()` / `stripLeading()` / `stripTrailing()` | Unicode-aware trim | `trim()` sirf ASCII space (<= ` `) hatata hai |
| `lines()` | `Stream<String>` of lines | `\n`, `\r\n` dono handle |
| `repeat(n)` | string n baar | `"ab".repeat(3)` = `"ababab"` |

Saath me `Files.readString(path)` / `Files.writeString(path, s)` (11) aur Java 12 ka `indent`, `transform`, Java 15 ka `formatted`.

```java
System.out.println("   ".isBlank());            // true
System.out.println(" hi ".strip());   // "hi" (trim() ye em-space nahi hatata)
System.out.println("a\nb\nc".lines().count());   // 3
System.out.println("Order %d: %s".formatted(42, "PAID")); // Java 15
```

**Common galti:** user input validate karte waqt `isEmpty()` use karna. `"  "` pass ho jaayega, `isBlank()` lo.

## HTTP client (Java 11)

**Ek line me:** built-in `java.net.http.HttpClient`, HTTP/2 aur async support ke saath. Purana `HttpURLConnection` ab nahi chahiye.

```java
import java.net.URI;
import java.net.http.*;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();   // reuse karo, har call pe naya mat banao
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.example.com/orders/1"))
            .header("Accept", "application/json")
            .GET().build();

        // sync
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.statusCode() + " " + res.body());

        // async: CompletableFuture return karta hai
        client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
              .thenApply(HttpResponse::body)
              .thenAccept(System.out::println)
              .join();
    }
}
```

**Interview tip:** production me log Spring `WebClient`/`RestClient` ya OkHttp use karte hain, par "bina library ke HTTP call kaise karoge?" ka jawab yahi hai.

## ⭐ Switch expressions (Java 14)

**Ek line me:** `switch` ab value return kar sakta hai, `->` arrow syntax ke saath, bina `break` aur bina fall-through.

```java
enum Status { PLACED, PAID, SHIPPED, DELIVERED, CANCELLED }

static String label(Status s) {
    return switch (s) {
        case PLACED, PAID -> "Processing";
        case SHIPPED -> "On the way";
        case DELIVERED -> "Done";
        case CANCELLED -> {
            System.out.println("refund trigger");
            yield "Cancelled";          // block se value nikalne ke liye yield
        }
    }; // enum ke saare cases cover, isliye default zaroori nahi
}
```

**Interview tip:** switch **expression** exhaustive hona chahiye (sab cases ya `default`), warna compile error. Naya enum constant add hua to compiler bata dega, ye bada fayda hai.

**Common galti:** block ke andar `return` likhna. Switch expression ke block se value `yield` se nikalti hai.

## Text blocks (Java 15)

**Ek line me:** `"""` se multi-line string, bina `\n` aur escape ke. JSON, SQL, HTML ke liye.

```java
String sql = """
    SELECT id, amount
    FROM orders
    WHERE city = ?
    """;                       // closing """ ki position se indentation decide hota hai
String json = """
    {"id": %d, "status": "%s"}
    """.formatted(7, "PAID");
```

**Common galti:** opening `"""` ke turant baad same line pe text likhna. Compile error, content agli line se shuru hota hai.

## ⭐ Records (Java 16)

**Ek line me:** immutable data carrier class ek line me. Compiler `private final` fields, constructor, accessors, `equals`, `hashCode`, `toString` khud banata hai.

**Compact constructor:** parameter list ke bina constructor, validation ya normalization ke liye. Fields ka assignment compiler end me khud karta hai.

```java
public class Main {
    record Money(long paise, String currency) {
        Money {                                   // compact constructor
            if (paise < 0) throw new IllegalArgumentException("negative amount");
            currency = currency.toUpperCase();    // parameter reassign kar sakte ho
        }
        Money add(Money o) { return new Money(paise + o.paise, currency); } // naya object
        static Money inr(long p) { return new Money(p, "INR"); }
    }

    public static void main(String[] args) {
        Money a = new Money(500, "inr");
        Money b = Money.inr(500);
        System.out.println(a);            // Money[paise=500, currency=INR]
        System.out.println(a.equals(b));  // true (value based equals)
        System.out.println(a.paise());    // accessor ka naam field jaisa, getPaise() nahi
    }
}
```

Records: implicitly `final` hain, kisi class ko extend nahi kar sakte (implicitly `java.lang.Record` extend karte hain), par interfaces implement kar sakte hain. Static fields/methods allowed, extra instance fields nahi.

**Interview tip:** "Record vs Lombok `@Data`?" Record language feature hai, immutable hai, setters nahi. DTOs, API responses, map keys, stream ke intermediate results ke liye perfect.

**Common galti:** record me `List` field rakhna aur sochna poora immutable hai. List khud mutable ho sakti hai: compact constructor me `items = List.copyOf(items);` karo.

## ⭐ Sealed classes (Java 17)

**Ek line me:** class/interface decide karta hai ki **kaun** usse extend/implement kar sakta hai. Closed hierarchy.

```java
sealed interface Payment permits Upi, Card, Wallet {}
record Upi(String vpa, long amount) implements Payment {}
record Card(String network, long amount) implements Payment {}
non-sealed class Wallet implements Payment {   // aage koi bhi extend kar sakta hai
    long amount = 0;
}
```

Har permitted subclass ko `final`, `sealed` ya `non-sealed` hona padta hai (records already `final` hain). Same file me ho to `permits` chhod sakte ho.

**Interview tip:** sealed + records = **algebraic data types**. Fayda: `switch` me compiler ko saare subtypes pata hain, to `default` ki zarurat nahi, aur naya subtype add karoge to har switch compile error dega. Bhoolna impossible.

**Common galti:** sealed ko `final` se confuse karna. `final` = koi extend nahi kar sakta, sealed = sirf listed classes kar sakti hain.

## ⭐ Pattern matching: instanceof (16) aur switch (21)

**Ek line me:** type check + cast ek step me. Java 21 me `switch` bhi types aur record ke andar ke fields pe match karta hai (record patterns).

```java
// Purana tareeka
if (obj instanceof String) { String s = (String) obj; System.out.println(s.length()); }
// Java 16
if (obj instanceof String s && !s.isBlank()) { System.out.println(s.length()); }
```

```java
// Java 21: upar wale sealed Payment pe
static double fee(Payment p) {
    return switch (p) {
        case Upi u -> 0.0;                                        // UPI free
        case Card(String network, long amt) when amt > 10_000 -> amt * 0.02; // record pattern + guard
        case Card c -> c.amount() * 0.01;
        case Wallet w -> 5.0;
    };  // sealed hai, sab cover, default nahi chahiye
}

static String describe(Object o) {
    return switch (o) {
        case null -> "null aaya";               // Java 21: null bhi case ban sakta hai
        case Integer i when i > 100 -> "bada number";
        case Integer i -> "number " + i;
        case String s -> "string " + s;
        default -> "kuch aur";
    };
}
```

**Interview tip:** case order matter karta hai. Specific (guard wala `when`) case general se **pehle** aana chahiye, warna "dominated" compile error aata hai.

**Common galti:** pattern switch me `case null` na hone pe null pass karna. Purane switch ki tarah `NullPointerException` aayega.

## ⭐ Virtual threads (Java 21)

**Ek line me:** JVM ke manage kiye bahut halke threads. Lakhon bana sakte ho, kyunki blocking call (DB, HTTP, sleep) pe virtual thread apne carrier (OS) thread ko chhod deta hai.

Platform thread = 1 OS thread (~1 MB stack, thousands tak limit). Virtual thread = heap pe chhota object, kuch carrier threads (default = CPU cores) pe mount/unmount hota hai.

```java
import java.time.Duration;
import java.util.concurrent.*;
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        // 10,000 tasks, har ek 1 sec "DB call" pe block. Total ~1 sec lagega.
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 10_000).forEach(i ->
                executor.submit(() -> {
                    Thread.sleep(Duration.ofSeconds(1)); // blocking: carrier free ho jaata hai
                    return i;
                }));
        } // try-with-resources: close() saare tasks ka wait karta hai

        Thread t = Thread.ofVirtual().name("vt-1").start(() -> System.out.println("hello"));
        Thread.startVirtualThread(() -> System.out.println("ek aur"));
    }
}
```

**Kab help karte hain / kab nahi:**
- Help: **I/O-bound** kaam, jaise thread-per-request server jo DB/HTTP pe wait karta hai. Simple blocking code likho, reactive (WebFlux) jaisi complexity nahi.
- Nahi: **CPU-bound** kaam (image processing, heavy math). Cores utne hi hain, virtual threads se fast nahi hoga.
- Pool mat karo. Har task ke liye naya virtual thread banao, sasta hai. Concurrency limit chahiye to `Semaphore` use karo.
- Java 21 me `synchronized` block ke andar blocking call carrier ko **pin** kar deta hai (Java 24 me fix hua). 21 pe `ReentrantLock` prefer karo.
- `ThreadLocal` me bhaari objects mat rakho, lakhon threads = lakhon copies.

**Interview tip:** "Virtual threads throughput badhate hain, latency nahi. Ek request fast nahi hogi, par ek machine zyada concurrent requests handle karegi." Spring Boot 3.2+ me `spring.threads.virtual.enabled=true`.

**Common galti:** virtual threads ka fixed pool banana (`newFixedThreadPool` jaisa soch ke). Ye unka poora point khatam kar deta hai.

Concurrency basics ke liye: [Concurrency](14-concurrency.md).

## SequencedCollection (Java 21)

**Ek line me:** jin collections ka defined order hai (List, Deque, LinkedHashSet, TreeSet), unke liye common interface: first/last element aur reverse view.

```java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();          // "a"  (pehle list.get(0))
list.getLast();           // "c"  (pehle list.get(list.size() - 1))
list.addFirst("z");       // ArrayList pe O(n)
list.reversed();          // reverse view, copy nahi

LinkedHashMap<String, Integer> m = new LinkedHashMap<>();
m.put("x", 1); m.put("y", 2);
m.firstEntry();           // x=1  (SequencedMap)
m.pollLastEntry();        // y=2 hata ke return
```

**Common galti:** `List.of(...)` (immutable) pe `addFirst`/`removeLast` call karna: `UnsupportedOperationException`.

## ⭐ Upgrading 8 → 17/21: interviewer kya poochta hai

**Ek line me:** "Upgrade kyun karein aur kya tootega?" dono side ka jawab ready rakho.

**Kyun upgrade:**
- Performance: better GC (G1 default since 9, ZGC/Shenandoah low pause, Java 21 generational ZGC), faster startup, kam memory.
- Language: records, sealed, switch patterns, text blocks se kam boilerplate.
- Virtual threads: blocking code ke saath high concurrency.
- Ecosystem: Spring Boot 3 ko minimum Java 17 chahiye. Java 8 ka free public support kab ka khatam.

**Kya tootta hai:**
- Java 11 me Java EE modules hata diye: JAXB (`javax.xml.bind`), JAX-WS. Alag dependency add karni padti hai.
- Java 16/17 me JDK internals strongly encapsulated: purani libraries jo `sun.misc.*` ya deep reflection use karti hain fail. Library upgrade karo ya `--add-opens`.
- Spring Boot 3: `javax.*` → `jakarta.*` package rename.
- Nashorn JS engine (15) hata diya, kuch GC flags (CMS) bhi.

**Kaise karte hain:** pehle build tools aur libraries (Lombok, Mockito, ASM) upgrade karo, `jdeps` se internal API usage dekho, 8 → 11 → 17 step me jao, CI me dono version pe test chalao.

**Interview tip:** "8 se 17 migrate kiya tha. Sabse zyada time libraries upgrade karne me gaya (Lombok, Mockito), aur javax se jakarta rename me. Fayda: GC pauses kam hue aur DTOs records me convert ho gaye."

## Checklist

- [ ] Java 8, 11, 17, 21 ke 2–3 headline features bata sakta hoon
- [ ] Default methods aur diamond conflict ka rule (`X.super.m()`) samjha sakta hoon
- [ ] `var` kahan allowed hai aur kahan nahi bata sakta hoon
- [ ] Switch expression `yield` aur exhaustiveness ke saath likh sakta hoon
- [ ] Compact constructor ke saath validation wala record likh sakta hoon
- [ ] Sealed interface + records + pattern matching switch (record pattern, `when` guard) likh sakta hoon
- [ ] Virtual threads kab help karte hain (I/O-bound) aur kab nahi (CPU-bound, pinning) samjha sakta hoon
- [ ] 8 → 17/21 upgrade ke fayde aur kya tootta hai (JAXB, encapsulation, jakarta) bata sakta hoon
