**In one line:** The base of LLD: nouns become classes, verbs become methods, inherit only for true IS-A, otherwise compose.

- **Class/Object:** class is a blueprint, object is the real instance; plain data only, use `record`/`struct`.
- **Encapsulation:** private fields, change only through methods; no blind getters/setters.
- **Abstraction:** show "what", hide "how". Encapsulation hides data, abstraction hides complexity.
- **Inheritance:** only real IS-A; keep hierarchy 2-3 levels; C++ base destructor must be `virtual`.
- **Polymorphism:** overloading = compile-time, overriding = runtime; C++ needs `virtual`.
- **Interface vs Abstract:** capability = interface (default choice); shared state/code = abstract class.
- **Composition over Inheritance:** HAS-A, behaviour behind an interface, injected via constructor; swappable and testable.
- **Association/Aggregation/Composition:** uses / part comes from outside / part dies with owner.
- **Access modifiers:** fields `private`, `protected` sparingly; Java default = package, C++ `class` default = private.

**Say in the interview:** "I pull entities from nouns and methods from verbs. I inherit only for true IS-A, otherwise compose, with behaviour behind an injected interface."

**Avoid:** God classes, or inheriting just to reuse code (`Stack extends ArrayList`).
