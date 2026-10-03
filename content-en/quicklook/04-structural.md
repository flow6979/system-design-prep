**In one line:** Structural patterns connect classes/objects (wrap, compose, share) without touching existing code.

- **Adapter:** hide an incompatible/third-party interface behind yours; only translate, no logic; e.g. payment SDKs.
- **Decorator:** wrap at runtime to add features, same interface; toppings, Java I/O; avoids class explosion.
- **Facade:** one simple entry (`placeOrder()`) over complex subsystems; just delegate, no God class.
- **Proxy:** same-interface stand-in: caching, protection, lazy loading; add TTL/invalidation to caches.
- **Composite:** treat leaf and group the same in a tree (folder/file); child management only in composite.
- **Bridge:** two independent dimensions (message x channel) as separate hierarchies joined by composition.
- **Flyweight:** share intrinsic state (immutable), pass extrinsic from outside; factory pool; for huge object counts.
- **Adapter vs Facade:** Adapter converts, Facade simplifies.
- **Proxy vs Decorator:** Proxy controls access, Decorator adds features.

**Say in the interview:** "Each provider's SDK differs, so a `PaymentGateway` interface with one Adapter per provider. Decorator for toppings so subclasses do not explode."

**Avoid:** stuffing business logic into Facade/Adapter; making Flyweight mutable.
