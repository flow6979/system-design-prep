---
title: Generics
order: 9
time: 20
---

# Generics

Generics se ek hi code alag-alag types ke saath type-safe chalta hai. Interview me sabse zyada PECS (`? extends` / `? super`) aur type erasure ke consequences poochhe jaate hain.

## ⭐ Why generics

**Ek line me:** generics type errors ko runtime (`ClassCastException`) se compile time pe le aate hain, aur casts hata dete hain.

Java 5 se pehle collections `Object` rakhte the. Kuch bhi daal sakte the, aur nikalte waqt cast karna padta tha. Galat type mila to crash production me.

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Bina generics (raw type): compile ho jaata hai, runtime pe phatta hai
        List raw = new ArrayList();
        raw.add("Paytm");
        raw.add(42);
        try {
            String s = (String) raw.get(1);   // ClassCastException
        } catch (ClassCastException e) {
            System.out.println("Runtime crash: " + e.getMessage());
        }

        // Generics ke saath: galti compile time pe pakdi
        List<String> safe = new ArrayList<>();
        safe.add("Paytm");
        // safe.add(42);                      // compile error
        String t = safe.get(0);               // cast ki zarurat nahi
        System.out.println(t);
    }
}
```

Fayde: **type safety**, **no casts**, **reusable code** (ek `Box<T>` sab types ke liye), aur API ka intent clear (`Map<UserId, Order>`).

**Interview tip:** "Generics kyun?" Teen word bolo: compile-time type safety, casts khatam, reusable algorithms.

**Common galti:** sochna ki generics runtime pe bhi check karte hain. Check sirf compile time pe hota hai (erasure, neeche dekho).

## ⭐ Generic class, interface and method

**Ek line me:** type parameter (`<T>`) class/interface ke naam ke baad ya method ke return type se pehle declare hota hai.

Naming convention: `T` type, `E` element, `K`/`V` key/value, `R` return, `ID` jaise descriptive bhi chalte hain.

```java
import java.util.*;
import java.util.function.Function;

public class Main {
    // Generic interface
    interface Repository<T, ID> {
        void save(T item);
        Optional<T> findById(ID id);
    }

    // Generic class jo interface implement karti hai
    static class InMemoryRepo<T, ID> implements Repository<T, ID> {
        private final Map<ID, T> store = new HashMap<>();
        private final Function<T, ID> idOf;
        InMemoryRepo(Function<T, ID> idOf) { this.idOf = idOf; }
        public void save(T item) { store.put(idOf.apply(item), item); }
        public Optional<T> findById(ID id) { return Optional.ofNullable(store.get(id)); }
    }

    record User(String id, String name) {}
    record Pair<A, B>(A first, B second) {}   // generic record

    // Generic method: <T> return type se pehle
    static <T> void swap(T[] arr, int i, int j) {
        T tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }

    public static void main(String[] args) {
        Repository<User, String> repo = new InMemoryRepo<>(User::id);
        repo.save(new User("u1", "Rahul"));
        System.out.println(repo.findById("u1").map(User::name).orElse("?")); // Rahul

        Pair<String, Integer> p = new Pair<>("IPL", 2024);
        String[] teams = {"CSK", "MI"};
        swap(teams, 0, 1);
        System.out.println(p.first() + " " + Arrays.toString(teams)); // IPL [MI, CSK]
    }
}
```

**Interview tip:** static method class ka `T` use nahi kar sakta (T har object ka alag hai). Static method ko apna `<T>` declare karna padta hai.

**Common galti:** generic method me `<T>` declare karna bhool jaana: `static T first(List<T> l)` compile nahi hoga, `static <T> T first(List<T> l)` likho.

## ⭐ Bounded types

**Ek line me:** `<T extends X>` bolta hai T ya to X hai ya uska subtype, isliye T pe X ke methods call kar sakte ho.

- `extends` class aur interface dono ke liye use hota hai.
- Multiple bounds: `<T extends Number & Comparable<T>>`. Class pehle, phir interfaces.
- Type parameter pe `super` bound **nahi** hota (`<T super X>` invalid). `super` sirf wildcard me.

```java
import java.time.LocalDate;
import java.util.*;

public class Main {
    // T comparable hona chahiye tabhi compareTo call kar sakte hain
    static <T extends Comparable<T>> T max(List<T> list) {
        T best = list.get(0);
        for (T x : list) if (x.compareTo(best) > 0) best = x;
        return best;
    }

    // Flexible version: T ka parent bhi compare kare to chalega
    static <T extends Comparable<? super T>> T maxFlexible(List<T> list) {
        T best = list.get(0);
        for (T x : list) if (x.compareTo(best) > 0) best = x;
        return best;
    }

