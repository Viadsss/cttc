# AccessCheck → Analysis Handoff (v2)

This supersedes the previous HANDOFF.md. The code-level changes described below
are already implemented; this document describes the current state and what's
left to do in `analysis/`.

---

## 1. What changed in AccessCheck's export code

`src/lib/score.ts` and `src/lib/csv.ts` were updated (files attached: `score.ts`,
`csv.ts`):

- **Fixed a bug** in `MINIMUM_TAGS`: it was `{wcag2a, wcag21aa}` (mixing a Level A
  tag with an AA tag), now corrected to `{wcag2a, wcag21a}`. This means
  `Meets Minimum Standard` (`passed`/`unverified`/`failed`) now correctly
  reflects **Level A** compliance only, not a mix of A and AA.
- **Added conformance-level derivation**: `getRuleLevel(tags)` maps an axe-core
  rule's WCAG tags to `"A" | "AA" | "AAA"` (verified against axe-core 4.11
  metadata — all 65 rules in `pour-mapping.csv` map to exactly one level, no
  rule straddles multiple levels).
- **Added `getConformanceLevelViolation(violations)`**: returns the page's
  _lowest_ failing conformance level (`"A"`, `"AA"`, `"AAA"`, or `"None"` if
  no violations). Based on confirmed violations only — `incomplete` items
  are ignored for this column.

## 2. New CSV export format

**`*-summary.csv`** — one row per page:
`URL, Scan Date, Score, Meets Minimum Standard, Conformance Level Violation, Violations, Incomplete, Passes, Inapplicable`

(new column: `Conformance Level Violation`, inserted after `Meets Minimum
Standard`)

**`*-rules.csv`** — one row per axe-core rule:
`id, description, level, passes, violations, incomplete, inapplicable`
Plus a `TOTAL` row at the bottom (blank `level`).

(new column: `level` = `A`/`AA`/`AAA`/blank, derived from the rule's WCAG tags)

⚠️ **Any CSVs exported before this change must be re-generated** — old exports
lack the `level` and `Conformance Level Violation` columns, and have
incorrect `Meets Minimum Standard` values due to the `MINIMUM_TAGS` bug.

## 3. `analysis/` folder structure

```
analysis/
├── .venv/                  (already created by user)
├── .gitignore              (already exists)
├── aggregate.py            (attached — main aggregation script)
├── data/                   ← put paired *-summary.csv + *-rules.csv here,
│                              one pair per scanned NGA page (re-scanned with
│                              the updated extension)
├── reference/
│   └── pour-mapping.csv    (attached — id, POUR mapping for 65 rule ids)
└── output/                 ← aggregate.py writes results here (auto-created)
```

## 4. What `aggregate.py` computes (Section 3.5 of methodology)

All 5 required metrics are covered, no additional reference files needed
beyond `pour-mapping.csv`:

1. **Average Accessibility Score** — mean of `Score` across all summary CSVs.
2. **Minimum Standard Compliance Rate** — % of pages `passed` / `unverified` /
   `failed`, from `Meets Minimum Standard`.
3. **Rule-Level Aggregation** — per rule id, sums passes/violations/incomplete/
   inapplicable across all pages, plus a `TOTAL` row.
4. **POUR Distribution** — merges rule-level data with `pour-mapping.csv`;
   for each principle (P/O/U/R), % of pages with ≥1 violation or incomplete
   item under that principle. Warns (doesn't fail) if a rule id isn't in
   `pour-mapping.csv`.
5. **Conformance Level Distribution** — groups pages by their
   `Conformance Level Violation` value (A/AA/AAA/None) — mutually exclusive,
   sums to 100%. This answers "where do pages first break down."

Each metric is written to its own CSV in `output/` (e.g.
`1-average-score.csv` ... `5-conformance-level-distribution.csv`) and printed
to stdout as a preview table.

The script has been tested against synthetic 3-page fixture data (matching
the new export format) and runs cleanly — including a fix for a pandas quirk
where the literal string `"None"` in `Conformance Level Violation` was being
read as `NaN` (now handled with `fillna("None")` after load).

## 5. What's left to do

1. Apply the attached `score.ts` / `csv.ts` to the AccessCheck repo (already
   done in this session — just confirming the files are correct).
2. Rebuild the extension, re-scan all NGA sites from `archive/Websites.csv`,
   export CSVs, and place the `*-summary.csv` / `*-rules.csv` pairs into
   `analysis/data/`.
3. Move `pour-mapping.csv` (attached) into `analysis/reference/`.
4. `cd analysis && .venv/bin/pip install pandas` (if not already installed),
   then `.venv/bin/python aggregate.py`.
5. Take the 5 output CSVs and format them into the markdown tables expected
   by the report's methodology section (Section 3.5).

## Attached files

- `score.ts` → goes in `src/lib/score.ts`
- `csv.ts` → goes in `src/lib/csv.ts`
- `aggregate.py` → goes in `analysis/aggregate.py`
- `pour-mapping.csv` → goes in `analysis/reference/pour-mapping.csv`
