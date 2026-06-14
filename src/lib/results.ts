import type { AxeResults } from "axe-core"

export function cleanResults(results: AxeResults): AxeResults {
  const violationIds = new Set(results.violations.map((r) => r.id))
  const incompleteIds = new Set(results.incomplete.map((r) => r.id))

  return {
    ...results,
    passes: results.passes.filter(
      (p) => !violationIds.has(p.id) && !incompleteIds.has(p.id)
    ),
    incomplete: results.incomplete.filter((i) => !violationIds.has(i.id)),
  }
}
