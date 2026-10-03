**In one line:** Everything descends from `Throwable`: do not catch `Error`, use checked exceptions for recoverable external failures and unchecked for bugs; know `finally`, try-with-resources and cause chaining rules.

- **Hierarchy:** `Throwable` > `Error` / `Exception`; unchecked = `RuntimeException` + `Error`.
- **Checked vs unchecked:** checked if the caller can meaningfully recover, else unchecked (Spring mostly uses unchecked).
- **Catch order:** specific first, general later; the reverse is a compile error.
- **finally:** always runs except on `System.exit()`/JVM crash; a `return` in finally overrides the try's return and swallows exceptions.
- **try-with-resources:** `AutoCloseable`, closes in reverse order; a close exception becomes suppressed.
- **Multi-catch:** `A | B`, but not types from the same hierarchy.
- **throw vs throws:** `throw` is a statement in the body, `throws` is a signature declaration.
- **Custom exception:** give a domain name and pass the cause: `new MyEx(msg, e)`.
- **Best practice:** never swallow, broad catch only at top level, log or rethrow (not both), fail fast.
- **Overriding:** a child cannot throw broader or new checked exceptions (Liskov).
- **InterruptedException:** if caught, restore the flag with `Thread.currentThread().interrupt()`.

**Say in the interview:** "I translate exceptions at layer boundaries but always pass the cause, so the root cause shows up under `Caused by` in the stack trace."

**Avoid:** `catch (Throwable)`; `throw new X(e.getMessage())` (loses stack trace); `5.0 / 0` gives Infinity, not an exception.
