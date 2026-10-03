**In one line:** DNS turns names into IPs: a recursive resolver walks root, TLD, authoritative, and every layer caches the answer for its TTL.

- **Flow:** stub, recursive resolver, root, TLD, authoritative; the answer is cached on the way back.
- **Recursive vs iterative:** the stub asks recursively; the resolver queries iteratively (root/TLD only refer).
- **Browser:** never talks to root servers, only to the recursive resolver.
- **Caches:** browser, OS, resolver; most lookups never leave the resolver.
- **CNAME at apex:** not allowed (conflicts with SOA/NS); use ALIAS/flattening.
- **TTL trade-off:** long TTL is fast and resilient but slow to change; short TTL gives quick failover but more queries.
- **Migration:** lower the TTL one old-TTL period ahead, switch, then raise it again.
- **GeoDNS:** returns a different IP by user location or latency; then an L7 LB inside the region.
- **DNS round robin:** not a load balancer alone; a dead IP keeps getting traffic until TTL expires.
- **K8s:** Service names resolve via DNS (service discovery).

**Say in the interview:** "If some users still hit the old IP, it is TTL caching at resolver, OS and browser; I keep the old server alive until the old TTL expires."

**Avoid:** Saying "propagation takes 24 to 48 hours" as a fixed rule; it equals the cached TTL.
