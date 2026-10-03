**Ek line:** Structural patterns classes/objects ko jodte hain (wrap, compose, share) bina purana code chhede.

- **Adapter:** incompatible/third-party interface ko apne interface ke peeche chhupao; sirf translate, logic nahi; e.g. payment SDKs.
- **Decorator:** runtime pe wrap karke features jodo, same interface; toppings, Java I/O; class explosion se bachata hai.
- **Facade:** complex subsystems ke aage ek simple entry (`placeOrder()`); sirf delegate, God class nahi.
- **Proxy:** same interface ka stand-in: caching, protection, lazy loading; cache me TTL/invalidation.
- **Composite:** tree me leaf aur group same treat (folder/file); child management sirf composite me.
- **Bridge:** do independent dimensions (message x channel) alag hierarchies, composition se jude.
- **Flyweight:** intrinsic state share (immutable), extrinsic bahar se pass; factory pool; bahut saare objects ho tab.
- **Adapter vs Facade:** Adapter convert karta hai, Facade simplify.
- **Proxy vs Decorator:** Proxy access control, Decorator features jodta hai.

**Interview me bolo:** "Provider ke SDK alag hain, isliye `PaymentGateway` interface aur har provider ka Adapter. Toppings ke liye Decorator, taaki subclass explode na ho."

**Galti mat karna:** Facade/Adapter me business logic bhar dena; Flyweight ko mutable rakhna.
