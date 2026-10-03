**Ek line:** Behavioral patterns objects ke baat karne aur kaam baantne ka tareeka hain, taaki naya behaviour = nayi class.

- **Strategy:** ek kaam ke 3+ algorithms runtime swap (pricing, payment); client choose karta hai. 2 fixed cases ho to `if`.
- **Observer:** ek event pe kai subscribers (SMS/email/push); unsubscribe mat bhoolo, slow observer ko queue se async karo.
- **State:** 3+ states, behaviour state pe; data context me, state me sirf behaviour; object khud badalta hai. 2 states = boolean.
- **Chain of Responsibility:** handlers ki chain, order configurable (middleware, ATM notes); end pe default handler.
- **Command:** action = object; undo/redo, queue, retry; naye command pe redo stack clear.
- **Template Method:** base fixed skeleton, subclass kuch steps; method `final`; bahut variations ho to Strategy.
- **Iterator:** internals chhupa ke traverse; internal list return mat karo, iterate me modify mat karo.
- **Mediator:** N x N ko ek coordinator se (lifts + controller); Observer = one-to-many, Mediator = many-to-many.
- **Memento:** state snapshot undo ke liye; history limit rakho; badi state ho to Command (diff).
- **Visitor:** types stable, operations naye; naye types aayein to mat lo; `instanceof` mat likho.
- **Pattern chunne ka tareeka:** pehle smell pehchano, phir pattern ka naam lo.

**Interview me bolo:** "Pehle problem batata hoon, phir pattern: pricing variants ke liye Strategy, order status events ke liye Observer, vending machine ke liye State."

**Galti mat karna:** Strategy me `if (type == ...)` likhna; Strategy aur State mix karna.
