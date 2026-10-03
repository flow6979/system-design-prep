**Ek line:** Files S3 me, metadata DB me; client pre-signed URL se seedha S3 pe upload kare aur reads CDN se jaayein.

- **Model:** flat key-value; bucket + key + metadata; folders asli nahi, `/` naam ka hissa; object immutable.
- **DB me BLOB nahi:** DB bloat, backups slow, mehenga; default = blob S3 me, metadata DB me.
- **Durability vs availability:** 11 nines durability; Standard 99.99% availability; dono alag cheez.
- **Consistency:** strong read-after-write (Dec 2020 se); same key pe last writer wins.
- **Limits:** object 5 TB, single PUT 5 GB; ~3500 PUT/s, 5500 GET/s per prefix.
- **Storage classes + lifecycle:** Standard, IA, Glacier; 30 din baad IA, 6 mahine baad Glacier, 7 saal baad delete.
- **Multipart:** 100 MB+ ke liye, parallel, fail part retry; `AbortIncompleteMultipartUpload` rakho.
- **Pre-signed URL:** time-limited (5-15 min upload), bytes app server se nahi guzarte; size limit ke liye presigned POST.
- **CDN:** bucket private + OAC; cache-bust ke liye naya key, invalidation nahi.
- **Rename/List:** rename = `CopyObject` + `DeleteObject`; LIST slow, queries metadata DB me.
- **Flow:** row `PENDING`, pre-signed PUT, S3 event, `UPLOADED`; orphan cleanup job; dedup `sha256` key se.

**Interview me bolo:** "Bytes S3 me, metadata Postgres me. Client pre-signed URL se multipart upload karega, S3 event se status update, reads CloudFront se private bucket."

**Galti mat karna:** Bucket public kar dena, ya `ListObjectsV2` ko DB query ki tarah use karna.
