**Ek line:** Internet network of networks hai jo packets ko hop-by-hop IP se IP tak bhejta hai; URL type karne par DNS, TCP, TLS, HTTP ek ke baad ek chalte hain.

- **Layers:** L2 switch (MAC), L3 router (IP), L4 TCP/UDP (ports), L7 HTTP. Real internet 4-layer TCP/IP pe chalta hai.
- **Encapsulation:** neeche jaate hue har layer apna header add karti hai (TCP, IP, Ethernet).
- **L4 vs L7 LB:** L4 sirf IP + port dekhta hai; L7 path, headers, cookies padh ke route karta hai.
- **IP:** best-effort hai, delivery/order ki guarantee nahi; reliability TCP deta hai.
- **IPv4 vs IPv6:** 32 bit (~4.3 billion) vs 128 bit. MTU ~1500 bytes, isliye data packets mein kata jata hai.
- **Routing:** har router sirf next hop jaanta hai (longest prefix match); BGP ISPs ke beech routes batata hai.
- **Port vs socket:** IP machine chunta hai, port process. Connection limit 4-tuple se hai, 65535 se nahi.
- **NAT/CGNAT:** bahut users ek public IP share karte hain, isliye rate limit sirf IP pe mat rakho.
- **URL flow:** DNS, TCP, TLS, HTTP request, server (CDN/LB ke peeche) response, browser render.
- **CDN vs LB:** CDN edge pe hai; LB tumhare region ke servers ke aage.

**Interview me bolo:** "URL type karne par pehle browser/OS/resolver cache se DNS resolve hota hai, phir TCP handshake, TLS handshake, HTTP request CDN ya load balancer se hoke server tak jaati hai, aur browser response render karta hai."

**Galti mat karna:** Browser ko seedha server se baat karte mat dikhao (CDN/LB aur DNS cache skip mat karo); aur IP ko reliable mat bolo.
