**Ek line:** Per user/IP/API key requests ki limit lagao taaki abuse aur overload se bache; limit cross pe `429`.

- **Token bucket:** burst allow (N tak), average rate r. Default; state = tokens + last_refill. AWS, Stripe.
- **Leaky bucket:** queue fixed rate pe drain; smooth output, no burst.
- **Fixed window:** simple, par boundary pe 2x burst (100 + 100 in 2 sec).
- **Sliding log:** exact par memory zyada (har request entry). Low volume, strict.
- **Sliding counter:** `curr + prev * overlap`; kam memory, almost accurate. High scale public APIs.
- **Kahan lagao:** API gateway sabse common; CDN/WAF DDoS ke liye; service ke andar costly ops (OTP).
- **Key:** `user_id` logged in, IP anonymous, `api_key` B2B.
- **Distributed:** counter central Redis me, local me nahi (10 servers = 10x limit).
- **Atomic:** INCR+EXPIRE ya token bucket Lua script me.
- **Redis down:** fail open; OTP/payment pe fail closed.
- **Response:** 429 + `Retry-After`.

**Interview me bolo:** "API gateway pe token bucket per user_id, state Redis me, update Lua script se atomically. 429 with Retry-After; Redis down to fail open, sirf OTP aur payment pe fail closed."

**Galti mat karna:** Counter har server ki local memory me rakhna. Sirf IP pe limit (NAT ke peeche hazaar users).
