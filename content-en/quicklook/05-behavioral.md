**In one line:** Behavioral patterns govern how objects talk and split work, so new behaviour means a new class.

- **Strategy:** 3+ algorithms for one job, swapped at runtime (pricing, payment); client picks. Two fixed cases: just `if`.
- **Observer:** one event, many subscribers (SMS/email/push); do not forget unsubscribe; use a queue for slow observers.
- **State:** 3+ states, behaviour depends on state; data stays in context, state holds behaviour only; object changes itself. 2 states = boolean.
- **Chain of Responsibility:** chain of handlers, configurable order (middleware, ATM notes); keep a default at the end.
- **Command:** action as an object; undo/redo, queue, retry; clear redo stack on a new command.
- **Template Method:** base fixes the skeleton, subclasses fill steps; make the method `final`; many variations means Strategy.
- **Iterator:** traverse without exposing internals; do not return the internal list or modify while iterating.
- **Mediator:** replace N x N links with one coordinator (lifts + controller); Observer is one-to-many, Mediator many-to-many.
- **Memento:** state snapshot for undo; cap history; for large state prefer Command (diff).
- **Visitor:** stable types, new operations; avoid if new types keep coming; no `instanceof` inside.
- **How to choose:** spot the smell first, then name the pattern.

**Say in the interview:** "I state the problem first, then the pattern: Strategy for pricing variants, Observer for order status events, State for the vending machine."

**Avoid:** `if (type == ...)` inside a Strategy; confusing Strategy with State.
