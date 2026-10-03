**Ek line:** Funnel: CDN → gateway → waiting room → Redis Lua atomic decrement → sync DB insert for ~1,000 winners, DB constraints as backstop.

- **Requirements:** 10 lakh users, 1,000 units, zero oversell, no crash, bots bahar.
- **Scale:** ~5 lakh QPS page (CDN), ~2 lakh buy QPS in 10 sec, ek Redis key ~1 lakh ops/sec, sirf 1,000 reservations.
- **Components:** CDN, gateway (bots, rate limit), waiting room ZSET, Redis Lua, Postgres, expiry worker.
- **Redis Lua over DB row update/optimistic lock:** atomic dedup + decrement; DB pe lock waits aur retry storm.
- **DB `CHECK(sold <= total)` + `UNIQUE(sale_id, user_id)` backstop:** Redis failover pe bhi oversell nahi.
- **Virtual waiting room over rate limit + autoscale:** fixed-rate, FIFO, fair.
- **Sync DB insert over Kafka/SQS:** sirf ~1,000 inserts; queue bekaar lag.
- **TTL reservation (10 min) over decrement-after-pay:** unpaid units wapas; late payment auto refund.
- **CDN product page:** 5 lakh QPS origin tak nahi; sold out = edge flag.
- **Failure:** Redis primary crash → AOF + replica + DB constraint; hot key → stock split.
- **Senior signal:** stock Redis key asli SPOF hai; dedicated Redis, stock split, edge flag, DB backstop.

**Interview me bolo:** "Throughput nahi, contention problem hai. Har layer 10-100x load kam karti hai: CDN, waiting room, Redis Lua, phir sirf 1,000 DB writes."

**Galti mat karna:** Sirf Redis pe bharosa mat karo; bots (CAPTCHA, signed tokens) ignore mat karo.
