**In one line:** One owner server per doc (hash + lease), ops over WebSocket, OT with central ordering, Cassandra op log plus S3 snapshots.

- **Requirements:** real-time collaborative editing (~100 ms), everyone converges to the same doc, presence, history.
- **Scale:** ~10M concurrent WebSockets (~200+ servers), 20-50M ops/sec total but only a few hundred per doc.
- **Components:** Document Servers (owner by `hash(doc_id)`), ZooKeeper lease, Cassandra op log, S3 snapshots, Postgres metadata.
- **OT + central server over CRDT:** a central server gives ordering; CRDT costs 2-10x memory.
- **One doc = one owner over any server:** in-memory state, no locking; cost is a few seconds unavailable on failover.
- **Cassandra over Postgres/Kafka for the op log:** 20-50M appends/sec, partition by doc_id.
- **Snapshot every 500 ops to S3 by the owner:** history = snapshot + ops; no Kafka worker.
- **Presence in owner memory over Redis:** cursors are ephemeral, one less hop.
- **Postgres for metadata/permissions:** small, relational, strongly consistent.
- **Failure:** split brain → epoch fencing on Cassandra writes; viral doc → viewers on a read-only fan-out tier.
- **Senior signal:** the single owner is the bottleneck; graceful drain + jittered reconnect, periodic checksum for client divergence.

**Say in the interview:** "Total ops are huge but per-doc load is small, so the document is the unit of sharding. One owner server orders ops, applies OT, and broadcasts."

**Avoid:** Letting any server accept ops (needs a lock for ordering); ignoring split brain without epoch fencing.
