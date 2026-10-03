---
title: Generics
order: 9
time: 20
---

# Generics

Generics let the same code work type-safely with many types. Interviews mostly probe PECS (`? extends` / `? super`) and the consequences of type erasure.

## ⭐ Why generics

**In one line:** generics move type errors from runtime (`ClassCastException`) to compile time, and remove casts.

Before Java 5, collections held `Object`. You could put anything in and had to cast on the way out. A wrong type meant a crash in production.

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Without generics (raw type): compiles, blows up at runtime
        List raw = new ArrayList();
        raw.add("Paytm");
        raw.add(42);
        try {
            String s = (String) raw.get(1);   // ClassCastException
        } catch (ClassCastException e) {
            System.out.println("Runtime crash: " + e.getMessage());
        }

        // With generics: the mistake is caught at compile time
        List<String> safe = new ArrayList<>();
        safe.add("Paytm");
        // safe.add(42);                      // compile error
        String t = safe.get(0);               // no cast needed
        System.out.println(t);
    }
}
```

Benefits: **type safety**, **no casts**, **reusable code** (one `Box<T>` for all types), and clear API intent (`Map<UserId, Order>`).

**Interview tip:** "Why generics?" Say three things: compile-time type safety, no casts, reusable algorithms.

**Common mistake:** thinking generics are also checked at runtime. Checks happen only at compile time (erasure, see below).

## ⭐ Generic class, interface and method

**In one line:** a type parameter (`<T>`) is declared after a class/interface name, or before a method's return type.

Naming convention: `T` type, `E` element, `K`/`V` key/value, `R` return; descriptive names like `ID` are fine too.

```java
import java.util.*;
import java.util.function.Function;

public class Main {
    // Generic interface
    interface Repository<T, ID> {
        void save(T item);
        Optional<T> findById(ID id);
    }

    // Generic class implementing the interface
    static class InMemoryRepo<T, ID> implements Repository<T, ID> {
        private final Map<ID, T> store = new HashMap<>();
        private final Function<T, ID> idOf;
        InMemoryRepo(Function<T, ID> idOf) { this.idOf = idOf; }
        public void save(T item) { store.put(idOf.apply(item), item); }
        public Optional<T> findById(ID id) { return Optional.ofNullable(store.get(id)); }
    }

    record User(String id, String name) {}
    record Pair<A, B>(A first, B second) {}   // generic record

