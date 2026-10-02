---
title: Design Google Docs (Collaborative Editing)
order: 19
tier: 2
time: 20
patterns: [Real-time sync, OT vs CRDT, Single owner per document, Event log + snapshot]
topics: [08-real-time-communication, 04-sharding-consistent-hashing, 07-message-queues-kafka, 05-caching, 06-cap-consistency]
askedAt: [Google, Microsoft, Atlassian, Notion, Zoho]
---

# Design Google Docs (Collaborative Editing)

**In one line:** many people edit the same document at the same time, everyone sees each other's changes in ~100ms, and in the end **everyone has exactly the same document**.

**What the interviewer checks in this question:** how you resolve conflicts between concurrent edits (OT vs CRDT), how you route WebSocket connections, and how you keep document history/storage.

---

## Step 1: Clarify with the interviewer (3–5 min)

| You ask | Typical answer | Impact on design |
|---|---|---|
| "Only text documents? Sheets/Slides out of scope?" | Only rich text | One data model: characters + formatting |
| "How many people edit one document at the same time, at most?" | ~100 editors, up to 1000 viewers | One doc will fit on one server |
| "How fast must edits show for others?" | < 200ms | We need WebSocket, not polling |
| "Do we need offline editing?" | Yes, basic | Pending ops queue on the client + rebase on reconnect |
| "Do we need version history and cursors/presence?" | Yes | Op log + snapshots, presence on a separate ephemeral channel |
| "Comments, suggestions mode, export to PDF?" | Out of scope | Mention them and move on |

> **Say:** "I will focus on real-time concurrent editing: every editor's change reaches everyone quickly, and everyone converges to the same final state. Along with that, presence, version history and permissions."

## Step 2: Requirements

**Functional**
1. Create, open and edit a document
2. Multiple users edit at the same time and see each other's changes live
3. Other users' cursors and "who is online" are shown
4. Users can see version history and restore an old version
5. Sharing: owner / editor / viewer permissions

**Non-functional**
- **Convergence:** all clients see the same document in the end (most important)
- **Low latency:** edit propagation < 200ms
- **Durability:** an acknowledged edit is never lost
- **Availability:** a doc must open. If a doc's server goes down, fail over quickly

## Step 3: Estimation (only what changes the design)

- 100M DAU, ~10M documents open at peak → **~10M concurrent WebSockets**. One server ~50K connections → **~200+ WebSocket servers**.
- Typing: one active editor ~2–5 ops/sec. 10M active editors → **~20–50M ops/sec** in total, but only a few hundred ops/sec per doc. So the **per-doc** load is small, the total is big.
- One op ~100 bytes. A busy doc's op log grows to MBs in a month, so we need **snapshots** so that we do not replay the whole log on load.

> **Say:** "Total ops are very high, but the load on one document is small. So I will make the document the unit of sharding: all traffic for one doc goes to one server."

## Step 4: Core entities

- **Document**: doc_id, title, owner_id, latest_snapshot_version, created_at
- **Operation**: doc_id, version (monotonic), user_id, op (insert/delete/format at position), timestamp
- **Snapshot**: doc_id, version, full content (blob)
- **Permission**: doc_id, user_id, role (`OWNER`, `EDITOR`, `VIEWER`)
- **Presence** (ephemeral): doc_id, user_id, cursor position, color

## Step 5: APIs

```http
POST /docs                               → {docId}
GET  /docs/{docId}                        → {snapshot, version}
GET  /docs/{docId}/history?before=v500    → list of versions
POST /docs/{docId}/restore {version}      → new version
POST /docs/{docId}/share {userId, role}

WS   /docs/{docId}/live
  client → server: {type: "op", baseVersion: 120, op: {insert "a" at 15}}
  server → client: {type: "ack", version: 121}
  server → client: {type: "op", version: 122, op: {...}, userId}
  client ↔ server: {type: "cursor", pos: 40}
```

> **Say:** "With every op, the client sends its `baseVersion`, meaning the version it was looking at when it made the edit. From this the server knows which ops it missed in between and what to transform."

## Step 6: High-level design

```mermaid
flowchart LR
  C["Browser editor"] --> LB["Load Balancer"]
  LB --> API["Doc API Service"]
  LB --> R["WS Router"]
  R -- "hash of doc_id" --> DS["Document Server - owner of doc"]
  R --> ZK[("Ring membership - ZooKeeper")]
  DS --> OL[("Op log - Cassandra")]
  DS --> PR[("Redis presence")]
  DS --> K[["Kafka"]]
  K --> SN["Snapshot Worker"]
  SN --> S3[("Snapshots - S3")]
  API --> MD[("Postgres - docs + permissions")]
  API --> S3
```

