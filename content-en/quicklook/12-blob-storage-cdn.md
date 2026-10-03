**In one line:** Store large binary data (images, video, files) in S3 and serve it from the CDN edge nearest the user; only metadata goes in the DB.

- **S3:** flat `bucket/key → bytes`, 11 nines durability, cheap, immutable objects.
- **Rule:** metadata in DB, bytes in S3. Blobs in the DB slow backups and replication.
- **Pre-signed URL:** server authorizes and hands out a signed URL (~15 min); client uploads straight to S3, no app-server proxy.
- **Multipart/resumable:** split files over 100 MB into 5–10 MB chunks; retry only the failed chunk.
- **Dedup:** SHA-256 content hash; skip upload if it exists (Dropbox), refcount before deleting.
- **CDN:** latency ~200ms → ~20ms, origin load down 90%+.
- **Pull vs push CDN:** pull is the default (first request misses); push for large predictable files (patches, movie launches).
- **Invalidation:** versioned URLs are best (`app.a8f3c.js`), then TTL; purge only for emergencies.
- **Video:** async transcoding (multiple resolutions) → 2–10 sec segments → HLS/DASH manifest, player switches quality.
- **Transcoding:** queue plus parallel workers, never inside the upload request.

**Say in the interview:** "Bytes in S3, metadata in DB. Uploads via pre-signed URL, large files multipart and resumable. Reads through CDN with versioned URLs. Video gets async transcoding and HLS."

**Avoid:** Video in a DB BLOB column, or proxying uploads through the app server. Saying CDN with no invalidation plan.
