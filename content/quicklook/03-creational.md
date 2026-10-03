**Ek line:** Creational patterns decide karte hain object kaise banega, taaki `new` ka logic ek jagah rahe.

- **Singleton:** poore app me ek instance (logger, config, pool); thread-safe zaroori.
- **Singleton impl:** Java me enum ya double-checked locking with `volatile`; C++ me Meyers (`static` local).
- **Singleton trap:** global variable ke liye mat lo; hidden dependency, mock nahi hota.
- **Factory:** type runtime pe decide ho aur naye types aayein; interview me simple factory (static + `switch`) kaafi.
- **Factory Method vs Simple Factory:** subclass override vs ek static method; concrete nahi, interface return karo.
- **Builder:** 4+ params, kai optional, immutable object; validation `build()` me; required fields constructor me.
- **Abstract Factory:** poori matching family (UI theme, DB driver); ek hi product ho to overkill.
- **Prototype:** banana mehenga ho to clone karo; mutable fields ka deep copy.

**Interview me bolo:** "Logger Singleton (Java enum, C++ Meyers). Notification type naya aaye to factory me ek case, client code same."

**Galti mat karna:** `volatile` bhoolna double-checked locking me; shallow copy se list share ho jaana Prototype me.
