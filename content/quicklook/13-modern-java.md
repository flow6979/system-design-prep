**Ek line:** LTS versions 8/11/17/21 ke headline features (lambdas, `var`, records, sealed, pattern switch, virtual threads) aur "8 se 17/21 upgrade me kya toota" ke jawab ready rakho.

- **LTS:** 8, 11, 17, 21 (aur 25); companies sirf LTS chalati hain; interview me 17/21 focus.
- **Java 8:** lambdas, streams, `Optional`, default methods, `java.time`, `CompletableFuture`.
- **Default methods:** interface evolve karne ke liye; diamond: class wins, specific interface wins, warna `X.super.m()`.
- **Java 9-11:** `List.of`, `var` (10), `isBlank`/`strip`/`repeat`/`lines` (11), `HttpClient`.
- **Switch expression (14):** value return, no fall-through, exhaustive; block se `yield`, `return` nahi.
- **Records (16):** immutable data class, auto `equals`/`hashCode`/`toString`; `List` field ho to `List.copyOf` compact constructor me.
- **Sealed (17):** closed hierarchy; sealed + records + switch = `default` ki zaroorat nahi, naya subtype compile error deta hai.
- **Pattern matching:** `instanceof` (16), `switch` (21); specific case pehle; `case null` ke bina null pe NPE.
- **Virtual threads (21):** I/O-bound ke liye millions of threads; throughput badhta hai, latency nahi; pool mat karo.
- **Pinning:** Java 21 me `synchronized` ke andar blocking carrier pin karta hai; `ReentrantLock` use karo.
- **Upgrade breaks:** Java EE modules (JAXB) hataye, `sun.misc`/reflection band, `javax` > `jakarta` (Spring Boot 3, Java 17+).

**Interview me bolo:** "Hum 17/21 pe hain: DTOs records me, sealed + pattern switch se exhaustive checks, aur I/O-bound services ke liye virtual threads."

**Galti mat karna:** virtual threads ko CPU-bound ke liye ya fixed pool me mat use karna; `isEmpty()` se input validate mat karna, `isBlank()`.
