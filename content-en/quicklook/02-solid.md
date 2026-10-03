**In one line:** SOLID means a new requirement is a new class, and old tested code stays untouched.

- **S (Single Responsibility):** one class, one reason to change; not "one method".
- **O (Open/Closed):** open for extension, closed for modification; a `switch` on type signals abstraction.
- **L (Liskov):** a child must substitute for the parent without surprises; `UnsupportedOperationException` means a wrong hierarchy.
- **I (Interface Segregation):** no fat interfaces; empty or `throw` methods mean split it.
- **D (Dependency Inversion):** business logic depends on an interface, concrete is injected via constructor.
- **DIP vs DI:** DIP is the principle, Dependency Injection is a technique to achieve it.
- **ISP vs LSP:** ISP is interface size, LSP is child behaviour.
- **DRY:** one business rule in one place; **KISS:** keep it simple; **YAGNI:** do not build what is not needed yet.
- **Balance:** two fixed cases can stay a simple `if`; an interface for everything is overkill.

**Say in the interview:** "A new split type is just a new `SplitStrategy` class, no change to existing code. The service depends on an interface and the implementation is injected via constructor."

**Avoid:** doing `new` inside a service and claiming interface use; or dropping SOLID for YAGNI / creating 20 interfaces.