    // Generic method: <T> before the return type
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

**Interview tip:** a static method cannot use the class's `T` (T differs per instance). A static method must declare its own `<T>`.

**Common mistake:** forgetting to declare `<T>` on a generic method: `static T first(List<T> l)` won't compile; write `static <T> T first(List<T> l)`.

## ⭐ Bounded types

**In one line:** `<T extends X>` says T is X or a subtype of X, so you can call X's methods on T.

- `extends` is used for both classes and interfaces.
- Multiple bounds: `<T extends Number & Comparable<T>>`. Class first, then interfaces.
- Type parameters have **no** `super` bound (`<T super X>` is invalid). `super` exists only on wildcards.

```java
import java.time.LocalDate;
import java.util.*;

public class Main {
    // T must be comparable so we can call compareTo
    static <T extends Comparable<T>> T max(List<T> list) {
        T best = list.get(0);
        for (T x : list) if (x.compareTo(best) > 0) best = x;
        return best;
    }

    // Flexible version: also works if a parent of T does the comparing
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
        // LocalDate implements Comparable<ChronoLocalDate>, not Comparable<LocalDate>
        List<LocalDate> dates = List.of(LocalDate.of(2024, 1, 1), LocalDate.of(2025, 1, 1));
        // max(dates);                                     // compile error
        System.out.println(maxFlexible(dates));            // 2025-01-01
        System.out.println(larger(5, 8));                      // 8.0
    }
}
```

**Interview tip:** `Collections.max` is declared as `<T extends Object & Comparable<? super T>>`. The `? super T` lets subclasses whose `compareTo` is defined in a parent class work.

**Common mistake:** calling `x.compareTo(y)` without a bound. `T` is treated like `Object`, so it's a compile error.

## ⭐ Wildcards and PECS

**In one line:** **P**roducer **E**xtends, **C**onsumer **S**uper: if you only read from a collection use `? extends T`, if you only put into it use `? super T`.

First understand **invariance**: `Integer` is a subtype of `Number`, but `List<Integer>` is **not** a subtype of `List<Number>`. Otherwise someone could add a `Double` through a `List<Number>` reference and break the `List<Integer>`.

| Wildcard | Can read | Can add | When |
|---|---|---|---|
| `List<? extends Number>` | as `Number` | only `null` | producer: taking data out |
| `List<? super Integer>` | only as `Object` | `Integer` (and subtypes) | consumer: putting data in |
| `List<?>` | as `Object` | only `null` | type doesn't matter (size, print) |
| `List<T>` | `T` | `T` | you need both |

```java
import java.util.*;

public class Main {
    // Producer: reading from the list -> extends
    static double sum(List<? extends Number> nums) {
        double s = 0;
        for (Number n : nums) s += n.doubleValue();
        return s;
    }

    // Consumer: adding to the list -> super
    static void addOrderIds(List<? super Integer> sink) {
        for (int i = 1; i <= 3; i++) sink.add(i);
    }

    // Both: like Collections.copy
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

        // Arrays are covariant: compiles, blows up at runtime
        Number[] arr = new Integer[2];
        try {
            arr[0] = 1.5;                         // ArrayStoreException
        } catch (ArrayStoreException e) {
            System.out.println("ArrayStoreException");
        }
    }
}
```

**Interview tip:** "Why can't you add to `List<? extends Number>`?" The compiler doesn't know whether the real list is `List<Integer>` or `List<Double>`, so any non-null add is unsafe.

**Common mistake:** using wildcards in return types (`List<? extends T> get()`). It burdens the caller. Use wildcards in method **parameters**.

## ⭐ Type erasure

**In one line:** the compiler checks generics and then erases the type info; in bytecode both `List<String>` and `List<Integer>` are just `List`.

How erasure works:
- Unbounded `T` → `Object`. Bounded `<T extends Comparable<T>>` → `Comparable`.
- The compiler inserts **casts** where needed (`String s = list.get(0)` → `(String) list.get(0)`).
- Done for backward compatibility (so pre-Java 5 code keeps running).

**Consequences (interviewers ask these):**

| Not allowed | Why | Workaround |
|---|---|---|
| `new T()` | T is unknown at runtime | pass a `Supplier<T>` or `Class<T>` |
| `new T[n]`, `new List<String>[n]` | arrays need a runtime type | `Array.newInstance(cls, n)` or use a `List` |
| `x instanceof List<String>` | `<String>` doesn't exist at runtime | `x instanceof List<?>` |
| `static T field` | T is per-instance | static generic method |
| `List<int>` | type args must be reference types | `List<Integer>` |
| overload `f(List<String>)` and `f(List<Integer>)` | both erase to `f(List)`, clash | different names |
| `class MyEx<T> extends Exception` | catch works on runtime type | non-generic exception |

```java
import java.lang.reflect.Array;
import java.util.*;
import java.util.function.Supplier;

public class Main {
    static <T> T create(Supplier<T> factory) { return factory.get(); }   // instead of new T()

    static <T> T[] newArray(Class<T> type, int n) {
        @SuppressWarnings("unchecked")
        T[] arr = (T[]) Array.newInstance(type, n);                      // instead of new T[n]
        return arr;
    }

    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());  // true, both ArrayList

        Object o = a;
        System.out.println(o instanceof List<?>);          // true (can't write List<String>)

        StringBuilder sb = create(StringBuilder::new);
        String[] names = newArray(String.class, 3);
        System.out.println(sb.length() + " " + names.length); // 0 3
    }
}
```

**Bridge methods (brief):** after erasure an override may no longer match, so the compiler generates a synthetic "bridge" method.

```java
class Price implements Comparable<Price> {
    int paise;
    public int compareTo(Price o) { return Integer.compare(paise, o.paise); }
    // The compiler adds this bridge itself, because the erased interface has compareTo(Object):
    // public int compareTo(Object o) { return compareTo((Price) o); }
}
```

**Interview tip:** "Is the generic type ever available at runtime?" Not on objects. But it is available via reflection on class declarations, fields and method signatures (`getGenericSuperclass()`). Gson/Jackson's `TypeToken`/`TypeReference` use exactly this trick.

**Common mistake:** writing overloads for `List<String>` and `List<Integer>`. You get a "same erasure" compile error.

## ⭐ Raw types

**In one line:** a generic type used without a type argument (`List` instead of `List<String>`) is a raw type; it turns off type checking and causes heap pollution.

- They exist only for compatibility with old (pre-Java 5) code.
- You can put anything into a raw type; the crash happens later, somewhere else. Hard to debug.
- `List` vs `List<Object>` vs `List<?>`:
  - `List` (raw): no checks, just a warning.
  - `List<Object>`: you can add anything, but a `List<String>` can't be assigned to it.
  - `List<?>`: any list can be assigned, but you can't add (safe read-only).

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Rahul"));
        List raw = names;            // only an unchecked warning
        raw.add(42);                 // heap pollution: Integer in a String list
        System.out.println(names.size());     // 2, no error yet
        try {
            String s = names.get(1); // the compiler-inserted cast fails here
        } catch (ClassCastException e) {
            System.out.println("ClassCastException, long after the add");
        }

