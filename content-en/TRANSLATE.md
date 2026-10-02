# Translating Hinglish content to English

Source: `content/<dir>/<file>.md`  →  Target: `content-en/<dir>/<same file>.md`

Rules (the website depends on these):
1. **Same frontmatter**, field for field. Translate only `title` if it has Hinglish (most titles are already English). Keep `order`, `tier`, `time`, `patterns`, `topics`, `usedIn`, `askedAt` exactly.
2. **Same structure:** same number and order of `## ` sections, same tables (same rows), same diagrams, same code blocks. Do not add or drop content. Write natural, simple, crisp English (B2 level), not word-for-word.
3. **Checklist:** `## Checklist` must have the SAME number of items in the SAME order (progress tracking maps items by position). Phrase as "I can explain…", "I can tell…".
4. **Fixed heading names** — use exactly these English headings:
   - Questions: `## Step 1: Clarify with the interviewer`, `## Step 2: Requirements`, `## Step 3: Estimation`, `## Step 4: Core entities`, `## Step 5: APIs`, `## Step 6: High-level design`, `## Step 7: Main flow`, `## Step 8: Data model & DB choice`, `## Step 9: Deep dives`, `## Step 10: Decision table`, `## Step 11: Failures & bottlenecks`, `## Step 12: How to make it better`, `## Step 13: Likely follow-up questions`, `## 2-minute recap`, `## Checklist`. Keep any suffix the Hinglish heading has after the step name only if meaningful (e.g. "(3–5 min)", "(only what changes the design)").
   - Topics: `## Where it is used` (for "Kin systems me lagta hai"), `## Say this in the interview` (for "Interview me bolo"), `## Common mistakes` (for "Common galtiyan"), `## Checklist`. Others: translate naturally.
   - LLD: keep `⭐` exactly where it is in headings (`## ⭐ Singleton`). Labels: **In one line:**, **Real example:**, **When to use / when not:**, **Where in LLD problems:**, **Say this in the interview:**, **Common mistake:**.
   - Inline labels: "**Ek line me:**" → "**In one line:**", "> **Bolo:**" → "> **Say:**", "**Example:**" stays.
5. **Code blocks** (java/cpp/http/sql…): keep code identical; translate only comments and string literals that are Hinglish. Keep `// ❌ Bad` / `// ✅ Good` markers.
6. **Mermaid:** translate labels/messages, keep syntax valid: every node label in double quotes, no `;` or `#` in sequence messages, no brackets in edge text.
7. **Links:** keep relative links exactly (`../02-questions/t1-05-bookmyshow.md`), translate only the link text.
8. Indian examples (Swiggy, Paytm, IPL) stay — they are fine in English.

After writing, run `cd /Users/vaibhavdixit/projects/system-design-prep/web && node scripts/check-mermaid.mjs` (it checks content-en too) and fix failures in your files. Also verify checklist item counts match the source with:
`for f in <your files>; do echo $f $(sed -n '/^## Checklist/,$p' content/$f | grep -c '^- \[') $(sed -n '/^## Checklist/,$p' content-en/$f | grep -c '^- \['); done` (run from repo root, f like 01-topics/05-caching.md).
