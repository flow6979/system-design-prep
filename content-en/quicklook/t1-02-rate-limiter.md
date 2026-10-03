**In one line:** Token bucket at the API gateway, state in a Redis Cluster, each check one atomic Lua script; over the limit returns 429 + Retry-After.

- **Requirements:** per user/IP/API key/endpoint rules without deploys, 429 + Retry-After, quota headers; check p99 < 2 ms.
- **Scale:** 1M QPS = 1M Redis ops/sec, ~10-20 shards (~100K ops/node), ~300M keys, ~15 GB.
- **Components:** Gateway middleware, Redis Cluster (key `rl:{rule}:{client}`), Postgres rules (30 sec poll), metrics.
- **Token bucket over fixed window:** allows bursts, state is 2 fields; fixed window allows 2x burst at the boundary.
- **Lua over MULTI/WATCH:** refill + check + decrement atomic in one round trip; time from Redis `TIME`.
- **Fail-open over fail-closed:** allow on Redis timeout (> 5 ms); fail-closed for login/OTP/payment.
- **Redis over local memory:** N gateways would give N x the limit.
- **Hot key:** local bucket at gateway, 100-token batches from central; ~1-5% over-limit is acceptable.
- **Multi-region:** per-region limits or async sync; a sync cross-region check costs 100ms+.
- **Senior signal:** the limiter is on the critical path; 5 ms timeout, circuit breaker, local fallback, shadow mode for new rules.

**Say in the interview:** "Token bucket at the gateway, state in Redis Cluster, atomic check via a Lua script. If Redis is down I fail open, except auth endpoints which fail closed."

**Avoid:** Describing read-modify-write without atomicity; trusting gateway clocks.
