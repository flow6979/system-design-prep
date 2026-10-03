**Ek line:** SOLID ka matlab naya requirement = nayi class, purana tested code safe.

- **S (Single Responsibility):** ek class, ek reason to change; "ek method" nahi.
- **O (Open/Closed):** extension ke liye open, modification ke liye closed; type pe `switch` dikhe to abstraction.
- **L (Liskov):** child parent ki jagah bina surprise chale; `UnsupportedOperationException` = hierarchy galat.
- **I (Interface Segregation):** mote interface mat banao; khali/`throw` methods dikhein to todo.
- **D (Dependency Inversion):** business logic interface pe depend kare, concrete constructor se inject ho.
- **DIP vs DI:** DIP principle hai, Dependency Injection usko achieve karne ka technique.
- **ISP vs LSP:** ISP = interface ka size, LSP = child ka behaviour.
- **DRY:** same business rule do jagah nahi; **KISS:** simple rakho; **YAGNI:** jo abhi nahi chahiye mat banao.
- **Balance:** sirf 2 fixed cases ho to simple `if` theek; har cheez pe interface overkill.

**Interview me bolo:** "Naya split type aaye to sirf ek nayi `SplitStrategy` class likhunga, existing code nahi chhedunga. Service interface pe depend karti hai, implementation constructor se aati hai."

**Galti mat karna:** Service ke andar `new` karke bolna "interface use kiya"; ya YAGNI ke naam pe SOLID chhodna / 20 interfaces banana.
