**Ek line:** 15–20 numbers yaad rakho; exact nahi, sahi order of magnitude (10x ke andar) chahiye, aur har number ke baad "isliye..." bolo.

- **Latency:** RAM ~100 ns, SSD random ~100 µs, same-DC RTT ~0.5 ms, cross-AZ 1–2 ms, HDD seek ~10 ms, Mumbai→Singapore ~60 ms, India→US 150–250 ms.
- **Takeaway:** RAM >> SSD >> network >> HDD; hot data Redis me; sequential calls parallel karo.
- **Storage:** million × 1 KB = 1 GB; billion × 1 KB = 1 TB. 1 lakh = 10^5, 1 crore = 10^7.
- **Time:** 1 din ≈ 10^5 sec. 100M/day ≈ 1K QPS; 1B/day ≈ 10K QPS.
- **Peak:** 2–5x average; IPL/flash sale 10x+.
- **Per node:** app server 1K–10K QPS, Postgres writes ~5–10K/sec, reads ~10–50K/sec, Redis ~100K ops/sec.
- **Per node (more):** Kafka ~100 MB/sec, Cassandra ~10–20K writes/sec, WebSocket 100K safe (1M tuned).
- **DB storage:** ~1–5 TB comfortable, usse upar sharding.
- **Sizes:** message ~300 B–1 KB, photo ~500 KB, 1 min 720p video ~20–30 MB.
- **Rule:** number node capacity ke 50% se upar to scaling bolo.
- **Worked example:** 100M DAU photo app = 100:1 read-heavy, ~1.8 PB/year → blob + CDN, metadata DB.

**Interview me bolo:** "1 din ko 10^5 sec maanta hoon. 100M requests/day ≈ 1K QPS, peak 5x ≈ 5K. Ek Postgres 5–10K writes/sec leta hai, to writes ke liye sharding nahi, reads ke liye Redis."

**Galti mat karna:** 5 min exact arithmetic me lagana, peak bhool jaana. Bits/bytes mix karna, replication factor 3x storage me na jodna.
