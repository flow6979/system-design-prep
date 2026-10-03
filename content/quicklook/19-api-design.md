**Ek line:** Client-server contract: clear naming, sahi HTTP method, cursor pagination, idempotency, versioning, aur lambe kaam ke liye async job API.

- **REST vs gRPC vs GraphQL:** default client → REST, internal → gRPC; GraphQL jab clients ko flexible data chahiye.
- **Naming:** plural nouns (`/users/{id}/orders`), verbs nahi. Non-CRUD: `POST /payments/{id}/refund`.
- **Methods:** GET/PUT/DELETE idempotent; POST nahi; PATCH depend karta hai.
- **POST idempotent:** `Idempotency-Key` header, server key + response 24 hr store.
- **Cursor vs offset:** cursor deep pages me fast aur stable (feeds, chat); offset admin tables ke liye.
- **Cursor:** opaque base64, response me `next_cursor`.
- **Versioning:** `/v1/` URL me. Field add non-breaking; remove/rename breaking. Deprecate with timeline.
- **Auth:** JWT short expiry (15 min) + refresh; API key server-to-server; OAuth 2.0 third-party. Gateway pe.
- **Webhooks:** jaldi 200, async kaam, HMAC signature verify, `event_id` dedupe, sender retry + reconciliation.
- **Long job:** `202 Accepted` + `jobId` + poll/webhook; `QUEUED → RUNNING → DONE/FAILED`.
- **Interview me 3–5 main APIs kaafi.**

**Interview me bolo:** "Client ke liye REST `/v1/`, internal gRPC. Feed me cursor pagination, order create POST + Idempotency-Key. Transcoding upload 202 + jobId, client poll ya webhook."

**Galti mat karna:** URLs me verbs, feed ke liye offset, payment POST bina idempotency. Lamba kaam synchronous rakhna.
