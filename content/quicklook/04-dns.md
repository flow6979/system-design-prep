**Ek line:** DNS naam ko IP mein badalta hai: recursive resolver root, TLD, authoritative tak jaata hai aur jawab har layer pe TTL tak cache hota hai.

- **Flow:** stub, recursive resolver, root, TLD, authoritative; jawab wapas cache hota hai.
- **Recursive vs iterative:** stub recursive query karta hai; resolver iterative (root/TLD sirf referral dete hain).
- **Browser:** root servers se baat nahi karta, sirf recursive resolver karta hai.
- **Caches:** browser, OS, resolver; zyadatar lookups resolver se aage jaate hi nahi.
- **CNAME apex:** root domain pe CNAME nahi ho sakta (SOA/NS ke saath conflict); ALIAS/flattening use karo.
- **TTL trade-off:** lamba TTL = fast + resilient par slow change; chhota TTL = fast failover par zyada queries.
- **Migration:** purane TTL se pehle TTL kam karo, switch karo, phir badhao.
- **GeoDNS:** user ki location/latency ke hisaab se alag IP; phir region ke andar L7 LB.
- **DNS round robin:** akela LB nahi; dead IP ko TTL tak traffic milta rehta hai.
- **K8s:** Service naam DNS se resolve hota hai (service discovery).

**Interview me bolo:** "IP badli par kuch users purane server pe aaye to wajah TTL caching hai resolver, OS aur browser pe; purana server TTL khatam hone tak zinda rakhunga."

**Galti mat karna:** "Propagation 24-48 ghante" fixed rule mat bolo; wo cached TTL jitna hota hai.