    // Multiple bounds
    static <T extends Number & Comparable<T>> double larger(T a, T b) {
        return (a.compareTo(b) >= 0 ? a : b).doubleValue();
    }

    public static void main(String[] args) {
        System.out.println(max(List.of(3, 9, 4)));            // 9
        System.out.println(max(List.of("Delhi", "Pune")));     // Pune
        // LocalDate implements Comparable<ChronoLocalDate>, Comparable<LocalDate> nahi
        List<LocalDate> dates = List.of(LocalDate.of(2024, 1, 1), LocalDate.of(2025, 1, 1));
        // max(dates);                                     // compile error
        System.out.println(maxFlexible(dates));            // 2025-01-01
        System.out.println(larger(5, 8));                      // 8.0
    }
}
```

**Interview tip:** `Collections.max` ka signature `<T extends Object & Comparable<? super T>>` hai. `? super T` isliye taaki parent class me defined `compareTo` wale subclasses bhi chalein.

**Common galti:** bound ke bina `x.compareTo(y)` likhna. `T` sirf `Object` jaisa treat hota hai, compile error.

## ⭐ Wildcards and PECS

**Ek line me:** **P**roducer **E**xtends, **C**onsumer **S**uper: collection se sirf padhna hai to `? extends T`, sirf daalna hai to `? super T`.

Pehle samjho **invariance**: `Integer` `Number` ka subtype hai, par `List<Integer>` `List<Number>` ka subtype **nahi** hai. Warna koi `List<Number>` reference se `Double` daal deta aur `List<Integer>` toot jaati.

| Wildcard | Padh sakte ho | Daal sakte ho | Kab |
|---|---|---|---|
| `List<? extends Number>` | `Number` ke roop me | sirf `null` | producer: data nikalna |
| `List<? super Integer>` | sirf `Object` ke roop me | `Integer` (aur subtypes) | consumer: data daalna |
| `List<?>` | `Object` ke roop me | sirf `null` | type matter nahi karta (size, print) |
| `List<T>` | `T` | `T` | dono karna hai |

```java
import java.util.*;

public class Main {
    // Producer: list se padh rahe hain -> extends
    static double sum(List<? extends Number> nums) {
        double s = 0;
        for (Number n : nums) s += n.doubleValue();
        return s;
    }

    // Consumer: list me daal rahe hain -> super
    static void addOrderIds(List<? super Integer> sink) {
        for (int i = 1; i <= 3; i++) sink.add(i);
    }

    // Dono: Collections.copy jaisa
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T x : src) dest.add(x);
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);
        System.out.println(sum(ints) + sum(List.of(1.5, 2.5)));   // 10.0

        List<Number> nums = new ArrayList<>();
        List<Object> objs = new ArrayList<>();
        addOrderIds(nums);
        addOrderIds(objs);
        copy(nums, ints);
        System.out.println(nums);                 // [1, 2, 3, 1, 2, 3]

        // List<Number> bad = ints;               // compile error: invariance
        List<? extends Number> readOnly = ints;   // ok
        // readOnly.add(4);                       // compile error

        // Arrays covariant hain: compile ho jaata hai, runtime pe phatta hai
        Number[] arr = new Integer[2];
        try {
            arr[0] = 1.5;                         // ArrayStoreException
        } catch (ArrayStoreException e) {
            System.out.println("ArrayStoreException");
        }
    }
}
```

**Interview tip:** "`List<? extends Number>` me add kyun nahi kar sakte?" Compiler ko pata nahi asli list `List<Integer>` hai ya `List<Double>`, isliye koi bhi non-null add unsafe hai.

**Common galti:** return type me wildcard daalna (`List<? extends T> get()`). Caller pe bojh padta hai. Wildcards method **parameters** me use karo.

## ⭐ Type erasure

**Ek line me:** compiler generics check karke type info mita deta hai; bytecode me `List<String>` aur `List<Integer>` dono sirf `List` hain.

Erasure kaise hota hai:
- Unbounded `T` → `Object`. Bounded `<T extends Comparable<T>>` → `Comparable`.
- Jahan zarurat ho compiler **cast** daal deta hai (`String s = list.get(0)` → `(String) list.get(0)`).
- Backward compatibility ke liye kiya gaya (Java 5 se pehle wala code chalta rahe).

**Consequences (ye interview me poochhte hain):**

| Allowed nahi | Kyun | Workaround |
|---|---|---|
| `new T()` | runtime pe T pata nahi | `Supplier<T>` ya `Class<T>` pass karo |
| `new T[n]`, `new List<String>[n]` | array ko runtime type chahiye | `Array.newInstance(cls, n)` ya `List` use karo |
| `x instanceof List<String>` | runtime pe `<String>` nahi hai | `x instanceof List<?>` |
| `static T field` | T per-instance hai | static generic method |
| `List<int>` | type args reference types hone chahiye | `List<Integer>` |
| `f(List<String>)` aur `f(List<Integer>)` overload | dono ka erasure `f(List)`, clash | alag naam |
| `class MyEx<T> extends Exception` | catch runtime type se hota hai | non-generic exception |

```java
import java.lang.reflect.Array;
import java.util.*;
import java.util.function.Supplier;

