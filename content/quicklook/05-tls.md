**Ek line:** TLS confidentiality, integrity aur authentication deta hai: asymmetric sirf handshake mein, phir fast symmetric key se saara data encrypt.

- **3 guarantees:** encryption, tamper detection, server identity. SNI/IP visible hote hain; path, headers, body encrypted.
- **Hybrid:** asymmetric (slow) handshake mein, symmetric (fast) bulk data ke liye.
- **ECDHE:** dono taraf same secret banate hain bina wire pe bheje; har baar fresh keys.
- **Private key:** sign karti hai, data encrypt nahi karti.
- **TLS 1.3:** 1 RTT handshake; fresh HTTPS = TCP 1 + TLS 1 + request 1 = 3 RTT first byte tak.
- **0-RTT:** replay ho sakta hai; sirf idempotent GET ke liye.
- **Chain of trust:** cert to intermediate to trusted root, hostname SAN se match, private key ka proof.
- **Certs:** Let's Encrypt 90 din free; renewal automate karo, expiry se 30 din pehle alert.
- **Termination:** TLS LB/CDN pe khulta hai; andar plain ya mTLS; `X-Forwarded-Proto` check karo.
- **mTLS:** dono taraf certs; service mesh (Istio) se zero-trust service auth.
- **HSTS:** browser ko hamesha HTTPS bolta hai; preload list pehli visit bhi cover karti hai.

**Interview me bolo:** "LB pe TLS terminate hota hai aur internal traffic service mesh ke mTLS se chalta hai; end-user identity JWT se jaati hai."

**Galti mat karna:** "Server private key se data encrypt karta hai" mat bolo; aur VPC ke andar ki requests pe blind trust mat karo.
