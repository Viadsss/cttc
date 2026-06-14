import type { AxeResults, Result } from "axe-core"
import type { ComplianceResult } from "./score"

const BOM = "\uFEFF"

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function row(...cells: string[]): string {
  return cells.map(escapeCell).join(",")
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildSummaryCSV(
  results: AxeResults,
  score: number,
  compliance: ComplianceResult
): string {
  const header = row(
    "URL",
    "Scan Date",
    "Score",
    "Meets Minimum Standard",
    "Violations",
    "Incomplete",
    "Passes",
    "Inapplicable"
  )

  const data = row(
    results.url,
    new Date(results.timestamp).toLocaleString(),
    String(score),
    compliance.status,
    String(results.violations.length),
    String(results.incomplete.length),
    String(results.passes.length),
    String(results.inapplicable.length)
  )

  return [header, data].join("\n")
}

function buildRulesCSV(results: AxeResults): string {
  const violationIds = new Set(results.violations.map((r) => r.id))
  const incompleteIds = new Set(results.incomplete.map((r) => r.id))
  const passIds = new Set(results.passes.map((r) => r.id))
  const inapplicableIds = new Set(results.inapplicable.map((r) => r.id))

  // Build id → help lookup from all four buckets
  const helpMap = new Map<string, string>()
  const allResults: Result[] = [
    ...results.violations,
    ...results.incomplete,
    ...results.passes,
    ...results.inapplicable,
  ]
  for (const r of allResults) {
    if (!helpMap.has(r.id)) helpMap.set(r.id, r.help)
  }

  const allIds = Array.from(
    new Set([...violationIds, ...incompleteIds, ...passIds, ...inapplicableIds])
  ).sort()

  const header = row(
    "id",
    "description",
    "passes",
    "violations",
    "incomplete",
    "inapplicable"
  )

  const ruleRows = allIds.map((id) =>
    row(
      id,
      helpMap.get(id) ?? "",
      passIds.has(id) ? "✓" : "",
      violationIds.has(id) ? "✓" : "",
      incompleteIds.has(id) ? "✓" : "",
      inapplicableIds.has(id) ? "✓" : ""
    )
  )

  const totalRow = row(
    "TOTAL",
    "",
    String(results.passes.length),
    String(results.violations.length),
    String(results.incomplete.length),
    String(results.inapplicable.length)
  )

  return [header, ...ruleRows, totalRow].join("\n")
}

export function exportCSV(
  results: AxeResults,
  score: number,
  compliance: ComplianceResult
): void {
  const slug = new URL(results.url).hostname.replace(/\./g, "-")
  const date = new Date(results.timestamp).toISOString().slice(0, 10)
  const base = `accesscheck-${slug}-${date}`

  downloadCSV(
    buildSummaryCSV(results, score, compliance),
    `${base}-summary.csv`
  )
  downloadCSV(buildRulesCSV(results), `${base}-rules.csv`)
}
