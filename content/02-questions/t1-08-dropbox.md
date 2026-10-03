---
title: Design Dropbox / Google Drive
order: 8
tier: 1
time: 25
patterns: [Chunking, Dedup, Blob storage, Sync, Versioning]
topics: [12-blob-storage-cdn, 08-real-time-communication, 06-cap-consistency, 02-sql-vs-nosql, 07-message-queues-kafka, 10-idempotency-retries]
askedAt: [Dropbox, Google, Microsoft, Amazon, Atlassian]
---

# Design Dropbox / Google Drive

**Ek line me:** user apni files upload karta hai, woh uske saare devices (laptop, phone) pe sync ho jaati hain, aur woh doosron ke saath share kar sakta hai. Core challenge ye hai ki **badi files efficiently sync hon** (sirf badla hua hissa), aur **do devices pe ek saath edit** ho to data lose na ho.

**Is question me interviewer kya check karta hai:** metadata aur file bytes ko alag rakhna, chunking + dedup, sync protocol (notifications), conflict handling, aur versioning.

---

## Step 1: Interviewer se ye confirm karo (3–5 min)

Design shuru karne se pehle ye sawal poochho:

| Tum poochho | Typical jawab | Design pe asar |
|---|---|---|
| "Scope me upload, download, multi-device sync aur sharing hai?" | Haan | 4 core flows |
| "Real-time collaborative editing (Google Docs jaisa) chahiye?" | Nahi, sirf file sync | OT/CRDT nahi chahiye, conflict copy chalega |
| "Max file size?" | 50 GB tak | Chunking must |
| "Kitne users aur data?" | 100M users, avg 10 GB/user | ~1 EB storage, dedup se bachat |
| "Sync kitni jaldi dikhna chahiye?" | Kuch seconds me | Push notification (long poll/WebSocket) |
| "Version history kitne din?" | 30 din | Purane chunks 30 din tak rakhne hain |

> **Bolo:** "Main metadata (files, folders, versions, chunks ki list) aur actual bytes (chunks) ko bilkul alag rakhunga. Metadata strongly consistent SQL me, bytes S3 me. Sync ke liye clients ko change notifications push honge."

## Step 2: Requirements

**Functional (users ye kar sakein)**
1. User file (50 GB tak) upload/download kar sake, resume ke saath
2. Ek device pe change ho to baaki devices pe khud sync ho
3. File/folder share kar sake (view/edit permission)
4. Purane versions (30 din) dekh ke restore kar sake

**Out of scope:** real-time collaborative editing (OT/CRDT), full-text search, previews, billing.

**Non-functional (priority order me)**
1. **Durability:** file kabhi lose na ho (11 nines, S3)
2. **Metadata consistency:** commit/rename/version strongly consistent, koi edit chupchaap lose nahi
3. **Sync latency:** doosre device pe change < 5 sec me dikhe. Bandwidth: sirf badle chunks
4. **Scale + availability:** 100M users, ~1 EB, ~2.5K commits/sec, 99.99% (offline edit support)

**CAP choice:** metadata pe consistency (shard ka primary down to us user ke writes thodi der ruk jayein, par conflict galat resolve na ho). Devices ke beech sync eventual: notification late ho sakta hai, cursor se recover.

## Step 3: Estimation (sirf jo design badle)

- 100M users × 10 GB = **~1 EB**. Dedup (same file kai users ke paas, jaise same PDF) se 20–30% bachat.
- 4 MB chunk → 1 EB / 4 MB = **~250B chunks**. Chunk metadata table bahut badi, sharding chahiye.
- Daily active 20M, har ek ~10 file changes → **200M changes/day ≈ 2.5K/sec**. Notifications ka fan-out har user ke 2–3 devices tak.

> **Bolo:** "Storage EB level pe hai, isliye bytes S3 jaise blob store me aur dedup zaroori hai. Write QPS moderate hai, isliye metadata ke liye sharded SQL theek hai."

## Step 4: Core entities

