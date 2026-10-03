**In one line:** A lambda is an object of a functional interface, and a Stream is a lazy pipeline (source > intermediate > terminal) that says "what you want", not "how to loop".

- **Functional interface:** exactly one abstract method; `Function`, `Predicate`, `Consumer`, `Supplier`, `BiFunction`, `UnaryOperator`.
- **Comparator:** is functional because `equals` belongs to Object and does not count.
- **Effectively final:** a lambda captures a copy of the local variable, so it cannot change. Fields are exempt.
- **`this`:** in a lambda it is the enclosing object; in an anonymous class it is the anonymous object.
- **Method refs:** 4 kinds: static, bound instance, unbound instance (`String::toUpperCase`), constructor.
- **Lazy:** nothing runs until a terminal op; elements flow through the pipeline one at a time.
- **Single use:** reusing a stream throws `IllegalStateException`.
- **map vs flatMap:** map is 1-to-1; flatMap is 1-to-many and flattens.
- **Collectors:** `groupingBy`, `partitioningBy`, `toMap` (give a merge function for duplicate keys), `joining`.
- **Optional:** return types only; no `isPresent()+get()`; use `orElseGet` (the `orElse` argument is always evaluated).
- **Parallel:** only for large CPU-bound data with no shared state; not for I/O or small data. Measure first.

**Say in the interview:** "Streams are lazy, run only on a terminal op, and can be consumed once. I keep them sequential by default and go parallel only after measuring."

**Avoid:** adding to an outside list inside `forEach` (side effect, breaks in parallel), use `collect`; calling `opt.get()` unchecked.
