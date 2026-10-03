**In one line:** Keep files in S3 and metadata in the DB; clients upload straight to S3 via pre-signed URLs and reads go through a CDN.

- **Model:** flat key-value; bucket + key + metadata; folders aren't real, `/` is part of the name; objects are immutable.
- **No BLOBs in the DB:** DB bloat, slow backups, costly; default = blob in S3, metadata in the DB.
- **Durability vs availability:** 11 nines durability; Standard 99.99% availability; they are different things.
- **Consistency:** strong read-after-write (since Dec 2020); last writer wins on the same key.
- **Limits:** object 5 TB, single PUT 5 GB; ~3500 PUT/s, 5500 GET/s per prefix.
- **Storage classes + lifecycle:** Standard, IA, Glacier; IA after 30 days, Glacier after 6 months, delete after 7 years.
- **Multipart:** for 100 MB+, parallel, retry only the failed part; set `AbortIncompleteMultipartUpload`.
- **Pre-signed URL:** time-limited (5-15 min upload), bytes skip the app server; presigned POST for size limits.
- **CDN:** private bucket + OAC; cache-bust with a new key, not invalidation.
- **Rename/List:** rename = `CopyObject` + `DeleteObject`; LIST is slow, so query the metadata DB.
- **Flow:** row `PENDING`, pre-signed PUT, S3 event, `UPLOADED`; orphan cleanup job; dedup with a `sha256` key.

**Say in the interview:** "Bytes in S3, metadata in Postgres. The client does a multipart upload via pre-signed URL, an S3 event updates status, and reads go through CloudFront from a private bucket."

**Avoid:** Making the bucket public, or using `ListObjectsV2` like a DB query.
