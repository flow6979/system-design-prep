**In one line:** TCP gives a reliable ordered byte stream (handshake, ACKs, flow and congestion control); UDP gives fast standalone datagrams and you build reliability yourself.

- **3-way handshake:** SYN, SYN-ACK, ACK; both sides confirm initial sequence numbers. Key exchange is TLS, not TCP.
- **SYN flood:** SYNs sent without ACKs; defence is SYN cookies.
- **4-way close:** each direction closes separately; the side closing first sits in TIME_WAIT (2xMSL, 60 s on Linux).
- **TIME_WAIT vs CLOSE_WAIT:** TIME_WAIT is normal; piling CLOSE_WAIT means the app never called close() (a bug).
- **Reliability:** sequence numbers, cumulative ACK, RTO with backoff, fast retransmit on 3 dup ACKs, SACK.
- **Flow vs congestion control:** flow protects the receiver (window); congestion protects the network (slow start, CUBIC, BBR).
- **HOL blocking:** one lost packet stalls the whole in-order stream; QUIC fixes it with per-stream ordering.
- **UDP when:** calls, video, gaming, DNS; latency matters and some loss is fine.
- **Pooling:** TCP + TLS setup costs 2 RTTs; use keep-alive and connection pools.
- **TCP is a byte stream:** it does not preserve message boundaries.

**Say in the interview:** "With many TIME_WAIT sockets I would first reuse connections via pooling and keep-alive, since a new connection per request exhausts ephemeral ports."

**Avoid:** Using flow control and congestion control as synonyms; saying "UDP is unreliable so never use it" (QUIC runs on UDP).
