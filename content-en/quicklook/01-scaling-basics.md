**In one line:** When traffic grows, scale up (bigger machine) or scale out (more machines behind a load balancer); scaling out needs stateless services.

- **Default:** horizontal app tier, DB vertical plus replicas first, then sharding.
- **Vertical:** simple but hits hardware limits and is a SPOF. Fine for MVPs and DB primaries.
- **L4 vs L7:** L4 sees IP+port, fast (WebSocket/TCP). L7 sees HTTP path/headers, enables routing, auth, canary.
- **LB algorithms:** round robin for similar requests; least connections for long-lived ones (WebSocket, uploads).
- **LB SPOF:** active-passive pair or managed LB, plus health checks.
- **Stateless:** no user data in server memory. Do not make sticky sessions the default.
- **Sessions:** JWT for auth plus Redis for other state.
- **Autoscaling:** on CPU > 70% or queue depth; scale up fast, scale down slow. It takes minutes.
- **Known spikes:** pre-warm (IPL, Big Billion Day).
- **DB connections:** scaling the app can exhaust them, use PgBouncer.
- **SPOF check:** for every box ask "what if this dies?"

**Say in the interview:** "All services stateless, sessions in Redis, auth via JWT. L7 LB with path routing and health checks, app tier autoscaling on CPU/latency, pre-warm for known spikes."

**Avoid:** One LB and one DB with no SPOF mention. Treating autoscaling as instant.
