**In one line:** A funnel of CDN → gateway → waiting room → Redis Lua atomic decrement → sync DB insert for ~1,000 winners, with DB constraints as the backstop.

- **Requirements:** 1M users, 1,000 units, zero oversell, no crash, bots kept out.
- **Scale:** ~500K QPS on the page (CDN), ~200K buy QPS in 10 sec, one Redis key ~100K ops/sec, only 1,000 reservations.
- **Components:** CDN, gateway (bots, rate limit), waiting room ZSET, Redis Lua, Postgres, expiry worker.
- **Redis Lua over DB row update/optimistic locking:** atomic dedup + decrement; the DB suffers lock waits and retry storms.
- **DB `CHECK(sold <= total)` + `UNIQUE(sale_id, user_id)` as backstop:** no oversell even after Redis failover.
- **Virtual waiting room over rate limit + autoscale:** fixed rate, FIFO, fair.
- **Sync DB insert over Kafka/SQS:** only ~1,000 inserts; a queue just adds lag.
- **10 min TTL reservation over decrement-after-pay:** unpaid units return; late payment gets an auto refund.
- **CDN product page:** 500K QPS stays off origin; sold out = edge flag.
- **Failure:** Redis primary crash → AOF + replica + DB constraint; hot key → split stock.
- **Senior signal:** the stock Redis key is the real SPOF; dedicated Redis, stock split, edge flag, DB backstop.

**Say in the interview:** "It is contention, not throughput. Each layer cuts load 10-100x: CDN, waiting room, Redis Lua, then only 1,000 DB writes."

**Avoid:** Trusting Redis alone for stock; ignoring bots (CAPTCHA, signed tokens).
