"""
aggregate.py

Aggregates AccessCheck *-summary.csv / *-rules.csv exports for Section 3.5
of the methodology.

Expected layout (relative to this script):

    data/
        <slug>-summary.csv
        <slug>-rules.csv
        ... (one pair per scanned page)
    reference/
        pour-mapping.csv      (id, POUR)
    output/
        (generated)

Run with:
    python aggregate.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
REFERENCE_DIR = BASE_DIR / "reference"
OUTPUT_DIR = BASE_DIR / "output"

POUR_MAPPING_PATH = REFERENCE_DIR / "pour-mapping.csv"

# Order used for sorting / display of conformance levels
LEVEL_ORDER = ["A", "AA", "AAA", "None"]


# ── Loading ────────────────────────────────────────────────────────────────


def find_pairs() -> list[tuple[Path, Path, str]]:
    """Find matching (summary, rules, page_id) triples in data/."""
    pairs = []
    for summary_path in sorted(DATA_DIR.glob("*-summary.csv")):
        page_id = summary_path.name[: -len("-summary.csv")]
        rules_path = DATA_DIR / f"{page_id}-rules.csv"
        if not rules_path.exists():
            print(f"  ! skipping {summary_path.name}: no matching rules CSV")
            continue
        pairs.append((summary_path, rules_path, page_id))
    return pairs


def load_summaries(pairs: list[tuple[Path, Path, str]]) -> pd.DataFrame:
    frames = []
    for summary_path, _, page_id in pairs:
        df = pd.read_csv(summary_path, encoding="utf-8-sig")
        # pandas reads the literal string "None" as NaN by default; restore it
        df["Conformance Level Violation"] = df["Conformance Level Violation"].fillna(
            "None"
        )
        df.insert(0, "page_id", page_id)
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def load_rules(pairs: list[tuple[Path, Path, str]]) -> pd.DataFrame:
    frames = []
    for _, rules_path, page_id in pairs:
        df = pd.read_csv(rules_path, encoding="utf-8-sig")
        df = df[df["id"] != "TOTAL"].copy()  # drop per-page TOTAL row
        df.insert(0, "page_id", page_id)
        frames.append(df)
    combined = pd.concat(frames, ignore_index=True)

    # Normalize the ✓ marker columns into booleans
    for col in ["passes", "violations", "incomplete", "inapplicable"]:
        combined[col] = combined[col].fillna("").astype(str).str.strip() == "✓"

    return combined


# ── Item 1: Average Accessibility Score ─────────────────────────────────────


def average_score(summaries: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "metric": ["Average Accessibility Score"],
            "value": [round(summaries["Score"].mean(), 2)],
            "n_pages": [len(summaries)],
        }
    )


# ── Item 2: Minimum Standard Compliance Rate ─────────────────────────────────


def compliance_rate(summaries: pd.DataFrame) -> pd.DataFrame:
    counts = summaries["Meets Minimum Standard"].value_counts()
    total = len(summaries)

    rows = []
    for status in ["passed", "unverified", "failed"]:
        n = int(counts.get(status, 0))
        rows.append(
            {
                "status": status,
                "n_pages": n,
                "pct": round(100 * n / total, 2) if total else 0.0,
            }
        )
    return pd.DataFrame(rows)


# ── Item 3: Rule-Level Aggregation ───────────────────────────────────────────


def rule_level_aggregation(rules: pd.DataFrame, n_pages: int) -> pd.DataFrame:
    # one row per rule id per page already -> sum booleans across pages
    grouped = (
        rules.groupby("id")
        .agg(
            description=("description", "first"),
            level=("level", "first"),
            passes=("passes", "sum"),
            violations=("violations", "sum"),
            incomplete=("incomplete", "sum"),
            inapplicable=("inapplicable", "sum"),
        )
        .reset_index()
        .sort_values("id")
    )

    total_row = {
        "id": "TOTAL",
        "description": "",
        "level": "",
        "passes": grouped["passes"].sum(),
        "violations": grouped["violations"].sum(),
        "incomplete": grouped["incomplete"].sum(),
        "inapplicable": grouped["inapplicable"].sum(),
    }

    grouped = pd.concat([grouped, pd.DataFrame([total_row])], ignore_index=True)
    return grouped


# ── Item 4: POUR Distribution ────────────────────────────────────────────────


def pour_distribution(rules: pd.DataFrame, n_pages: int) -> pd.DataFrame:
    if not POUR_MAPPING_PATH.exists():
        raise FileNotFoundError(
            f"Missing reference file: {POUR_MAPPING_PATH}\n"
            "Place pour-mapping.csv (id,POUR) in analysis/reference/."
        )

    pour_map = pd.read_csv(POUR_MAPPING_PATH, encoding="utf-8-sig")
    merged = rules.merge(pour_map, on="id", how="left")

    unmapped = merged[merged["POUR"].isna()]["id"].unique()
    if len(unmapped) > 0:
        print(f"  ! warning: {len(unmapped)} rule id(s) not found in pour-mapping.csv:")
        for rid in unmapped:
            print(f"      - {rid}")

    merged["flagged"] = merged["violations"] | merged["incomplete"]

    # per page, per POUR principle: did any rule under that principle get flagged?
    page_flags = (
        merged.groupby(["page_id", "POUR"])["flagged"].any().reset_index()
    )

    rows = []
    for principle in ["P", "O", "U", "R"]:
        sub = page_flags[page_flags["POUR"] == principle]
        n_flagged = int(sub["flagged"].sum())
        rows.append(
            {
                "POUR": principle,
                "n_pages_with_issue": n_flagged,
                "pct_pages_with_issue": round(100 * n_flagged / n_pages, 2)
                if n_pages
                else 0.0,
            }
        )

    return pd.DataFrame(rows)


# ── Item 5: Conformance Level Distribution (Option B) ────────────────────────


def conformance_level_distribution(summaries: pd.DataFrame) -> pd.DataFrame:
    counts = summaries["Conformance Level Violation"].value_counts()
    total = len(summaries)

    rows = []
    for level in LEVEL_ORDER:
        n = int(counts.get(level, 0))
        rows.append(
            {
                "lowest_failing_level": level,
                "n_pages": n,
                "pct": round(100 * n / total, 2) if total else 0.0,
            }
        )
    return pd.DataFrame(rows)


# ── Main ──────────────────────────────────────────────────────────────────


def main() -> int:
    OUTPUT_DIR.mkdir(exist_ok=True)

    pairs = find_pairs()
    if not pairs:
        print(f"No *-summary.csv / *-rules.csv pairs found in {DATA_DIR}")
        return 1

    print(f"Found {len(pairs)} page(s):")
    for _, _, page_id in pairs:
        print(f"  - {page_id}")

    summaries = load_summaries(pairs)
    rules = load_rules(pairs)
    n_pages = len(summaries)

    results = {
        "1-average-score": average_score(summaries),
        "2-compliance-rate": compliance_rate(summaries),
        "3-rule-level-aggregation": rule_level_aggregation(rules, n_pages),
        "4-pour-distribution": pour_distribution(rules, n_pages),
        "5-conformance-level-distribution": conformance_level_distribution(summaries),
    }

    for name, df in results.items():
        out_path = OUTPUT_DIR / f"{name}.csv"
        df.to_csv(out_path, index=False)
        print(f"\n== {name} ==")
        print(df.to_string(index=False))
        print(f"  -> wrote {out_path.relative_to(BASE_DIR)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())