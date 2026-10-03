**In one line:** Everyone knows the 4 pillars; Java interviews test Java-specific rules: constructor chaining, overriding rules, default-method diamond, equals/hashCode, immutability.

- **Constructor:** writing any constructor removes the default no-arg one; `this()`/`super()` must be first, so not both.
- **Construction order:** parent first, then child.
- **Encapsulation:** keep data `private`, validate in one place; never return an internal mutable `List`.
- **Inheritance:** single for classes, multiple for interfaces. Diamond rules: class wins, more specific interface wins, else override + `X.super.m()`.
- **Overload vs override:** overload is compile-time, override is runtime; override needs same/wider access, narrower checked exceptions.
- **static/private/final:** cannot be overridden; a static method with the same signature is hiding.
- **Abstract class vs interface:** shared state + constructor + code means abstract class; contract/multiple types means interface.
- **Inner class:** non-static inner holds a hidden outer reference (leak); default to `static` nested.
- **equals/hashCode:** equal objects must have equal hashes; override both together, same fields.
- **Immutable class:** `final` class, `private final` fields, no setters, defensive copies.
- **Composition over inheritance:** inherit only for is-a; `Stack extends Vector` is the JDK's mistake.

**Say in the interview:** "A static method is hidden, not overridden, because the call binds to the reference type at compile time. I always override equals and hashCode together."

**Avoid:** forgetting `@Override` (`equals(Dog d)` is an overload); hashing on a mutable field after adding to a HashSet.
