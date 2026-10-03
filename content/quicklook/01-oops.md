**Ek line:** LLD ki neev: nouns se classes, verbs se methods, aur IS-A pe hi inheritance, baaki composition.

- **Class/Object:** class blueprint, object uski asli copy; sirf data ho to `record`/`struct`.
- **Encapsulation:** fields private, changes sirf methods se; blind getter/setter nahi.
- **Abstraction:** "kya karta hai" dikhao, "kaise" chhupao. Encapsulation = data chhupana, Abstraction = complexity.
- **Inheritance:** sirf sach ka IS-A; hierarchy 2-3 level; C++ me base destructor `virtual`.
- **Polymorphism:** overloading = compile-time, overriding = runtime; C++ me `virtual` zaroori.
- **Interface vs Abstract:** capability = interface (default choice); shared state/code = abstract class.
- **Composition over Inheritance:** HAS-A, behaviour interface ke peeche, constructor se inject; runtime swap + test easy.
- **Association/Aggregation/Composition:** use karta hai / bahar se aaya part / owner ke saath marta hai.
- **Access modifiers:** fields `private`, `protected` kam; Java default = package, C++ `class` default = private.

**Interview me bolo:** "Nouns se entities, verbs se methods nikalta hoon. Inheritance sirf IS-A pe, warna composition; behaviour interface ke peeche inject karta hoon."

**Galti mat karna:** God class banana, ya code reuse ke liye `Stack extends ArrayList` jaisi inheritance.
