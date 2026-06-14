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
import matplotlib
matplotlib.use("Agg")  # non-interactive backend (no display needed)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from matplotlib import font_manager

font_manager.fontManager.addfont("styles/Outfit.ttf")  
plt.rcParams.update({
    "font.family": "Outfit",
    "figure.dpi": 150,
    "axes.spines.top": False,
    "axes.spines.right": False,
})

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
        df = df[df["id"] != "TOTAL"].copy()
        df.insert(0, "page_id", page_id)
        frames.append(df)
    combined = pd.concat(frames, ignore_index=True)

    for col in ["passes", "violations", "incomplete", "inapplicable"]:
        combined[col] = combined[col].fillna("").astype(str).str.strip() == "✓"

    return combined


# ── Item 1: Average Accessibility Score ───────────────────────────────────


def average_score(summaries: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "metric": ["Average Accessibility Score"],
            "value": [round(summaries["Score"].mean(), 2)],
            "n_pages": [len(summaries)],
        }
    )


def chart_average_score(df: pd.DataFrame) -> None:
    score = df["value"].iloc[0]
    n_pages = df["n_pages"].iloc[0]

    fig, ax = plt.subplots(figsize=(5, 5), subplot_kw={"aspect": "equal"})

    # Get the style's default color cycle for the arc colour
    prop_cycle = plt.rcParams["axes.prop_cycle"]
    arc_color = prop_cycle.by_key()["color"][0]

    theta = np.linspace(np.pi, 0, 300)
    r_outer, r_inner = 1.0, 0.65

    def ring_patch(theta_end, color, zorder=2):
        th = np.linspace(np.pi, theta_end, 300)
        xs = np.concatenate([r_outer * np.cos(th), r_inner * np.cos(th[::-1])])
        ys = np.concatenate([r_outer * np.sin(th), r_inner * np.sin(th[::-1])])
        return mpatches.Polygon(
            np.column_stack([xs, ys]), closed=True,
            facecolor=color, edgecolor="none", zorder=zorder
        )

    # background ring uses a muted version of the axes facecolor
    bg_color = plt.rcParams.get("axes.facecolor", "#EEEEEE")
    ax.add_patch(ring_patch(0, bg_color, zorder=1))

    score_theta = np.pi - (score / 100) * np.pi
    ax.add_patch(ring_patch(score_theta, arc_color, zorder=2))

    text_color = plt.rcParams.get("text.color", "#333333")
    ax.text(0, 0.05, f"{score}", ha="center", va="center",
            fontsize=44, fontweight="bold", color=text_color)
    ax.text(0, -0.22, "out of 100", ha="center", va="center",
            fontsize=11, color=text_color)
    ax.text(0, -0.48, f"n = {n_pages} pages", ha="center", va="center",
            fontsize=10, color=text_color)

    ax.set_xlim(-1.2, 1.2)
    ax.set_ylim(-0.65, 1.2)
    ax.axis("off")
    ax.set_title("Average Accessibility Score", fontsize=13,
                 fontweight="bold", pad=12)

    fig.tight_layout()
    out = OUTPUT_DIR / "1-average-score.png"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"  -> chart saved to {out.relative_to(BASE_DIR)}")


# ── Item 2: Minimum Standard Compliance Rate ──────────────────────────────


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


def chart_compliance_rate(df: pd.DataFrame) -> None:
    # Exclude "unverified" per request
    plot_df = df[df["status"] != "unverified"].copy()

    labels = plot_df["status"].str.capitalize().tolist()
    sizes  = plot_df["n_pages"].tolist()

    # Pull colours from the style's cycle
    cycle_colors = plt.rcParams["axes.prop_cycle"].by_key()["color"]
    colors = [cycle_colors[i % len(cycle_colors)] for i in range(len(labels))]

    fig, ax = plt.subplots(figsize=(6, 6))

    wedges, texts, autotexts = ax.pie(
        sizes,
        labels=None,
        colors=colors,
        autopct=lambda p: f"{p:.1f}%" if p > 0 else "",
        startangle=90,
        pctdistance=0.72,
        wedgeprops={"linewidth": 2, "edgecolor": plt.rcParams.get("figure.facecolor", "white")},
    )
    for at in autotexts:
        at.set_fontsize(13)
        at.set_fontweight("bold")

    legend_patches = [
        mpatches.Patch(color=colors[i], label=f"{labels[i]}  (n={sizes[i]})")
        for i in range(len(labels))
    ]
    ax.legend(handles=legend_patches, loc="lower center",
              bbox_to_anchor=(0.5, -0.08), ncol=len(labels),
              frameon=False, fontsize=11)

    ax.set_title("Minimum Standard Compliance Rate",
                 fontsize=13, fontweight="bold", pad=16)

    fig.tight_layout()
    out = OUTPUT_DIR / "2-compliance-rate.png"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"  -> chart saved to {out.relative_to(BASE_DIR)}")


# ── Item 3: Rule-Level Aggregation ────────────────────────────────────────


def rule_level_aggregation(rules: pd.DataFrame, n_pages: int) -> pd.DataFrame:
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


