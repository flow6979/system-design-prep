# Quiz bank (seed)

The quiz shows multiple-choice questions by section and topic. These JSON files are the built-in seed;
questions generated later by Gemini are saved centrally in Firestore (`quiz` collection) with the same shape.

Files: `hld.json`, `lld.json`, `java.json`, `agents.json` — each a JSON array of:

```json
{
  "id": "hld-05-caching-01",
  "section": "hld",
  "topic": "05-caching",
  "level": "easy",
  "q": { "hi": "Hinglish question", "en": "English question" },
  "options": { "hi": ["A", "B", "C", "D"], "en": ["A", "B", "C", "D"] },
  "answer": 2,
  "why": { "hi": "1–2 line explanation", "en": "1–2 line explanation" }
}
```

Rules:
- `section`: hld | lld | java | agents. `topic`: a page slug of that section:
  - hld: topic slugs `00-…`–`22-…` and question slugs `t1-…`/`t2-…` (see STYLE.md file list, incl. t2-23..t2-26)
  - lld: 01-oops, 02-solid, 03-creational, 04-structural, 05-behavioral
  - java: 01-basics … 15-interview-qa (see STYLE.md Java list)
  - agents: agents-map, agents-react, agents-rag, agents-web, agents-multi, agents-comm, agents-prod
- Exactly 4 options, one correct (`answer` = 0–3). Spread correct positions evenly (not always 0 or 1).
- Distractors must be plausible (common misconceptions), not silly. No "all of the above" / "none of the above".
- Interview-style: scenario questions ("Swiggy order history ka pagination kaise karoge?"), concept checks, trade-offs, "kya fail hoga", time complexity, code output.
- `options.hi` and `options.en` are the same options in the same order. Tech terms stay English.
- `level` mix ≈ 40% easy, 40% medium, 20% hard. Unique ids: `<section>-<topic>-<nn>`.
- Base every question on the matching content file (content/…/<topic>.md) so answers agree with what the site teaches.
