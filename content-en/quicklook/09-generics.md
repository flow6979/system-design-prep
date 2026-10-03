**In one line:** Generics give compile-time type safety, and interviews probe PECS (`extends`/`super`) and the consequences of type erasure.

- **Why:** moves `ClassCastException` from runtime to compile time, removes casts, reusable code.
- **Generic method:** `<T>` before the return type (`static <T> T first(List<T> l)`); a static method cannot use the class's `T`.
- **Bounds:** `<T extends X>` lets you call X's methods; multiple bounds `<T extends A & B>`; no `super` on type parameters.
- **Invariance:** `List<Integer>` is not a `List<Number>`, otherwise a `Double` could corrupt the list.
- **PECS:** read-only = `? extends T` (add only null); write-only = `? super T`.
- **Where wildcards go:** method parameters, not return types.
- **Erasure:** after compile `T` becomes `Object` (or its bound), compiler inserts casts; checks happen at compile time, type info is erased from objects.
- **Not allowed:** `new T()`, `new T[n]`, `instanceof List<String>`, `static T`, `List<int>`, generic exceptions.
- **Overload clash:** `f(List<String>)` and `f(List<Integer>)` have the same erasure.
- **Raw types:** no type checking, heap pollution; `List<?>` is safe, raw `List` is not.
- **Reflection:** `getGenericSuperclass()` can recover types (Gson `TypeToken`).

**Say in the interview:** "PECS: producer extends, consumer super. I can read from `List<? extends Number>` but not add, because the compiler does not know the real element type."

**Avoid:** describing erasure as "generics do not work at runtime"; putting `@SuppressWarnings` on a whole class.
