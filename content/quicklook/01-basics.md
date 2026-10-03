**Ek line:** Java me 8 primitives hain, wrappers/autoboxing ke gotchas (`Integer` cache, NPE, overflow) aur pass-by-value hi interview me pakadte hain.

- **8 primitives:** `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`; default sirf fields/array elements ko milta hai.
- **Literals:** integer literal default `int`, decimal default `double`; isliye `3_000_000_000L` aur `1.5f`.
- **Integer cache:** -128..127 me `==` true, bahar false; objects pe hamesha `equals()`.
- **Autoboxing:** `int x = map.get(k)` pe key missing ho to NPE; hot loop me boxing avoid karo.
- **Casting:** widening automatic, narrowing explicit; `(int) 3.99` = 3 (truncate), `byte + byte` = `int`.
- **Overflow:** `1_000_000 * 1_000_000` pehle `int` me overflow hota hai; ek operand `L` karo.
- **Modulo:** `%` negative ho sakta hai; index ke liye `Math.floorMod`.
- **Pass-by-value:** Java hamesha value pass karta hai; objects me reference ki copy jaati hai, isliye swap nahi likh sakte.
- **final:** reference lock hota hai, object ka data nahi; `final List` immutable nahi.
- **static:** method override nahi hota, hide hota hai; mutable static field = race condition.
- **Money:** `double` nahi, `long` paise ya `BigDecimal` (`0.1 + 0.2 != 0.3`).

**Interview me bolo:** "Java is always pass-by-value. Objects me reference ki copy jaati hai, to method state badal sakta hai par caller ka reference nahi."

**Galti mat karna:** "Objects pass-by-reference hote hain" mat bolna; `Integer` ko `==` se compare mat karna.