- **User**: id, email, quota_used
- **File**: id, owner_id, parent_folder_id, name, is_folder, latest_version, deleted
- **FileVersion**: file_id, version, chunk_hashes (ordered list), size, created_by_device, created_at
- **Chunk**: hash (SHA-256), s3_key, size, ref_count
- **Device**: id, user_id, last_cursor (kahan tak sync hua)
- **Share/ACL**: file_id, user_id, role (`VIEWER`, `EDITOR`)

## Step 5: APIs

```http
POST /files/upload-init  {path, size, chunkHashes[]}    → {fileId, missingChunks[{hash, presignedUrl}]}
PUT  <presigned S3 URL>                                 → 200   (sirf missing chunks)
POST /files/{id}/commit  {baseVersion, chunkHashes[]}   → {version} ya 409 conflict
GET  /files/{id}?version=5                              → {chunkHashes, presigned download URLs}
GET  /changes?cursor=abc123                             → {changes[], newCursor}   (long poll)
POST /files/{id}/share   {email, role}                  → 200
```

> **Bolo:** "Client pehle chunk hashes bhejta hai. Server batata hai kaunse chunks uske paas nahi hain. Sirf woh upload hote hain. Isi se dedup aur delta sync dono milte hain."

## Step 6: High-level design

**Simple v1 pehle:** client → ek Metadata Service → Postgres (files, versions, change_log) + S3 (chunks via pre-signed URL). Devices `/changes?cursor=` poll karein. Ye saare FRs pura karta hai. Phir: 100M devices ka polling faltu load → long-poll Notification Service. ~1 EB aur 250B chunk rows → sharded SQL. Har request pe ACL parent-chain walk → Redis cache.

```mermaid
flowchart LR
  C["Desktop/Mobile client"] --> G["API Gateway"]
  G --> MS["Metadata Service"]
  G --> NS["Notification Service"]
  MS --> DB[("Metadata DB - sharded SQL + change_log")]
  MS --> RC[("Redis cache + pub/sub")]
  C -- "chunks via presigned URL" --> S3[("S3 block storage")]
  MS --> S3
  RC -- "user 7 changed" --> NS
  NS -- "long poll / WebSocket" --> C
```

**FR mapping:** FR1 → client chunking + pre-signed S3 + Metadata commit, FR2 → change_log + Notification Service + cursor, FR3 → `shares` ACL in Metadata DB, FR4 → `file_versions` + S3 chunks.

**Har component kyun:**
- **Client (sync agent):** file watcher, chunking, hashing, local DB of last synced state. Bandwidth NFR yahin se.
- **Metadata Service + sharded SQL:** files, versions, chunk list, permissions; consistency NFR. ~2.5K commits/sec SQL ke liye moderate, sharding sirf EB-scale rows ki wajah se.
- **S3 block storage:** chunks content hash se (`chunks/<sha256>`). Durability NFR, sasta. DB me BLOB nahi.
- **change_log table (Kafka nahi):** commit ke saath usi transaction me per-user `seq` row likho. Ye sync ka source of truth hai aur outbox bhi. Kafka nahi kyunki ~2.5K events/sec hai aur ek hi real consumer (notifications); replay devices cursor se already kar lete hain.
- **Redis pub/sub + Notification Service:** commit ke baad `PUBLISH user:7`, jis node pe user ke long polls hold hain woh jagta hai. Message miss ho to chalta hai, cursor se recover. Simpler option fixed polling: 100M devices × har 30 sec = ~3M faltu req/sec.
- **Redis cache:** ACL parent chain aur hot folder listings. Simpler option read replicas, par har request pe 5–10 level parent walk DB pe mehenga.

## Step 7: Main flow: file edit aur doosre device pe sync