**Why each component:**
- **WS Router:** maps `doc_id` to one Document Server with consistent hashing. All editors of the same doc land on the **same server**.
- **Document Server:** the single owner of that doc. It orders ops, runs the OT transform, assigns version numbers, and broadcasts to everyone.
- **Op log (Cassandra):** append-only, `doc_id` partition, `version` clustering key. Write-heavy and sequential, Cassandra is the best fit.
- **Snapshot Worker:** writes a full document snapshot to S3 every N ops (say 500).
- **Postgres:** doc metadata and permissions. Relational, small, needs strong consistency.
- **Redis presence:** cursors and online users. Ephemeral, with a TTL.

## Step 7: Main flow: two people typing at the same time

```mermaid
sequenceDiagram
  participant A as Alice
  participant B as Bob
  participant DS as Document Server
  participant L as Op Log
  A->>DS: op insert X at 5, baseVersion 10
  B->>DS: op delete at 2, baseVersion 10
  DS->>DS: Alice op becomes v11
  DS->>L: append v11
  DS-->>A: ack v11
  DS-->>B: op v11 from Alice
  DS->>DS: transform Bob op against v11
  DS->>L: append v12
  DS-->>B: ack v12
  DS-->>A: op v12 from Bob, transformed
```

Bob's op was on `baseVersion 10`, but the server is now at v11. The server **transforms** Bob's op against Alice's op, then applies it. The client side runs the same transform for incoming ops too.

## Step 8: Data model & DB choice

```sql
-- Cassandra
operations(doc_id, version, user_id, op_blob, ts, PRIMARY KEY (doc_id, version))

-- Postgres
documents(doc_id PK, title, owner_id, snapshot_version, snapshot_url, updated_at)
permissions(doc_id, user_id, role, PRIMARY KEY (doc_id, user_id))
```

Doc load: get the latest snapshot from S3 + the ops after it from Cassandra with `WHERE doc_id = ? AND version > snapshot_version`. Only a few hundred ops need to be replayed.

## Step 9: Deep dives (where the interviewer will push)

### 9.1 OT vs CRDT: how will you resolve conflicts?
Problem: the doc is "CAT". Alice inserts "S" at position 0 ("SCAT"). At the same time, Bob deletes position 2 ("T"). If Bob's op is applied as-is, we get "SCT", which is wrong. The correct result is "SCA".
- **OT (Operational Transformation):** the server applies ops in one order. It shifts a late op against the ops that came before it. Bob's "delete at 2" → Alice added 1 char before it, so it becomes "delete at 3". Simple idea: **adjust the position**.
- **CRDT:** every character gets a unique ID (like `userId + counter`) and position is decided by ID, not by index. Merge in any order and the result is the same. No central server needed.

**We choose OT** because we have a central owner server for each doc that gives us ordering. OT data stays small (plain text + ops). With CRDT, every character carries metadata and tombstones, so memory is 2–10x. Choose CRDT when peer-to-peer or offline-first is very heavy (some cases like Figma, Notion).

> **Say:** "Google Docs itself uses OT with a central server. Having a central server makes the hard part of OT (keeping transforms correct for all orderings) simple, because we only need client-server transforms."

### 9.2 Document server ownership and failover
- Consistent hashing ring (membership in ZooKeeper/etcd). `hash(doc_id)` → owner server. All editors connect there.
- The owner server keeps the doc's current state + version in memory.
- Server dies → the ring updates, and the doc moves to a new server. The new server rebuilds the state from the snapshot + op log (a few hundred ms). Clients reconnect and resend their un-acked ops with `baseVersion`.
- The op log write happens **before the ack**. So an acked op is never lost.

### 9.3 Offline edits
- The client keeps a local queue of pending ops (IndexedDB). While offline, ops keep applying locally.
- On reconnect: fetch all ops after `baseVersion` from the server, transform your pending ops against them, then send. If the offline edits are very old (like 1 week), there are more conflicts, so show the user "conflicting changes".

### 9.4 Cursors, presence and version history
- **Cursors:** `cursor` messages on the same WebSocket, but they **do not go into the op log**. Throttle them (~50ms). "Online users" in Redis with a 30s TTL.
- **Version history:** any version can be rebuilt from snapshots + ops. In the UI, do not show every op, show "groups of 5 min of edits" instead. Restore = apply the old content as new ops (history is not deleted).
- **Permissions:** check at WebSocket connect time and cache on the server. The server rejects ops from viewers. On a permission change, a Kafka event → the document server downgrades the connection.

