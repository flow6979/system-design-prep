**In one line:** TLS gives confidentiality, integrity and authentication: asymmetric crypto only in the handshake, then a fast symmetric key encrypts all data.

- **3 guarantees:** encryption, tamper detection, server identity. IP and SNI are visible; path, headers, body are encrypted.
- **Hybrid:** asymmetric (slow) in the handshake, symmetric (fast) for bulk data.
- **ECDHE:** both sides derive the same secret without sending it; fresh keys each time.
- **Private key:** signs; it does not encrypt data.
- **TLS 1.3:** 1 RTT handshake; fresh HTTPS = TCP 1 + TLS 1 + request 1 = 3 RTT to first byte.
- **0-RTT:** replayable; allow only for idempotent GETs.
- **Chain of trust:** cert to intermediate to trusted root, hostname matches SAN, proof of private key.
- **Certs:** Let's Encrypt is free for 90 days; automate renewal, alert 30 days before expiry.
- **Termination:** TLS ends at the LB/CDN; inside is plain or mTLS; check `X-Forwarded-Proto`.
- **mTLS:** both sides present certs; a service mesh (Istio) gives zero-trust service auth.
- **HSTS:** tells browsers to always use HTTPS; the preload list covers the first visit.

**Say in the interview:** "TLS terminates at the LB and internal traffic uses mTLS through the service mesh, with a JWT carrying end-user identity."

**Avoid:** Saying the server encrypts data with its private key; trusting any request just because it is inside the VPC.