public class Main {
    static <T> T create(Supplier<T> factory) { return factory.get(); }   // new T() ki jagah

    static <T> T[] newArray(Class<T> type, int n) {
        @SuppressWarnings("unchecked")
        T[] arr = (T[]) Array.newInstance(type, n);                      // new T[n] ki jagah
        return arr;
    }

    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());  // true, dono ArrayList

        Object o = a;
        System.out.println(o instanceof List<?>);          // true (List<String> nahi likh sakte)

        StringBuilder sb = create(StringBuilder::new);
        String[] names = newArray(String.class, 3);
        System.out.println(sb.length() + " " + names.length); // 0 3
    }
}
```

**Bridge methods (brief):** erasure ke baad override match nahi hota, to compiler ek synthetic "bridge" method banata hai.

```java
class Price implements Comparable<Price> {
    int paise;
    public int compareTo(Price o) { return Integer.compare(paise, o.paise); }
    // Compiler khud ye bridge add karta hai, kyunki erased interface me compareTo(Object) hai:
    // public int compareTo(Object o) { return compareTo((Price) o); }
}
```

**Interview tip:** "Runtime pe generic type kabhi milta hai?" Objects pe nahi. Par class declaration, field aur method signatures me reflection se milta hai (`getGenericSuperclass()`). Gson/Jackson ka `TypeToken`/`TypeReference` yahi trick hai.

**Common galti:** `List<String>` aur `List<Integer>` ke liye overload likhna. "Same erasure" compile error aata hai.

## ⭐ Raw types

**Ek line me:** bina type argument ke generic type (`List` instead of `List<String>`) raw type hai; ye type checking band kar deta hai aur heap pollution laata hai.

- Sirf purane (Java 5 se pehle) code ke saath compatibility ke liye bache hain.
- Raw type me kuch bhi daal sakte ho; crash baad me, kisi aur jagah hota hai. Debug karna mushkil.
- `List` vs `List<Object>` vs `List<?>`:
  - `List` (raw): koi check nahi, sirf warning.
  - `List<Object>`: kuch bhi add kar sakte ho, par `List<String>` isme assign nahi hoga.
  - `List<?>`: koi bhi list assign ho jaayegi, par add nahi kar sakte (safe read-only).

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Rahul"));
        List raw = names;            // sirf unchecked warning
        raw.add(42);                 // heap pollution: String list me Integer
        System.out.println(names.size());     // 2, abhi tak koi error nahi
        try {
            String s = names.get(1); // compiler ka daala cast yahan fail
        } catch (ClassCastException e) {
            System.out.println("ClassCastException, add ke kaafi baad");
        }

        List<?> any = names;         // safe
        System.out.println(any.get(0));       // Object ke roop me padho
        // any.add("x");             // compile error
    }
}
```

**Interview tip:** "`List<?>` aur raw `List` me fark?" `List<?>` type-safe hai (add block), raw `List` type checking hi band kar deta hai.

**Common galti:** `@SuppressWarnings("unchecked")` poori class pe laga dena. Sirf ek chhote local variable pe lagao, jahan tum sure ho.

## Explicit type arguments and inference

**Ek line me:** compiler zyadatar `T` khud infer kar leta hai; jab nahi kar paata to `Class.<Type>method()` se khud batao.

- Diamond `<>` (Java 7+): `new HashMap<>()` right side ka type left se infer. Java 9+ anonymous classes ke saath bhi.
- Lambda chain me inference fail hota hai, kyunki `.reversed()` call pe target type aage pass nahi hota.

```java
import java.util.*;

public class Main {
    record Order(String id, int eta) {}

    static <T> List<T> repeat(T x, int n) {
        List<T> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(x);
        return out;
    }

    public static void main(String[] args) {
        var empty = Collections.<String>emptyList();   // bina witness ke List<Object> hota
        List<Object> objs = Main.<Object>repeat("x", 2);

        // Comparator.comparingInt(o -> o.eta()).reversed()  -> compile error: o Object hai
        Comparator<Order> byEtaDesc = Comparator.<Order>comparingInt(o -> o.eta()).reversed();
        // Ya method reference: Comparator.comparingInt(Order::eta).reversed()

        List<Order> orders = new ArrayList<>(List.of(new Order("o1", 10), new Order("o2", 25)));
        orders.sort(byEtaDesc);
        System.out.println(empty + " " + objs + " " + orders.get(0).id()); // [] [x, x] o2
    }
}
```

