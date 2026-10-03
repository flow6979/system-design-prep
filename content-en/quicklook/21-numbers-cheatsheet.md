**In one line:** Memorize 15–20 numbers; you need the right order of magnitude (within 10x), not exactness, and every number should end with "so...".

- **Latency:** RAM ~100 ns, SSD random ~100 µs, same-DC RTT ~0.5 ms, cross-AZ 1–2 ms, HDD seek ~10 ms, Mumbai→Singapore ~60 ms, India→US 150–250 ms.
- **Takeaway:** RAM >> SSD >> network >> HDD; keep hot data in Redis; parallelize sequential calls.
- **Storage:** million × 1 KB = 1 GB; billion × 1 KB = 1 TB. 1 lakh = 10^5, 1 crore = 10^7.
- **Time:** 1 day ≈ 10^5 sec. 100M/day ≈ 1K QPS; 1B/day ≈ 10K QPS.
- **Peak:** 2–5x average; IPL/flash sale 10x+.
- **Per node:** app server 1K–10K QPS, Postgres writes ~5–10K/sec, reads ~10–50K/sec, Redis ~100K ops/sec.
- **Per node (more):** Kafka ~100 MB/sec, Cassandra ~10–20K writes/sec, WebSockets 100K safe (1M tuned).
- **DB storage:** ~1–5 TB comfortable, beyond that think sharding.
- **Sizes:** message ~300 B–1 KB, photo ~500 KB, 1 min 720p video ~20–30 MB.
- **Rule:** if a number exceeds 50% of one node's capacity, talk scaling.
- **Worked example:** 100M DAU photo app = 100:1 read-heavy, ~1.8 PB/year → blob storage + CDN, metadata in DB.

**Say in the interview:** "I'll treat a day as 10^5 seconds. 100M requests/day ≈ 1K QPS, peak 5x ≈ 5K. One Postgres does 5–10K writes/sec, so no write sharding yet, but Redis for reads."

**Avoid:** Spending 5 min on exact arithmetic, or forgetting peak. Mixing bits and bytes, or forgetting the 3x replication factor in storage.
