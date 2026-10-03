**In one line:** The internet is a network of networks moving packets hop by hop from IP to IP; typing a URL triggers DNS, TCP, TLS, then HTTP in order.

- **Layers:** L2 switch (MAC), L3 router (IP), L4 TCP/UDP (ports), L7 HTTP. The real internet runs on 4-layer TCP/IP.
- **Encapsulation:** going down, each layer adds its header (TCP, IP, Ethernet).
- **L4 vs L7 LB:** L4 sees only IP + port; L7 reads path, headers, cookies to route.
- **IP:** best-effort, no guarantee of delivery or order; TCP adds reliability.
- **IPv4 vs IPv6:** 32 bit (~4.3 billion) vs 128 bit. MTU ~1500 bytes, so data is split into packets.
- **Routing:** each router knows only the next hop (longest prefix match); BGP exchanges routes between ISPs.
- **Port vs socket:** IP picks the machine, port picks the process. Connection limit is per 4-tuple, not 65,535.
- **NAT/CGNAT:** many users share one public IP, so do not rate limit by IP alone.
- **URL flow:** DNS, TCP, TLS, HTTP request, server behind CDN/LB responds, browser renders.
- **CDN vs LB:** the CDN is the edge; the LB sits in front of your servers in your region.

**Say in the interview:** "Typing a URL resolves DNS through browser, OS and resolver caches, then does a TCP handshake and TLS handshake, sends the HTTP request through a CDN or load balancer to the server, and the browser renders the response."

**Avoid:** Drawing the browser talking straight to the server (skipping DNS caches, CDN, LB); saying IP guarantees delivery.
