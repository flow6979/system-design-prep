**In one line:** HTTP is a stateless request/response protocol; method idempotency, status codes, cookies vs JWT and HTTP/1.1 vs 2 vs 3 are the interview core.

- **Safe vs idempotent:** safe does not change state; idempotent gives the same end state after 1 or 10 calls.
- **Methods:** GET/PUT/DELETE idempotent; POST is not; PATCH not guaranteed (`qty=3` yes, increment no).
- **Retries:** make POST retry-safe with an Idempotency-Key header.
- **PUT vs POST:** PUT replaces a known URL; POST creates under a collection.
- **401 vs 403:** 401 not authenticated; 403 known but not allowed.
- **502 vs 504:** upstream gave garbage or dropped vs upstream was too slow.
- **Cookie flags:** HttpOnly (XSS), Secure, SameSite (CSRF).
- **Session vs JWT:** session is a server lookup (easy revoke); JWT is signed claims (scales, hard to revoke).
- **Common pattern:** 15 min access JWT plus a revocable server-side refresh token.
- **HTTP/1.1 vs 2 vs 3:** keep-alive, then multiplexing, then QUIC (UDP, no TCP HOL; best on mobile).
- **REST vs gRPC:** REST for public APIs, gRPC for internal calls; SSE for LLM token streaming.

**Say in the interview:** "Each HTTP version fixes the previous bottleneck: 1.1 added keep-alive, 2 added multiplexing, 3 removes TCP head-of-line blocking."

**Avoid:** Returning 200 with an error body; using GET for side effects; calling HTTP/2 server push an optimization (deprecated).