        List<?> any = names;         // safe
        System.out.println(any.get(0));       // read as Object
        // any.add("x");             // compile error
    }
}
```

**Interview tip:** "Difference between `List<?>` and raw `List`?" `List<?>` is type-safe (adds are blocked); raw `List` switches type checking off entirely.

**Common mistake:** putting `@SuppressWarnings("unchecked")` on a whole class. Put it on one small local variable where you are sure.

## Explicit type arguments and inference

**In one line:** the compiler infers `T` most of the time; when it can't, tell it with `Class.<Type>method()`.

- Diamond `<>` (Java 7+): `new HashMap<>()` infers the right side from the left. Works with anonymous classes from Java 9+.
- Inference fails in lambda chains, because the target type is not passed through the `.reversed()` call.

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
        var empty = Collections.<String>emptyList();   // without the witness it would be List<Object>
        List<Object> objs = Main.<Object>repeat("x", 2);

        // Comparator.comparingInt(o -> o.eta()).reversed()  -> compile error: o is Object
        Comparator<Order> byEtaDesc = Comparator.<Order>comparingInt(o -> o.eta()).reversed();
        // Or a method reference: Comparator.comparingInt(Order::eta).reversed()

        List<Order> orders = new ArrayList<>(List.of(new Order("o1", 10), new Order("o2", 25)));
        orders.sort(byEtaDesc);
        System.out.println(empty + " " + objs + " " + orders.get(0).id()); // [] [x, x] o2
    }
}
```

**Interview tip:** the `Comparator.comparingInt(o -> ...).reversed()` compile error is a classic. Fix: explicit `<Order>`, a typed lambda `(Order o) -> ...`, or a method reference.

**Common mistake:** dropping the class/object prefix in `Main.<T>repeat(...)`. With an explicit type argument, a bare `<Object>repeat(...)` does not compile.

## Recursive generics

**In one line:** `<T extends Something<T>>`: the type parameter is bounded by its own type, so base-class methods can return the subclass type.

Real examples: `Enum<E extends Enum<E>>`, `Comparable<T>` bounds, and **Builders** with inheritance.

```java
public class Main {
    abstract static class Builder<T extends Builder<T>> {
        protected String name;
        T name(String n) { this.name = n; return self(); }   // returns the subclass type
        abstract T self();
    }

    static class PizzaBuilder extends Builder<PizzaBuilder> {
        private String size;
        PizzaBuilder size(String s) { this.size = s; return this; }
        @Override PizzaBuilder self() { return this; }
        String build() { return name + " (" + size + ")"; }
    }

    public static void main(String[] args) {
        // name() returns PizzaBuilder, so size() can be chained
        String pizza = new PizzaBuilder().name("Farmhouse").size("L").build();
        System.out.println(pizza);   // Farmhouse (L)
    }
}
```

**Interview tip:** "Why `Enum<E extends Enum<E>>`?" So `compareTo(E)` only works with the same enum type, never with another enum.

**Common mistake:** writing `return (T) this` in the base class instead of `self()`: an unchecked cast warning and a silent bug with the wrong subclass.

## ⭐ Common interview questions

**In one line:** these questions come up again and again in generics rounds; keep one-to-two-line answers ready.

- **`List<Object>` vs `List<?>` vs `List`?** `List<Object>` accepts any add, but only a `List<Object>` can be assigned to it. `List<?>` accepts any list, but no adds. Raw `List` has no type checks.
- **Can you pass `List<Integer>` where `List<Number>` is expected?** No, generics are invariant. Take a `List<? extends Number>` parameter.
- **Why can't you create a generic array?** Arrays check their element type at runtime (reified, covariant); after erasure T is unknown, which would open a type-safety hole.
- **Why no `List<int>`?** Erasure turns T into `Object`; primitives are not `Object`. Use `List<Integer>` (with autoboxing cost).
- **`<T> void f(List<T>)` vs `void f(List<?>)`?** Use `T` when you need to relate types (return T, two params with the same T, adding). Use `?` when you only read or call size.
- **Can you make a generic exception class?** No, a generic subclass of `Throwable` is not allowed (catch works on the runtime type).
- **PECS in one line?** Producer extends, consumer super. `Collections.copy(List<? super T> dest, List<? extends T> src)`.
- **Can a static field have type `T`?** No; all instances of the class (with different `T`s) share one static field.

**Interview tip:** follow each answer with a tiny example (like `sum(List<? extends Number>)`); it shows real understanding.

**Common mistake:** describing erasure as "generics don't work at runtime". Correct: type **checks** happen at compile time, type **info** is erased from objects.

## Checklist

- [ ] I can explain why generics exist, with a raw `List` `ClassCastException` example
- [ ] I can write a generic class, a generic interface and a generic method with `<T>`
- [ ] I can explain `<T extends Comparable<? super T>>` and multiple bounds
- [ ] I can explain the PECS rule with the `sum` and `copy` examples, and explain invariance
- [ ] I can list the consequences of type erasure (`new T()`, generic arrays, `instanceof`, overload clash) and their workarounds
- [ ] I can explain what a bridge method is and why it is generated
- [ ] I can explain the difference between a raw type, `List<Object>` and `List<?>`
- [ ] I can say when an explicit type witness (`Comparator.<Order>comparingInt`) is needed
- [ ] I can write a Builder using recursive generics
