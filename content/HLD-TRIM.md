# Trim guide: HLD problems for quick reading

Readers skim these pages right before interviews. Remove word filling; keep every fact.

## Cut
- Filler and hedging: "basically", "actually", "note karo ki", "yahan pe", "it is important to note", "as we discussed", "in other words", "dhyan rahe ki", restating the question.
- Sentences that repeat what a table, diagram or an earlier step already says (e.g. Step 6 prose that re-lists the diagram; Step 11 rows that repeat Step 9; recap lines that repeat the "Bolo/Say" line verbatim).
- Long lead-ins before lists ("Ab hum dekhte hain ki…", "Let us now look at…").
- More than one example for the same point.
- Step 12/13 bullets that are weak or overlap; keep the strongest 4–6.

## Rewrite
- Paragraphs → short bullets where possible. One idea per bullet, ideally one line.
- Prefer `X → Y` and `A vs B:` forms over full sentences.
- "Bolo / Say" quotes: max 2 lines, the exact sentence a candidate would say.
- Table cells: ≤ ~12 words.

## Keep (do not delete)
- Frontmatter, all 16 section headings, the `## Checklist` block (byte-identical).
- Every requirement, number, estimate, decision, trade-off, failure and the senior-signal bullet.
- Mermaid diagrams (you may shorten labels; quote every node label).
- Code/API blocks.

Target: each file ~25–35% shorter in characters. Same edits in the Hinglish (`content/02-questions/`) and English (`content-en/02-questions/`) versions.

## Checks
- `cd /Users/vaibhavdixit/projects/viewinter/web && node scripts/check-mermaid.mjs` → 0 failed.
- `## Checklist` block unchanged (compare with `git show HEAD:<path>`).
- Report before/after character counts per file.
