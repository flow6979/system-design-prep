**Ek line:** API gateway pe token bucket, state Redis Cluster me, check ek atomic Lua script se; limit cross hone pe 429 + Retry-After.

- **Requirements:** per user/IP/API key/endpoint rules bina deploy, 429 + Retry-After, quota headers; check p99 < 2 ms.
- **Scale:** 1M QPS = 1M Redis ops/sec, ~10-20 shards (~100K ops/node), ~300M keys, ~15 GB.
- **Components:** Gateway middleware, Redis Cluster (key `rl:{rule}:{client}`), Postgres rules (30 sec poll), metrics.
- **Token bucket over fixed window:** burst allow, state sirf 2 fields; fixed window boundary pe 2x burst.
- **Lua over MULTI/WATCH:** refill + check + decrement atomic, ek round trip; time Redis `TIME` se.
- **Fail-open over fail-closed:** Redis timeout (> 5 ms) pe allow; login/OTP/payment pe fail-closed.
- **Redis over local memory:** N gateways = N x limit.
- **Hot key:** gateway pe local bucket, central se 100-token batch; ~1-5% over-limit chalega.
- **Multi-region:** per-region limits ya async sync; sync cross-region check = 100ms+.
- **Senior signal:** limiter critical path pe hai; 5 ms timeout, circuit breaker, local fallback, shadow mode for naye rules.

**Interview me bolo:** "Gateway pe token bucket, Redis Cluster me state, Lua script se atomic check. Redis down to fail-open, par auth endpoints fail-closed."

**Galti mat karna:** Read-modify-write bina atomicity ke mat batao; gateway clocks pe bharosa mat karo.
