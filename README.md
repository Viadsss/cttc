# AccessCheck

A Chrome extension that audits web pages for accessibility violations using [axe-core](https://github.com/dequelabs/axe-core), scored against the WCAG 2.2 standard. Built as a side panel extension so it stays open while you browse.

---

## Features

- **One-click audit** — injects axe-core into the active tab and runs a full WCAG 2.2A/AA/AAA scan
- **Accessibility score** — computes a 0–100 score based on pass rate and weighted violation penalties
- **Compliance badge** — shows whether the page meets the minimum WCAG 2.2 Level A standard
- **Issue breakdown** — lists violations, incomplete items, passed rules, and inapplicable rules, each collapsible
- **Element highlighting** — click "highlight" on any affected node to scroll to and outline it on the page
- **Score breakdown dialog** — shows penalty weights, pass rate, and per-impact violation counts
- **Severity legend** — visual reference for critical / serious / moderate / minor impact levels
- **CSV export** — exports a summary CSV and a per-rule CSV for reporting
- **Patch injection** — for known sites, injects pre-written accessibility fixes and rescans automatically
- **Dark/light theme** — toggle via button or press `D`

---

## Tech Stack

| Layer                | Technology                    |
| -------------------- | ----------------------------- |
| Framework            | React 19 + TypeScript         |
| Bundler              | Vite 7                        |
| Styling              | Tailwind CSS v4 + shadcn/ui   |
| Accessibility engine | axe-core 4.11                 |
| Extension API        | Chrome Extensions Manifest V3 |

---

## Project Structure

```
├── public/
│   ├── manifest.json          # Chrome extension manifest (MV3)
│   ├── background.js          # Service worker — opens side panel on click
│   └── icon32.png
├── src/
│   ├── App.tsx                # Root component — scan orchestration and state
│   ├── main.tsx               # Entry point
│   ├── index.css              # Tailwind + theme tokens
│   ├── components/
│   │   ├── AppHeader.tsx      # Title bar with theme toggle
│   │   ├── ScanButton.tsx     # Run audit button
│   │   ├── MetaPanel.tsx      # URL and scan timestamp
│   │   ├── ScorePanel.tsx     # Radial score chart + compliance badge
│   │   ├── SeverityLegend.tsx # Impact level reference
│   │   ├── IssuesList.tsx     # Collapsible sections per result type
│   │   ├── IssueCard.tsx      # Per-rule card with node details and highlight
│   │   ├── FailureSummary.tsx # Parsed failure summary per node
│   │   ├── FixBanner.tsx      # Patch available / applied banner
│   │   ├── Section.tsx        # Collapsible section wrapper
│   │   ├── StatTile.tsx       # Count tile (issues / review / passed / n/a)
│   │   ├── DiagRow.tsx        # Label + value diagnostic row
│   │   └── ui/                # shadcn/ui primitives
│   ├── lib/
│   │   ├── results.ts         # Cleans raw axe results (deduplicates pass/violation overlap)
│   │   ├── score.ts           # Scoring formula + compliance check
│   │   ├── csv.ts             # CSV export (summary + per-rule)
│   │   ├── highlight.ts       # Element highlight/clear via scripting API
│   │   ├── impact.ts          # Impact level config and color mapping
│   │   └── utils.ts           # cn() utility
│   └── fixes/
│       ├── index.ts           # URL → fix function registry
│       └── viads.vercel.app.ts # Fix script for viads.vercel.app
└── analysis/                  # Standalone Python analysis suite (see below)
```

---

## Scoring Formula

The score is computed from axe-core results after cleaning (see `src/lib/results.ts`).

```
pass_rate = passes / (passes + violations)
penalties = Σ(violation_penalty) + Σ(incomplete_penalty × 0.5)
score     = clamp(pass_rate × 100 − penalties, 0, 100)
```

**Penalty weights by impact:**

| Impact   | Penalty |
| -------- | ------- |
| Critical | −4      |
| Serious  | −2      |
| Moderate | −1      |
| Minor    | −0.5    |
| Unknown  | −1      |

Incomplete items (needs review) are penalised at half the rate of confirmed violations.

---

## Compliance Check

A page **passes** minimum standard if it has zero WCAG Level A violations (`wcag2a` / `wcag21a` tags). If it has incomplete Level A items but no violations, it is marked **unverified**. Any Level A violation results in **failed**.

---

## Result Cleaning

axe-core can report the same rule ID in both `passes` and `violations` simultaneously (some elements pass, others fail). `src/lib/results.ts` deduplicates this before any scoring or display:

- A rule present in `violations` is removed from `passes` and `incomplete`
- A rule present in `incomplete` is removed from `passes`

This ensures consistent counts across the score, the UI, and the CSV export.

---

## Patch System

The fix registry in `src/fixes/index.ts` maps exact URLs to injector functions. When a known URL is detected after a scan, a **patch available** banner appears. Clicking **inject** runs the fix function via `chrome.scripting.executeScript` and automatically rescans.

Fix scripts directly manipulate the DOM (styles, aria-labels, etc.) to resolve known issues. Example fixes in `viads.vercel.app.ts`:

- Corrects a colour contrast failure on a "view more" span
- Disambiguates duplicate `aria-label` values across GitHub and YouTube links

---

## CSV Export

Clicking the **csv** button exports two files:

**`accesscheck-<slug>-<date>-summary.csv`**

- URL, scan date, score, compliance status, conformance level violation, violation/incomplete/pass/inapplicable counts

**`accesscheck-<slug>-<date>-rules.csv`**

- One row per rule with: id, description, WCAG level, and ✓ marks for passes / violations / incomplete / inapplicable
- TOTAL row at the bottom

---

## Installation (Development)

```bash
npm install
npm run build
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder
4. Click the extension icon — the side panel opens

---

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start Vite dev server               |
| `npm run build`     | TypeScript check + production build |
| `npm run lint`      | ESLint                              |
| `npm run format`    | Prettier                            |
| `npm run typecheck` | TypeScript type check only          |

---

## Analysis

The `analysis/` directory contains a standalone Python suite used to aggregate AccessCheck scan exports across multiple pages and produce charts for research reporting.

### Purpose

Used to audit 25 Philippine National Government Agency (NGA) websites for a research study on public sector web accessibility. Each site was scanned using the extension, and the exported CSVs were fed into the aggregation pipeline.

### Agencies Audited

Includes pages from: DFA, PSA, PhilSys, BIR, DTI, BOC, BTr, SSS, PhilHealth, Pag-IBIG, PRC, DMW, DOST-SEI, CSC, LTFRB, Bureau of Immigration, NBI, PNP, NTC, EMB, DICT, ARTA, DOST, and PNA.

### Setup

```bash
cd analysis
pip install -r requirements.txt
python aggregate.py
```

Requires scan exports in `analysis/data/` following the naming convention:

```
accesscheck-<slug>-<date>-summary.csv
accesscheck-<slug>-<date>-rules.csv
```

### Outputs

All outputs are written to `analysis/output/`:

#### 1. Average Accessibility Score

Radial gauge chart showing the mean score across all scanned pages.

#### 2. Minimum Standard Compliance Rate

Pie chart showing the proportion of pages that passed, failed, or were unverified against WCAG 2.2 Level A.

#### 3. Rule-Level Aggregation

Horizontal stacked bar chart — one bar per axe-core rule, sorted by violation count. Each segment shows how many pages passed, violated, had incomplete results, or found the rule inapplicable. Numbers are labelled inside each segment.

#### 4. POUR Principle Distribution

Bar chart showing how many pages had at least one issue under each WCAG principle: Perceivable, Operable, Understandable, Robust. Uses `analysis/reference/pour-mapping.csv` to map rule IDs to principles.

#### 5. Conformance Level Distribution

Bar chart showing the lowest failing WCAG conformance level (A, AA, AAA, or None) across all pages.

#### 6. Per-Site Accessibility Scores

Horizontal bar chart with one bar per evaluated website, sorted by score. Bars are colour-coded by compliance status — green for pages that passed the minimum WCAG 2.2 Level A standard, and red for pages that failed (amber is reserved for "unverified" pages, if any appear). Site labels are derived from each page's hostname.

> **Figure 2.** Accessibility scores per evaluated Philippine government website. Green bars denote pages that passed minimum WCAG 2.2 Level A standards; red bars denote pages that failed.

### Key Findings (n = 25)

| Metric                       | Value                                |
| ---------------------------- | ------------------------------------ |
| Average score                | 72.56 / 100                          |
| Pages passing Level A        | 7 (28%)                              |
| Pages failing Level A        | 18 (72%)                             |
| Most violated rule           | `color-contrast-enhanced` (18 pages) |
| Most affected POUR principle | Perceivable (100% of pages)          |

### Directory Structure

```
analysis/
├── aggregate.py           # Main aggregation and chart generation script
├── requirements.txt       # Python dependencies
├── data/                  # Raw scan exports (*-summary.csv, *-rules.csv)
├── reference/
│   └── pour-mapping.csv   # Maps axe-core rule IDs to POUR principles
└── output/                # Generated CSVs and PNG charts
```
