**Ek line:** OOP ke 4 pillars sab jaante hain; Java interview me Java-specific rules chalte hain: constructor chaining, overriding rules, default-method diamond, equals/hashCode, immutability.

- **Constructor:** parameterized likhte hi default no-arg gayab; `this()`/`super()` pehla statement, dono saath nahi.
- **Construction order:** parent pehle, phir child.
- **Encapsulation:** data `private`, validation ek jagah; getter se internal mutable `List` mat return karo.
- **Inheritance:** classes me single; interfaces me multiple. Diamond rules: class wins, specific interface wins, warna override + `X.super.m()`.
- **Overload vs override:** overload compile-time, override runtime; override me access same/wider, checked exception narrow.
- **static/private/final:** override nahi hote; static same signature = hiding.
- **Abstract class vs interface:** state + constructor + shared code = abstract class; contract/multiple types = interface.
- **Inner class:** non-static inner outer ka hidden reference rakhta hai (leak); default `static` nested.
- **equals/hashCode:** equal objects ka hash same hona chahiye; dono saath override, same fields se.
- **Immutable class:** `final` class, `private final` fields, no setters, defensive copy.
- **Composition over inheritance:** inheritance sirf is-a ke liye; `Stack extends Vector` JDK ki galti.

**Interview me bolo:** "Static method override nahi hota, hide hota hai, kyunki call reference type se compile time pe bind hoti hai. Aur equals/hashCode hamesha saath override karta hu."

**Galti mat karna:** `@Override` bhoolna (`equals(Dog d)` overload ban jaata hai); HashSet me daale mutable field se hashCode.
