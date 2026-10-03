# HLD problem review guide (real-interview alignment)

Goal: make every problem in `content/02-questions/` (and its English mirror in `content-en/02-questions/`) match how real HLD interviews are run and scored in 2026.

## What real interviews reward (research summary)

- Flow: functional requirements (3–4 core + explicit out-of-scope) → non-functional requirements (quantified) → core entities (just nouns) → API (one endpoint per functional requirement) → high-level design that satisfies the functional requirements one by one → deep dives that satisfy the non-functional requirements. Estimation only where a number changes a decision.
- Every component must be justified by a requirement or a number: what it solves, why it beats the simpler option and the named alternatives, what we gain, what we sacrifice. Name-dropping (Kafka, Redis, Elasticsearch, Kubernetes) without this is a red flag; in mocks ~60% of candidates add Kafka without a reason.
- Start simple (a design that works with one DB / one service), then evolve it only when a requirement or estimate forces it.
- Level expectations: mid-level = a clear working design + one traced request; senior = proactively surfaces bottlenecks, failure modes, consistency choices and trade-offs before being asked; staff = drives scope and evolution.

## Edits to make in each problem file (both languages)

Keep the 16 section headings, frontmatter and the `## Checklist` items EXACTLY as they are (checklist text is used for progress ids — do not change, add or remove checklist lines).

1. **Step 2 (Requirements)**: functional requirements as 3–4 "Users should be able to…" lines plus an explicit **Out of scope** line. Non-functional requirements must be specific and ranked, e.g. `p99 redirect < 50 ms`, `99.99% availability for reads`, `strong consistency for booking, eventual for search`, `scale: 100M DAU, 10:1 read/write`. Add a one-line "**CAP choice:**" stating where we pick consistency vs availability and why.
2. **Step 6 (High-level design)**: before the diagram, add a short "**Simple v1 pehle / Start with a simple v1**" paragraph (2–4 lines) describing the minimal design that meets the functional requirements (often client → service → one DB), then say which requirement or number forces each added component. After the diagram, the "Har component kyun / Why each component" list must, for EVERY non-trivial component (queue/Kafka, cache/Redis, search index, CDN, separate service, NoSQL store, stream processor), state: the requirement or number it serves, and the simpler option it beats. Map functional requirements to components ("FR1 → …, FR2 → …").
3. **Message queues specifically**: for every Kafka/queue usage decide honestly:
   - Kafka is justified when we need one or more of: very high throughput (≈100K+ events/sec), replay/retention, multiple independent consumer groups on the same stream, ordering per key at scale, stream processing.
   - Otherwise prefer and name the simpler option: a managed queue (SQS / RabbitMQ) for task distribution with retries/DLQ, or the transactional outbox + a worker, or even a DB table + cron for low volume.
   - If you keep Kafka, write the reason with the number (e.g. "~50K click events/sec, two consumers: billing and analytics, need 7-day replay"). If you switch, update the diagram, flows, decision table, failures table and recap consistently.
   Apply the same honesty to Redis, Elasticsearch, separate microservices, Cassandra, etc.
4. **Step 9 (Deep dives)**: each deep dive should start by naming which non-functional requirement it addresses ("NFR: p99 < 200 ms", "NFR: no double booking") and end with a one-line trade-off.
5. **Step 10 (Decision table)**: keep the 3 columns; make the "why not" column name concrete alternatives AND what we sacrifice by our choice (cost, complexity, consistency, latency). Ensure there is a row for every major technology in the diagram.
6. **Step 12 / 13**: add, as the last bullet of Step 13 (follow-ups), one "**Senior signal / Senior signal:**" bullet: the bottleneck or failure the candidate should raise proactively for this design.
7. Fix any factual or numeric inconsistencies you notice (estimates that do not add up, components in the recap that are not in the diagram).
8. Keep it crisp: do not grow a file by more than ~15%. Remove filler rather than adding it.

## Quiz consistency

If you change a design decision, check `content/quiz/hld-questions.json` for questions with `"topic": "<this slug>"`. Do NOT edit that file (several reviewers run in parallel). Instead write the full corrected question objects (same ids, same schema) to `/tmp/quiz-fix/<first-slug-you-reviewed>.json` as a JSON array; they will be merged afterwards. Write an empty array if nothing needs changing.

## Checks before you finish

- Mermaid: `cd /Users/vaibhavdixit/projects/viewinter/web && node scripts/check-mermaid.mjs` must report 0 failed.
- Checklist sections unchanged (diff the `## Checklist` block before/after).
- Both languages carry the same changes.
- `node -e` parse your `/tmp/quiz-fix/*.json` file.
