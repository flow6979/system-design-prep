**In one line:** The client-server contract: clear naming, correct HTTP methods, cursor pagination, idempotency, versioning, and an async job API for long work.

- **REST vs gRPC vs GraphQL:** default client → REST, internal → gRPC; GraphQL when clients need flexible data.
- **Naming:** plural nouns (`/users/{id}/orders`), no verbs. Non-CRUD: `POST /payments/{id}/refund`.
- **Methods:** GET/PUT/DELETE are idempotent; POST is not; PATCH depends.
- **Idempotent POST:** `Idempotency-Key` header, server stores key + response for 24 hr.
- **Cursor vs offset:** cursor is fast and stable on deep pages (feeds, chat); offset for admin tables.
- **Cursor:** opaque base64, `next_cursor` in the response.
- **Versioning:** `/v1/` in the URL. Adding a field is non-breaking; removing/renaming is breaking. Deprecate with a timeline.
- **Auth:** JWT with short expiry (15 min) plus refresh; API key server-to-server; OAuth 2.0 for third parties. At the gateway.
- **Webhooks:** return 200 fast, work async, verify HMAC signature, dedupe on `event_id`, sender retries plus reconciliation.
- **Long job:** `202 Accepted` + `jobId` + poll/webhook; `QUEUED → RUNNING → DONE/FAILED`.
- **In the interview 3–5 main APIs are enough.**

**Say in the interview:** "REST `/v1/` for clients, gRPC internally. Cursor pagination for the feed, order create is POST with an Idempotency-Key. Transcoding upload returns 202 plus a jobId; the client polls or gets a webhook."

**Avoid:** Verbs in URLs, offset pagination for feeds, payment POST without idempotency. Keeping long work synchronous.
