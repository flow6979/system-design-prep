**Ek line:** Har doc ka ek owner server (hash + lease), WebSocket se ops, OT central ordering, Cassandra op log + S3 snapshots.

- **Requirements:** real-time collaborative edit (~100 ms), sabke paas same final doc, presence, history.
- **Scale:** ~10M concurrent WebSockets (~200+ servers), 20-50M ops/sec total par per doc sirf kuch hundred.
- **Components:** Document Servers (owner by `hash(doc_id)`), ZooKeeper lease, Cassandra op log, S3 snapshots, Postgres metadata.
- **OT + central server over CRDT:** server ordering hai, CRDT memory 2-10x.
- **One doc = one owner over any server:** in-memory state, no lock; cost failover me kuch sec unavailable.
- **Cassandra over Postgres/Kafka for op log:** 20-50M appends/sec, partition by doc_id.
- **Snapshot every 500 ops in S3 by owner:** history = snapshot + ops; Kafka worker nahi.
- **Presence in owner memory over Redis:** cursors temporary, ek hop kam.
- **Postgres for metadata/permissions:** chhota, relational, strong consistent.
- **Failure:** split brain → epoch fencing on Cassandra writes; viral doc → viewers read-only fan-out tier.
- **Senior signal:** single owner = bottleneck; graceful drain + jittered reconnect, periodic checksum for client divergence.

**Interview me bolo:** "Total ops bahut, per-doc load chhota, isliye document = unit of sharding. Ek owner server ops order karta hai, OT transform karta hai, aur broadcast."

**Galti mat karna:** Kisi bhi server pe op accept mat karo (ordering lock); split brain bina epoch fencing ke mat chhodo.