```mermaid
sequenceDiagram
  participant L as Laptop
  participant M as Metadata Service
  participant S as S3
  participant K as Redis pubsub
  participant N as Notification Service
  participant P as Phone
  L->>L: file changed, split into 4MB chunks, hash each
  L->>M: upload-init with 25 chunk hashes
  M-->>L: only chunk 7 is missing, presigned URL
  L->>S: PUT chunk 7
  L->>M: commit baseVersion 4, new chunk list
  M->>M: v4 is latest, save v5 and change_log row in one txn
  M->>K: PUBLISH user 7 changed
  K->>N: wake up
  N-->>P: long poll returns, changes available
  P->>M: GET /changes with cursor
  M-->>P: file 42 v5 chunk list
  P->>S: download chunk 7 only
```

## Step 8: Data model & DB choice

```sql
files(id PK, owner_id, parent_id, name, is_folder, latest_version, deleted_at,
      UNIQUE(parent_id, name))
file_versions(file_id, version, size, chunk_hashes JSON, device_id, created_at,
      PRIMARY KEY(file_id, version))
chunks(hash PK, s3_key, size, ref_count)
shares(file_id, user_id, role, PRIMARY KEY(file_id, user_id))
change_log(user_id, seq, file_id, version, op, PRIMARY KEY(user_id, seq))
```

- **Metadata → MySQL/Postgres, sharded by owner_id (namespace):** ek user ki saari files ek shard pe, folder move/rename ek transaction me. Dropbox ne yahi kiya (Edgestore on MySQL).
- **Chunks → S3**, key = content hash. Same content = same key = automatic dedup.
- **change_log** per user ek monotonically badhta `seq`, commit ke same transaction me. Device ka cursor bas last `seq` hai.
- **`chunks` table hash se sharded** (250B rows), metadata owner se. Isliye `ref_count` update version commit ke transaction me nahi; GC dobara verify karta hai.

## Step 9: Deep dives (interviewer yahin pressure dalega)

### 9.1 Chunking + dedup + delta sync
**NFR:** bandwidth (sirf badle chunks) + 50 GB resumable upload.
- File ko **4 MB chunks** me todo, har chunk ka SHA-256. File version = chunks ki ordered list.
- 1 GB file me ek line badli → sirf 1 chunk (4 MB) upload, 1 GB nahi.
- Dedup: upload-init me server `chunks` table me hash dekhta hai. Hai to skip. Doosre user ne same file upload ki thi to bhi skip (cross-user dedup).
- **Fixed-size chunk ki problem:** file ke shuru me 1 byte add kiya to saare boundaries shift, saare chunks naye. Fix: **content-defined chunking** (rolling hash, Rabin fingerprint) jo boundaries content se decide karta hai.
- Security note: cross-user dedup se "ye file kisi ke paas hai ya nahi" leak ho sakta hai. Sensitive setups me per-user dedup.
- **Trade-off:** client pe CPU (hashing) aur 250B rows ki chunk table, badle me bandwidth aur storage bachat.

### 9.2 Sync: devices ko kaise pata chale?
**NFR:** change doosre device pe < 5 sec, notification miss pe bhi data na chhoote.
- **Polling har 30 sec:** simple, par 100M devices × faltu requests.
- **Long polling:** client `GET /changes?cursor=X` bhejta hai, server tab tak hold karta hai jab tak change na ho (max 60 sec). Dropbox yahi use karta hai. Firewall-friendly.
- **WebSocket:** bi-directional, mobile/web pe achha.
- Notification sirf "kuch badla" batata hai. Asli data client cursor se `/changes` pe fetch karta hai. Notification miss ho gaya to bhi next poll pe sab mil jayega.
- Offline device wapas aaya → apne last cursor se saare changes le leta hai.
- Wake-up signal Redis pub/sub se (fire-and-forget). Shared folder pe change ho to har member user ko publish.
- **Trade-off:** lakhon open long-poll connections hold karne padte hain (stateful Notification nodes), par polling se 100x kam requests.