## Step 10: Decision table (what we chose, why, and what we did not)

| Decision | Why we chose it | What we did not choose, and why |
|---|---|---|
| **OT + central server** | The server gives ordering, small data, proven (Google Docs) | **CRDT:** an ID + tombstones per char, more memory. With a central server we do not need its main benefit (no coordinator) |
| **WebSocket** | Bi-directional, low latency, both ops + cursors | **Polling:** too many requests for 200ms latency. **SSE:** server → client only, sending edits needs separate HTTP |
| **One doc = one owner server (consistent hashing)** | Simple ordering, in-memory state, no distributed lock | **Any server for any doc:** distributed lock or DB ordering on every op, slow |
| **Op log + snapshots** | History comes for free, fast load, durable | **Saving only the latest doc:** no history, and rewriting the whole doc on every keystroke is costly |
| **Cassandra** for op log | Append-heavy, partition by doc_id, linear scale | **Postgres:** needs a lot of sharding for this many ops/sec. **Kafka as store:** per-doc range reads are awkward |
| **Presence separate and ephemeral** | Cursor updates are very frequent and temporary | **Cursor in the op log:** fills the log with junk, messes up history |

## Step 11: Failures & bottlenecks

| What failed | What happens | How to handle |
|---|---|---|
| Document server crash | Editors of that doc disconnect | New owner from the ring, rebuild from snapshot + log, clients reconnect and resend un-acked ops |
| Network partition, two servers think they are the owner | Two different orderings, split brain | Lease/fencing token: check the owner epoch on op log writes, reject writes from the old owner |
| Viral doc (10K viewers) | Broadcast load on one server | Send viewers to a read-only fan-out tier, editors stay on the owner |
| Op log is very long | Doc load is slow | Snapshot every 500 ops, old ops to cold storage |
| Client bug, wrong transform | The client's doc diverges | Periodic checksum compare. On mismatch, the client reloads a fresh snapshot |

## Step 12: How to make it better (say this yourself at the end)

> "If I had more time, I would improve these:"
- **Read-only fan-out tier:** separate broadcast servers for viewers of big docs, less load on the owner
- **Multi-region:** the doc's owner sits in the region with the most editors. Move the owner region (migration) when editors shift
- **Op compaction:** merge continuous inserts like "a", "b", "c" into one op to keep the log small
- **Suggestions mode and comments:** anchor comments to a text range, which keeps shifting with OT
- **End-to-end checksum** every N ops, so silent divergence is caught right away

## Step 13: Likely follow-up questions

- "The difference between OT and CRDT in simple words?" → OT adjusts positions and needs a central order. CRDT gives every char a unique ID, and merging in any order gives the same result
- "What if two people type at the same spot at the same time?" → the op the server receives first goes first. On a tie, a deterministic order by userId
- "Will edits be lost if the server crashes?" → acked ops are in the log, not lost. The client resends un-acked ones
- "What if 1 million people view one doc?" → read-only fan-out + CDN snapshot for viewers, editors are limited
- "How does undo work?" → build the inverse of the user's own last op and send it as a new op (with transform)

## 2-minute recap (read this before the interview)

> In Google Docs every document has one owner Document Server, chosen with consistent hashing (`hash(doc_id)`). All editors connect to that server over WebSocket. The client sends every op with a `baseVersion`. The server orders ops, transforms late ops with OT, appends to the Cassandra op log, then acks and broadcasts to everyone. We use OT because the central server gives ordering and we do not want CRDT's memory overhead. To load fast, a snapshot goes to S3 every 500 ops. Version history comes from snapshots + ops. Cursors/presence live in ephemeral Redis, not in the op log. Offline edits sit in a client queue and are rebased on reconnect. On a server crash, the new owner rebuilds from the log, and a fencing token prevents split brain.

## Checklist

- [ ] I can explain the OT "CAT" example by adjusting the position
- [ ] I can tell the difference between OT and CRDT and why we chose OT
- [ ] I can explain routing from doc_id to the owner server (consistent hashing)
- [ ] I can draw the HLD diagram in 5 min
- [ ] I can explain doc load and version history using op log + snapshots
- [ ] I can tell the recovery flow for a server crash and for offline edits
- [ ] I can tell 3 trade-offs from the decision table without looking
