**Ek line:** HTTP stateless request/response protocol hai; methods ki idempotency, status codes, cookies vs JWT aur HTTP/1.1 vs 2 vs 3 interview ke core hain.

- **Safe vs idempotent:** safe state nahi badalta; idempotent ko 1 baar ya 10 baar bulao, end state same.
- **Methods:** GET/PUT/DELETE idempotent; POST nahi; PATCH guaranteed nahi (`qty=3` haan, increment nahi).
- **Retries:** POST ko safe banane ke liye Idempotency-Key header use karo.
- **PUT vs POST:** PUT known URL replace karta hai; POST collection ke neeche naya banata hai.
- **401 vs 403:** 401 authenticate nahi hua; 403 pehchaan liya par allowed nahi.
- **502 vs 504:** upstream ne kharab response diya vs upstream bahut slow tha.
- **Cookie flags:** HttpOnly (XSS), Secure, SameSite (CSRF).
- **Session vs JWT:** session server-side lookup (revoke easy); JWT signed claims (scale easy, revoke mushkil).
- **Common pattern:** 15 min access JWT + revocable refresh token server-side.
- **HTTP/1.1 vs 2 vs 3:** keep-alive, phir multiplexing, phir QUIC (UDP, no TCP HOL; mobile pe best).
- **REST vs gRPC:** public API ke liye REST, internal service calls ke liye gRPC; SSE LLM streaming ke liye.

**Interview me bolo:** "Har HTTP version pichle ka bottleneck fix karta hai: 1.1 keep-alive, 2 multiplexing, 3 TCP head-of-line blocking."

**Galti mat karna:** Error ko 200 body mein mat bhejo; GET se side effects mat karo; HTTP/2 push ko optimization mat bolo (deprecated).
