**In one line:** Java has 8 primitives, and the interview traps are the `Integer` cache, autoboxing NPE, overflow and pass-by-value.

- **8 primitives:** `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`; defaults apply only to fields/array elements.
- **Literals:** integer literal is `int`, decimal literal is `double`; hence `3_000_000_000L` and `1.5f`.
- **Integer cache:** `==` is true for -128..127, false outside; always use `equals()` on objects.
- **Autoboxing:** `int x = map.get(k)` throws NPE if the key is missing; avoid boxing in hot loops.
- **Casting:** widening is automatic, narrowing is explicit; `(int) 3.99` is 3, `byte + byte` is `int`.
- **Overflow:** `1_000_000 * 1_000_000` overflows as `int` first; make one operand `L`.
- **Modulo:** `%` can be negative; use `Math.floorMod` for indexes.
- **Pass-by-value:** objects pass a copy of the reference, so you can mutate the object but cannot write a swap.
- **final:** locks the reference, not the object's data; a `final List` is not immutable.
- **static:** methods are hidden, not overridden; a mutable static field is a race condition.
- **Money:** never `double`; use `long` paise or `BigDecimal` (`0.1 + 0.2 != 0.3`).

**Say in the interview:** "Java is always pass-by-value. For objects a copy of the reference is passed, so a method can change state but not the caller's reference."

**Avoid:** saying "objects are pass-by-reference"; comparing `Integer` with `==`.
