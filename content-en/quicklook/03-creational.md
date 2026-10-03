**In one line:** Creational patterns decide how an object is built so the `new` logic lives in one place.

- **Singleton:** one instance app-wide (logger, config, pool); must be thread-safe.
- **Singleton impl:** Java enum or double-checked locking with `volatile`; C++ Meyers (`static` local).
- **Singleton trap:** not for "just a global"; hidden dependency, hard to mock.
- **Factory:** type decided at runtime, new types keep coming; a simple factory (static + `switch`) is enough in interviews.
- **Factory Method vs Simple Factory:** subclass override vs one static method; return the interface, not the concrete.
- **Builder:** 4+ params, many optional, immutable object; validate in `build()`; required fields in constructor.
- **Abstract Factory:** a whole matching family (UI theme, DB driver); overkill for one product.
- **Prototype:** clone when creation is expensive; deep-copy mutable fields.

**Say in the interview:** "Logger is a Singleton (Java enum, C++ Meyers). A new notification type is one factory case, client code unchanged."

**Avoid:** forgetting `volatile` in double-checked locking; shallow copy sharing lists in Prototype.
