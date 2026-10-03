**Ek line:** Lambda = functional interface ka object, Stream = lazy pipeline (source > intermediate > terminal) jo "kya chahiye" batata hai, "loop kaise" nahi.

- **Functional interface:** exactly ek abstract method; `Function`, `Predicate`, `Consumer`, `Supplier`, `BiFunction`, `UnaryOperator`.
- **Comparator:** functional hai kyunki `equals` Object ka method hai, count nahi hota.
- **Effectively final:** lambda local variable ki copy capture karta hai; badal nahi sakte. Fields pe rule nahi.
- **`this`:** lambda me enclosing object; anonymous class me anonymous object.
- **Method refs:** 4 types: static, bound instance, unbound instance (`String::toUpperCase`), constructor.
- **Lazy:** terminal op lagne tak kuch nahi chalta; elements ek ek karke pipeline se guzarte hain.
- **Single use:** stream dobara use = `IllegalStateException`.
- **map vs flatMap:** map 1-to-1; flatMap 1-to-many aur flatten karta hai.
- **Collectors:** `groupingBy`, `partitioningBy`, `toMap` (duplicate key pe merge function do), `joining`.
- **Optional:** sirf return type; `isPresent()+get()` nahi, `orElseGet` (orElse ka argument hamesha evaluate hota hai).
- **Parallel:** sirf bada CPU-bound data, no shared state; I/O ya chhote data pe nahi. Measure karke hi.

**Interview me bolo:** "Stream lazy hai, terminal op pe hi chalti hai, aur ek baar hi consume hoti hai. Parallel stream main default me nahi use karta, pehle measure karta hu."

**Galti mat karna:** `forEach` me bahar ki list me add karna (side effect, parallel me toot jaata hai), `collect` use karo; `opt.get()` bina check.
