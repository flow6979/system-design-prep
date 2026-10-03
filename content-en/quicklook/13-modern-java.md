**In one line:** Know the headline features of LTS 8/11/17/21 (lambdas, `var`, records, sealed, pattern switch, virtual threads) and have ready answers for "what breaks when upgrading 8 to 17/21".

- **LTS:** 8, 11, 17, 21 (and 25); companies run LTS only; interviews focus on 17/21.
- **Java 8:** lambdas, streams, `Optional`, default methods, `java.time`, `CompletableFuture`.
- **Default methods:** evolve interfaces safely; diamond rules: class wins, specific interface wins, else `X.super.m()`.
- **Java 9-11:** `List.of`, `var` (10), `isBlank`/`strip`/`repeat`/`lines` (11), `HttpClient`.
- **Switch expression (14):** returns a value, no fall-through, must be exhaustive; leave a block with `yield`, not `return`.
- **Records (16):** immutable data class with generated `equals`/`hashCode`/`toString`; for a `List` field use `List.copyOf` in the compact constructor.
- **Sealed (17):** closed hierarchy; sealed + records + switch needs no `default` and a new subtype gives a compile error.
- **Pattern matching:** `instanceof` (16), `switch` (21); specific case first; null needs `case null` or it throws NPE.
- **Virtual threads (21):** millions of threads for I/O-bound work; more throughput, not lower latency; do not pool them.
- **Pinning:** on Java 21 blocking inside `synchronized` pins the carrier; prefer `ReentrantLock`.
- **Upgrade breaks:** Java EE modules (JAXB) removed, `sun.misc`/deep reflection blocked, `javax` to `jakarta` (Spring Boot 3 needs Java 17+).

**Say in the interview:** "We are on 17/21: DTOs as records, sealed types with pattern switch for exhaustive checks, and virtual threads for I/O-bound services."

**Avoid:** using virtual threads for CPU-bound work or in a fixed pool; validating input with `isEmpty()` instead of `isBlank()`.