### 9.3 Conflict handling
**NFR:** koi edit chupchaap lose na ho.
- Commit me client `baseVersion` bhejta hai (jis version pe edit shuru kiya). Ye **optimistic concurrency** hai.
- `UPDATE files SET latest_version=5 WHERE id=42 AND latest_version=4`. 0 rows → **409 conflict**.
- Conflict pe data lose nahi karte: doosre wale ki file **"report (Vaibhav's conflicted copy).docx"** naam se save. User khud merge kare.
- Collaborative real-time edit chahiye to alag design (OT/CRDT), wo [Google Docs](../02-questions/t2-19-google-docs.md) me.
- **Trade-off:** user ko conflicted copy khud merge karni padti hai; auto-merge nahi.

```mermaid
flowchart LR
  A["Laptop edit on v4"] --> M["Metadata Service"]
  B["Phone edit on v4"] --> M
  M -- "first commit wins" --> V5["v5 saved"]
  M -- "second gets 409" --> CC["Conflicted copy created"]
```

### 9.4 Versioning, sharing, pre-signed URLs
**NFR:** durability + 30 din version history bina storage double kiye.
- **Versioning:** naya version = nayi chunk list. Purane chunks reuse hote hain, isliye versions saste hain. `ref_count` 0 hone pe aur 30 din baad garbage collector chunks delete kare.
- **Sharing:** `shares` table me ACL. Folder share hua to child files pe permission inherit (check karte waqt parent chain dekho, cache karo).
- **Pre-signed URLs:** download/upload hamesha direct S3 se, short TTL (15 min). Metadata Service permission check karke hi URL deta hai. Public link ke liye ek random token wala share link.
- **Trade-off:** inherited ACL check mehenga, isliye cache; permission revoke pe cache invalidate karna padta hai.

## Step 10: Decision table (kya chuna, kyun, kya nahi)

| Decision | Kyun chuna | Kya nahi chuna, kyun |
|---|---|---|
| **Metadata aur bytes alag** | Metadata chhota, transactional. Bytes bade, blob store me sasta | **Sab ek DB me (BLOB column):** DB bloat, backup slow. **Sacrifice:** do systems ke beech orphan chunks, GC chahiye |
| **4 MB chunks + SHA-256** | Delta sync, dedup, parallel aur resumable upload | **Poori file upload:** 1 line change pe 1 GB dobara. **Sacrifice:** client CPU + badi chunk table |
| **Content hash as S3 key** | Same content ek baar store, dedup free me | **Random UUID keys:** same file ki 1000 copies. **Sacrifice:** cross-user dedup se existence leak risk |
| **Sharded SQL for metadata** | Folder move/rename transaction, unique names, strong consistency | **Cassandra/DynamoDB:** multi-row transactions nahi, conflicting renames mushkil. **Sacrifice:** cross-shard share/move pe extra kaam |
| **change_log table + Redis pub/sub** for sync | ~2.5K commits/sec, cursor replay DB se, wake-up sasta | **Kafka:** ek hi consumer, low volume, extra cluster ka ops cost. **Sacrifice:** naye consumers (search, audit) aaye to Kafka pe jaana padega |
| **Long poll + cursor** for sync | Near real-time, firewall-friendly, miss pe cursor se recover | **Fixed polling:** ~3M faltu req/sec. **Sirf push data:** miss hua to out of sync. **Sacrifice:** lakhon open connections |
| **Optimistic concurrency + conflicted copy** | Data kabhi lose nahi, lock ka wait nahi | **Last-write-wins:** kaam chupchaap delete. **File lock:** offline device lock pakad ke baithega. **Sacrifice:** manual merge |
| **Pre-signed URLs** | Bytes app servers se nahi guzarte | **Proxy through servers:** bandwidth bottleneck. **Sacrifice:** URL leak hua to TTL tak valid |

## Step 11: Failures & bottlenecks

