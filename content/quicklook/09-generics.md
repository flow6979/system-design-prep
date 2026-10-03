**Ek line:** Generics compile-time type safety dete hain, aur interview me PECS (`extends`/`super`) aur type erasure ke nateeje puchhe jaate hain.

- **Kyun:** `ClassCastException` runtime se compile time pe, no casts, reusable code.
- **Generic method:** `<T>` return type se pehle (`static <T> T first(List<T> l)`); static method class ka `T` use nahi kar sakta.
- **Bounds:** `<T extends X>` se X ke methods call hote hain; multiple bounds `<T extends A & B>`; type parameter pe `super` nahi.
- **Invariance:** `List<Integer>` is not `List<Number>`, warna `Double` add karke list toot jaati.
- **PECS:** read-only = `? extends T` (add sirf null); write-only = `? super T`.
- **Wildcard kahan:** method parameters me, return type me nahi.
- **Erasure:** compile ke baad `T` -> `Object` (ya bound), compiler cast daalta hai; check compile time pe, type info objects se erase.
- **Not allowed:** `new T()`, `new T[n]`, `instanceof List<String>`, `static T`, `List<int>`, generic exception.
- **Overload clash:** `f(List<String>)` aur `f(List<Integer>)` same erasure.
- **Raw type:** type checking band, heap pollution; `List<?>` safe hai, raw `List` nahi.
- **Reflection:** `getGenericSuperclass()` se type mil sakta hai (Gson `TypeToken`).

**Interview me bolo:** "PECS: producer extends, consumer super. `List<? extends Number>` se read karta hu par add nahi, kyunki compiler ko real type pata nahi."

**Galti mat karna:** erasure ko "runtime pe generics kaam nahi karte" bolna; `@SuppressWarnings` poori class pe lagana.