def chart_rule_level_aggregation(df: pd.DataFrame) -> None:
    plot_df = df[df["id"] != "TOTAL"].copy()
    plot_df["issues"] = plot_df["violations"] + plot_df["incomplete"]
    plot_df = plot_df.sort_values("violations", ascending=True)

    labels       = plot_df["id"].tolist()
    passes       = plot_df["passes"].tolist()
    violations   = plot_df["violations"].tolist()
    incomplete   = plot_df["incomplete"].tolist()
    inapplicable = plot_df["inapplicable"].tolist()

    n = len(labels)
    y = np.arange(n)
    height = 0.6

    cycle_colors = plt.rcParams["axes.prop_cycle"].by_key()["color"]

    fig, ax = plt.subplots(figsize=(10, n * 0.45))  # no max(5, ...) so it fits tightly

    bars_def = [
        (passes,        cycle_colors[2], "Passes"),
        (violations,    cycle_colors[3], "Violations"),
        (incomplete,    cycle_colors[1], "Incomplete"),
        (inapplicable,  cycle_colors[0], "Inapplicable"),
    ]

    left = np.zeros(n)
    for values, color, label in bars_def:
        ax.barh(y, values, height=height, left=left,
                color=color, label=label, linewidth=0)
        # add number label inside each segment if wide enough
        for i, (val, l) in enumerate(zip(values, left)):
            if val > 0:
                ax.text(
                    l + val / 2, i, str(val),
                    ha="center", va="center",
                    fontsize=10, fontweight="bold",
                    color="white",
                )
        left += np.array(values)

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=9)
    ax.set_xlabel("Number of Pages", fontsize=11)

    ax.set_ylim(-0.5, n - 0.5)  # remove bottom whitespace

    ax.set_title("Rule-Level Aggregation\n(sorted by violations)", fontsize=13,
                 fontweight="bold", pad=24)  # pad makes room for legend

    ax.legend(
        loc="upper center",
        bbox_to_anchor=(0.5, 1.0125),
        ncol=4,
        frameon=False,
        fontsize=10,
        bbox_transform=ax.transAxes,
    )

    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False)

    fig.tight_layout()
    out = OUTPUT_DIR / "3-rule-level-aggregation.png"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"  -> chart saved to {out.relative_to(BASE_DIR)}")


# ── Item 4: POUR Distribution ─────────────────────────────────────────────


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


def chart_pour_distribution(df: pd.DataFrame, n_pages: int) -> None:
    principles = df["POUR"].tolist()
    counts     = df["n_pages_with_issue"].tolist()
    pcts       = df["pct_pages_with_issue"].tolist()

    full_names = {"P": "Perceivable", "O": "Operable",
                  "U": "Understandable", "R": "Robust"}
    x_labels = [f"{p}\n{full_names[p]}" for p in principles]

    cycle_colors = plt.rcParams["axes.prop_cycle"].by_key()["color"]
    colors = [cycle_colors[i % len(cycle_colors)] for i in range(len(principles))]

    fig, ax = plt.subplots(figsize=(7, 5))

    bars = ax.bar(x_labels, counts, color=colors, linewidth=0, width=0.55)

    for bar, count, pct in zip(bars, counts, pcts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.3,
            f"{count}  ({pct}%)",
            ha="center", va="bottom", fontsize=10,
        )

    ax.set_ylabel("Pages with Issue", fontsize=11)
    ax.set_ylim(0, max(counts) * 1.25 if counts else 1)
    ax.set_title("POUR Principle Distribution", fontsize=13,
                 fontweight="bold", pad=12)
    ax.spines["bottom"].set_visible(False)
    ax.tick_params(bottom=False)
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    # Reference line: total pages
    ax.axhline(n_pages, linestyle="--", linewidth=1)
    ax.text(len(principles) - 0.45, n_pages + 0.2,
            f"Total pages: {n_pages}", fontsize=9)

    fig.tight_layout()
    out = OUTPUT_DIR / "4-pour-distribution.png"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"  -> chart saved to {out.relative_to(BASE_DIR)}")


# ── Item 5: Conformance Level Distribution ────────────────────────────────


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


def chart_conformance_level_distribution(df: pd.DataFrame) -> None:
    labels = df["lowest_failing_level"].tolist()
    counts = df["n_pages"].tolist()
    pcts   = df["pct"].tolist()

    cycle_colors = plt.rcParams["axes.prop_cycle"].by_key()["color"]
    colors = [cycle_colors[i % len(cycle_colors)] for i in range(len(labels))]

    fig, ax = plt.subplots(figsize=(7, 5))

    bars = ax.bar(labels, counts, color=colors, linewidth=0, width=0.55)

    for bar, count, pct in zip(bars, counts, pcts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.3,
            f"{count}  ({pct}%)",
            ha="center", va="bottom", fontsize=10,
        )

    ax.set_ylabel("Number of Pages", fontsize=11)
    ax.set_ylim(0, max(counts) * 1.25 if counts else 1)
    ax.set_xlabel("Lowest Failing Conformance Level", fontsize=11)
    ax.set_title("Conformance Level Distribution", fontsize=13,
                 fontweight="bold", pad=12)
    ax.spines["bottom"].set_visible(False)
    ax.tick_params(bottom=False)
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))

    fig.tight_layout()
    out = OUTPUT_DIR / "5-conformance-level-distribution.png"
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)
    print(f"  -> chart saved to {out.relative_to(BASE_DIR)}")


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

    # Generate charts
    print("\n== Generating charts ==")
    chart_average_score(results["1-average-score"])
    chart_compliance_rate(results["2-compliance-rate"])
    chart_rule_level_aggregation(results["3-rule-level-aggregation"])
    chart_pour_distribution(results["4-pour-distribution"], n_pages)
    chart_conformance_level_distribution(results["5-conformance-level-distribution"])

    return 0


if __name__ == "__main__":
    sys.exit(main())