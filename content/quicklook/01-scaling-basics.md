**Ek line:** Traffic badhe to vertical (bigger machine) ya horizontal (zyada machines + load balancer); horizontal ke liye services stateless honi chahiye.

- **Default:** app tier horizontal, DB pehle vertical + replicas, phir sharding.
- **Vertical:** simple par hardware limit aur SPOF. MVP aur DB primary ke liye theek.
- **L4 vs L7:** L4 IP+port, fast (WebSocket/TCP). L7 HTTP path/headers, routing + auth + canary.
- **LB algorithms:** round robin same requests ke liye; least connections long-lived (WebSocket, uploads).
- **LB SPOF:** active-passive pair ya managed LB, plus health checks.
- **Stateless:** server memory me user data nahi. Sticky sessions default mat banao.
- **Sessions:** JWT for auth + Redis for baaki state.
- **Autoscaling:** CPU > 70% ya queue depth pe; scale-up fast, scale-down slow. Minutes lagte hain.
- **Known spikes:** IPL, Big Billion Day pe pre-warm karo.
- **DB connections:** app scale hua to connections phat sakte hain, PgBouncer lagao.
- **SPOF check:** har box pe poochho "ye mara to kya?"

**Interview me bolo:** "Saari services stateless, session Redis me, auth JWT se. L7 LB path routing aur health checks ke saath, app tier CPU/latency pe autoscale, known spikes pe pre-warm."

**Galti mat karna:** Ek LB + ek DB bina SPOF zikr ke. "Autoscaling kar denge" ko instant samajhna.
