**Ek line:** Microservices = chhoti, alag deploy hone wali services, apna data; gateway, discovery, mesh, strangler us split ki takleef sambhalte hain.

- **Split NA karo:** team < 10–15, domain unclear (distributed monolith), strong consistency har jagah. Pehle modular monolith.
- **Split karo:** alag scale/deploy needs, 50+ engineers.
- **Database-per-service:** koi doosri service ki table nahi padhti; API/events se. Cross-service join nahi, local read model; writes = Saga + outbox.
- **API Gateway:** ek entry; routing, JWT auth, rate limit, TLS. Business logic nahi.
- **BFF:** har client type ka alag chhota backend (mobile vs web).
- **Service discovery:** client-side (Eureka/Consul) vs server-side (K8s Service DNS, ALB). Interview me "K8s Service DNS" kaafi.
- **Service mesh:** sidecar (Envoy) + control plane (Istio): mTLS, retries, traces, canary. ~1 ms/hop; 10–20 services pe library kaafi.
- **Strangler fig:** proxy aage, ek module nikaalo, traffic shift (shadow → canary → 100%), monolith se hatao. Big bang rewrite nahi.
- **Sync vs async:** turant jawab = REST/gRPC; "ho gaya" = events. Lambi sync chain avoid (0.99⁴ ≈ 0.96).
- **Failure:** timeout, backoff, circuit breaker, bulkhead.

**Interview me bolo:** "Shuru me modular monolith; load aur teams alag hon to database-per-service ke saath nikaalunga. Gateway auth/rate limit ke liye, mobile ke liye BFF. Order ke baad ka kaam async events, sirf payment authorization sync gRPC with circuit breaker."

**Galti mat karna:** Seedha 20 microservices bina "kyun split" bataye, ya shared DB. Gateway me business logic, service mesh ko free samajhna.
