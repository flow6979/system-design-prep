**Ek line:** Sab `Throwable` se aata hai: `Error` mat pakdo, checked exceptions recoverable bahari problems ke liye, unchecked bugs ke liye; `finally`, try-with-resources aur cause chaining ke rules yaad rakho.

- **Hierarchy:** `Throwable` > `Error` / `Exception`; unchecked = `RuntimeException` + `Error`.
- **Checked vs unchecked:** caller recover kar sakta ho to checked, warna unchecked (Spring me zyadatar unchecked).
- **Catch order:** specific pehle, general baad me; ulta compile error.
- **finally:** hamesha chalta hai, sirf `System.exit()`/JVM crash pe nahi; `return` in finally try ka return aur exception dono overwrite karta hai.
- **try-with-resources:** `AutoCloseable`, reverse order me close; close ka exception suppressed ban jaata hai.
- **Multi-catch:** `A | B`, par parent-child types saath nahi.
- **throw vs throws:** `throw` statement body me, `throws` signature me declaration.
- **Custom exception:** domain naam do aur cause pass karo: `new MyEx(msg, e)`.
- **Best practice:** swallow mat karo, broad catch sirf top level, log ya rethrow (dono nahi), fail fast.
- **Overriding:** child broader/new checked exception nahi throw kar sakta (Liskov).
- **InterruptedException:** pakdo to `Thread.currentThread().interrupt()` se flag restore karo.

**Interview me bolo:** "Exception translate karta hu layer boundary pe, par cause hamesha pass karta hu taaki root cause stack trace me `Caused by` me dikhe."

**Galti mat karna:** `catch (Throwable)`, `throw new X(e.getMessage())` (stack trace gum), `5.0 / 0` Infinity deta hai, exception nahi.
