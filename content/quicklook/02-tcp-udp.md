**Ek line:** TCP reliable ordered byte stream deta hai (handshake, ACKs, flow + congestion control); UDP bas fast standalone datagrams, reliability tum khud banao.

- **3-way handshake:** SYN, SYN-ACK, ACK; dono taraf ke initial sequence numbers confirm hote hain. Encryption keys yahan nahi, wo TLS hai.
- **SYN flood:** SYNs bhej ke ACK nahi; defence SYN cookies.
- **4-way close:** har direction alag band hoti hai; jo pehle close kare wo TIME_WAIT (2xMSL, Linux 60s) mein rehta hai.
- **TIME_WAIT vs CLOSE_WAIT:** TIME_WAIT normal hai; CLOSE_WAIT bahut ho to app ne close() nahi kiya (bug).
- **Reliability:** sequence numbers, cumulative ACK, RTO with backoff, 3 dup ACKs par fast retransmit, SACK.
- **Flow vs congestion control:** flow receiver ko bachata hai (window); congestion network ko (slow start, CUBIC, BBR).
- **HOL blocking:** ek packet loss pe poora in-order stream ruk jata hai; QUIC per-stream ordering se fix karta hai.
- **UDP kab:** calls, video, gaming, DNS; latency chahiye, thoda loss chalta hai.
- **Pooling:** TCP+TLS setup mahanga hai (2 RTT); keep-alive aur connection pool use karo.
- **TCP byte stream hai:** message boundaries preserve nahi hoti.

**Interview me bolo:** "TIME_WAIT bahut hain to pehle connection reuse karunga (pooling, keep-alive), kyunki har request pe naya connection ephemeral ports khatam kar deta hai."

**Galti mat karna:** Flow control aur congestion control ko ek mat bolo; "UDP unreliable hai to kabhi mat use karo" mat bolo (QUIC UDP pe hai).
