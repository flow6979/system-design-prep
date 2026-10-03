**Ek line:** Bade binary data (images, video, files) S3 me rakho aur CDN se user ke nazdeek edge se serve karo; DB me sirf metadata.

- **S3:** flat `bucket/key → bytes`, 11 nines durability, sasta, immutable objects.
- **Rule:** metadata DB me, bytes S3 me. Blob DB me rakhne se backup/replication slow.
- **Pre-signed URL:** server auth karke signed URL de (~15 min), client seedha S3 pe upload; app server proxy nahi.
- **Multipart/resumable:** > 100 MB ko 5–10 MB chunks me; fail chunk hi retry.
- **Dedup:** SHA-256 content hash; already hai to upload skip (Dropbox), refcount se delete.
- **CDN:** latency ~200ms → ~20ms, origin load 90%+ kam.
- **Pull vs push CDN:** pull default (pehli request miss); push bade predictable files (patches, movie launch).
- **Invalidation:** versioned URLs best (`app.a8f3c.js`), TTL, purge sirf emergency.
- **Video:** async transcoding (multiple resolutions) → 2–10 sec segments → HLS/DASH manifest, player quality switch kare.
- **Transcoding:** queue + parallel workers, upload request me sync nahi.

**Interview me bolo:** "Bytes S3 me, metadata DB me. Upload pre-signed URL se, bade files multipart + resumable. Reads CDN se versioned URLs ke saath. Video ke liye async transcoding aur HLS."

**Galti mat karna:** Video DB BLOB me rakhna ya upload app server se proxy karna. CDN bolna bina invalidation plan ke.