| Kya fail hua | Kya hoga | Handle kaise |
|---|---|---|
| Upload beech me ruka | Kuch chunks gaye, commit nahi hua | Commit tak version nahi banta. Resume pe missing chunks hi bhejo |
| Chunk upload hua par commit fail | Orphan chunks S3 me | GC job: kisi version me referenced nahi aur 7 din purane, to delete |
| Notification miss | Device ko pata nahi chala | Cursor based `/changes`, next long poll pe sab milega |
| Metadata shard down | Us user ki files read-only/unavailable | Primary-replica, auto failover. Bytes S3 me safe |
| Hot shared folder (company-wide) | Ek shard pe load, bada fan-out | Read replicas + cache, notifications batch karo |
| S3 region outage | Downloads fail | Cross-region replication, durability ke liye multi-AZ |

## Step 12: "Isko aur better kaise karein" (end me khud bolo)

> "Agar aur time ho to main ye improve karunga:"
- **Content-defined chunking** (rolling hash) taaki file ke beech me insert pe bhi sirf 1–2 chunks badlein
- **Compression** chunks pe upload se pehle (text files 5–10x chhoti)
- **LAN sync:** same office ke do laptops chunks ek doosre se le lein, internet bandwidth bache
- **Cold storage tiering:** 1 saal se nahi khuli files S3 Glacier/IA me, cost 50%+ kam
- **Client-side encryption** option sensitive users ke liye (dedup per-user ho jayega)
- **Batch commits:** 1000 chhoti files ek saath (npm folder) ek API call me

## Step 13: Interviewer ke likely follow-up sawal

- "1 GB file me 1 byte badla to kitna upload hoga?" → sirf ek 4 MB chunk → Step 9.1
- "Do devices ne offline same file edit ki?" → baseVersion check, doosra conflicted copy → Step 9.3
- "Device ko kaise pata ki change hua?" → long poll + cursor → Step 9.2
- "Dedup se security risk?" → hash se file existence leak. Per-user dedup ya convergent encryption
- "File delete ki to storage turant free?" → nahi, soft delete + 30 din version history, phir ref_count GC
- "Folder rename me 1 lakh files?" → sirf folder row ka name badlo, children `parent_id` se linked hain, unhe chhoona nahi padta
- "Kafka kyun nahi lagaya?" → ~2.5K commits/sec, ek consumer. change_log table hi durable log hai; search/audit jaise consumers aayein tab outbox → Kafka
- **Senior signal:** khud bolo ki company-wide shared folder hot shard aur fan-out problem banega (ek commit → 10K users ko wake-up), aur shard boundaries ke paar share/move cross-shard transaction maangta hai; isliye shared folder ko apna namespace do.

## 2-minute recap (interview se pehle ye padho)

> Dropbox me metadata aur bytes alag hain. Client file ko 4 MB chunks me todta hai aur har chunk ka SHA-256 nikaalta hai. Upload-init me hashes bhejta hai, server batata hai kaunse missing hain, sirf woh pre-signed URL se seedha S3 jaate hain (dedup + delta sync). Commit pe nayi chunk list ek naya version banti hai, `baseVersion` check se optimistic concurrency, aur conflict pe "conflicted copy". Metadata sharded SQL (owner ke hisaab se) me, strongly consistent. Har commit usi transaction me `change_log` row likhta hai (Kafka nahi, sirf ~2.5K/sec aur ek consumer), Redis pub/sub se Notification Service long poll/WebSocket pe baaki devices ko jagata hai, aur device apne cursor se changes fetch karta hai. Versions purane chunks reuse karte hain, GC ref_count se. Sharing ACL table se, downloads short-TTL pre-signed URLs se.

## Checklist

- [ ] Metadata service aur block storage alag kyun hain samjha sakta hoon
- [ ] Chunking + content hash se dedup aur delta sync explain kar sakta hoon
- [ ] Long poll + cursor based sync flow draw kar sakta hoon
- [ ] baseVersion se conflict detect karna aur conflicted copy bata sakta hoon
- [ ] Versioning aur garbage collection (ref_count) samjha sakta hoon
- [ ] Sharing permissions aur pre-signed URLs ka role bata sakta hoon
- [ ] HLD diagram 5 min me bana sakta hoon
- [ ] Decision table ke 3 trade-offs bina dekhe bol sakta hoon
