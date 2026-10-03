**In one line:** Microservices = small, independently deployed services that own their data; gateway, discovery, mesh and strangler patterns handle the pain of splitting.

- **Don't split:** team < 10–15, unclear domain (distributed monolith), strong consistency everywhere. Start with a modular monolith.
- **Do split:** different scale/deploy needs, 50+ engineers.
- **Database-per-service:** no one reads another service's tables; use APIs/events. No cross-service joins, build local read models; multi-service writes = Saga + outbox.
- **API Gateway:** single entry; routing, JWT auth, rate limiting, TLS. No business logic.
- **BFF:** a small backend per client type (mobile vs web).
- **Service discovery:** client-side (Eureka/Consul) vs server-side (K8s Service DNS, ALB). "K8s Service DNS" suffices in interviews.
- **Service mesh:** sidecar (Envoy) plus control plane (Istio): mTLS, retries, traces, canary. ~1 ms/hop; a library is enough for 10–20 services.
- **Strangler fig:** proxy in front, extract one module, shift traffic (shadow → canary → 100%), remove from monolith. Never a big-bang rewrite.
- **Sync vs async:** immediate answer = REST/gRPC; "it's done" = events. Avoid long sync chains (0.99⁴ ≈ 0.96).
- **Failure:** timeout, backoff, circuit breaker, bulkhead.

**Say in the interview:** "I'd start with a modular monolith and extract services with database-per-service once load and teams diverge. Gateway for auth/rate limiting, a BFF for mobile. Post-order work is async events; only payment authorization is sync gRPC with a circuit breaker."

**Avoid:** Jumping to 20 microservices without saying why, or sharing one DB. Business logic in the gateway, or treating a service mesh as free.
