**In one line:** Limit requests per user/IP/API key to protect against abuse and overload; reject with `429` past the limit.

- **Token bucket:** allows bursts (up to N) at average rate r. The default; state = tokens + last_refill. AWS, Stripe.
- **Leaky bucket:** queue drains at a fixed rate; smooth output, no bursts.
- **Fixed window:** simple, but 2x burst at the boundary (100 + 100 within 2 sec).
- **Sliding log:** exact but memory-heavy (one entry per request). Low volume, strict limits.
- **Sliding counter:** `curr + prev * overlap`; low memory, nearly accurate. High-scale public APIs.
- **Where:** API gateway is most common; CDN/WAF for DDoS; inside the service for costly ops (OTP).
- **Key:** `user_id` when logged in, IP for anonymous, `api_key` for B2B.
- **Distributed:** keep the counter in central Redis, not local memory (10 servers = 10x the limit).
- **Atomic:** INCR+EXPIRE or token bucket inside a Lua script.
- **Redis down:** fail open; fail closed only for OTP/payment.
- **Response:** 429 plus `Retry-After`.

**Say in the interview:** "Token bucket at the API gateway per user_id, state in Redis updated atomically via Lua. 429 with Retry-After; if Redis is down, fail open except OTP and payment, which fail closed."

**Avoid:** Per-server local counters. Limiting only by IP (thousands of users sit behind one NAT).