**Interview tip:** `Comparator.comparingInt(o -> ...).reversed()` ka compile error ek classic hai. Fix: explicit `<Order>`, typed lambda `(Order o) -> ...`, ya method reference.

**Common galti:** `Main.<T>repeat(...)` me class/object prefix bhool jaana. Explicit type arg ke saath `<Object>repeat(...)` akela compile nahi hota.

## Recursive generics

**Ek line me:** `<T extends Something<T>>`: type parameter khud ke type se bound hota hai, taaki base class methods subclass type return kar sakein.

Real examples: `Enum<E extends Enum<E>>`, `Comparable<T>` wale bounds, aur inheritance wale **Builder**.

```java
public class Main {
    abstract static class Builder<T extends Builder<T>> {
        protected String name;
        T name(String n) { this.name = n; return self(); }   // subclass type return
        abstract T self();
    }

    static class PizzaBuilder extends Builder<PizzaBuilder> {
        private String size;
        PizzaBuilder size(String s) { this.size = s; return this; }
        @Override PizzaBuilder self() { return this; }
        String build() { return name + " (" + size + ")"; }
    }

    public static void main(String[] args) {
        // name() PizzaBuilder return karta hai, isliye size() chain ho jaata hai
        String pizza = new PizzaBuilder().name("Farmhouse").size("L").build();
        System.out.println(pizza);   // Farmhouse (L)
    }
}
```

**Interview tip:** "`Enum<E extends Enum<E>>` kyun?" Taaki `compareTo(E)` sirf same enum type ke saath ho, kisi aur enum ke saath nahi.

**Common galti:** bina `self()` ke base class me `return (T) this` likhna: unchecked cast warning aur galat subclass pe silent bug.

## ⭐ Common interview questions

**Ek line me:** ye sawal generics round me baar-baar aate hain; jawab ek-do line me ready rakho.

- **`List<Object>` vs `List<?>` vs `List`?** `List<Object>` me sab add ho sakta hai par sirf `List<Object>` assign hogi. `List<?>` me koi bhi list assign, add nahi. Raw `List` me type check hi nahi.
- **`List<Integer>` ko `List<Number>` me pass kar sakte ho?** Nahi, generics invariant hain. `List<? extends Number>` parameter lo.
- **Generic array kyun nahi bana sakte?** Arrays runtime pe apna element type check karte hain (reified, covariant); erasure ke baad T pata nahi, type safety hole ban jaata.
- **`List<int>` kyun nahi?** Erasure T ko `Object` banata hai; primitives `Object` nahi hain. `List<Integer>` (autoboxing cost ke saath).
- **`<T> void f(List<T>)` vs `void f(List<?>)`?** Jab types ko relate karna ho (return T, do params same T, add karna) to `T`. Sirf padhna/size to `?`.
- **Generic exception class bana sakte ho?** Nahi, `Throwable` ki generic subclass allowed nahi (catch runtime type pe hota hai).
- **PECS ek line me?** Producer extends, consumer super. `Collections.copy(List<? super T> dest, List<? extends T> src)`.
- **Static field ka type `T`?** Nahi; class ke saare objects (alag `T` ke saath) ek static field share karte hain.

**Interview tip:** har jawab ke baad ek chhota example bolo (jaise `sum(List<? extends Number>)`), isse samajh dikhti hai.

**Common galti:** erasure ko "generics runtime pe kaam nahi karte" bol dena. Sahi: type **checks** compile time pe, type **info** objects se mita di jaati hai.

## Checklist

- [ ] Generics kyun aaye, raw `List` se `ClassCastException` example ke saath bata sakta hoon
- [ ] Generic class, interface aur `<T>` wala generic method likh sakta hoon
- [ ] `<T extends Comparable<? super T>>` aur multiple bounds samjha sakta hoon
- [ ] PECS rule `sum` aur `copy` example se samjha sakta hoon, aur invariance bata sakta hoon
- [ ] Type erasure ke consequences (`new T()`, generic array, `instanceof`, overload clash) aur workarounds bata sakta hoon
- [ ] Bridge method kya hai aur kyun banta hai, bata sakta hoon
- [ ] Raw type, `List<Object>` aur `List<?>` ka fark bata sakta hoon
- [ ] Explicit type witness (`Comparator.<Order>comparingInt`) kab chahiye, bata sakta hoon
- [ ] Recursive generics wala Builder likh sakta hoon
