Here's a full overview of what the system produces and what the analysis script will need to work with:

---

**What AccessCheck outputs (per scanned page):**

Two CSV files per scan:

**`*-summary.csv`** — one row per page:
`URL, Scan Date, Score, Meets Minimum Standard (passed/unverified/failed), Violations, Incomplete, Passes, Inapplicable`

**`*-rules.csv`** — one row per axe-core rule:
`id, description, passes (✓/blank), violations (✓/blank), incomplete (✓/blank), inapplicable (✓/blank)`
Plus a `TOTAL` row at the bottom with counts.

**`pour-mapping.csv`** — static reference file you already have:
`id, POUR` — maps each rule ID to P, O, U, or R.

---

**What Section 3.5 requires the Python script to do:**

Given a folder of summary + rules CSVs from all scanned pages, plus the POUR mapping:

1. **Average Accessibility Score** — mean of the Score column across all summary files
2. **Minimum Standard Compliance Rate** — % of pages where status = `passed`, and breakdown of `unverified` / `failed`
3. **Rule-Level Aggregation** — across all rules CSVs, for each unique rule ID: how many pages had it as violation / passed / incomplete / inapplicable, plus a TOTAL row
4. **POUR Distribution** — join rule-level aggregation with pour-mapping.csv; for each principle (P/O/U/R), compute % of pages that had at least one violation or incomplete item in that principle
5. **Conformance Level Distribution** — axe-core tags encode the level (wcag2a = Level A, wcag2aa = Level AA, wcag2aaa = Level AAA, etc.); the script needs a conformance-level reference (similar to the POUR mapping) to classify each rule ID by its level, then compute % of pages with at least one violation per level

---

**What you should hand off to the other Claude:**

1. A **folder of CSV exports** from AccessCheck (multiple pages scanned = multiple summary + rules file pairs)
2. The **`pour-mapping.csv`** you already have
3. A **conformance-level mapping CSV** — you can either generate this from axe-core tag metadata or ask the other Claude to derive it. The format would be: `id, level` (A / AA / AAA). I can generate this for you from the 65 rule IDs we already have if you want
4. The **output spec** — what the final aggregated CSVs/tables should look like (the markdown table format from your methodology)

---

Want me to also generate the conformance-level mapping CSV for the 65 rules now, so you have all three reference files ready to hand off?