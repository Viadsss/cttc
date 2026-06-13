import type { AxeResults, Result } from "axe-core"

export const IMPACT_WEIGHTS: Record<string, number> = {
  critical: 1.0,
  serious: 0.5,
  moderate: 0.25,
  minor: 0.1,
  unknown: 0.25,
}

function getWeight(impact?: string | null): number {
  return IMPACT_WEIGHTS[impact ?? "unknown"] ?? 0.25
}

export interface ScoreBreakdown {
  passes: number
  weightedViolations: number
  weightedIncomplete: number
  effectiveTotal: number
  scorePercentage: number
  violationsByImpact: Record<string, number>
  incompleteByImpact: Record<string, number>
}

export function computeScore(results: AxeResults): ScoreBreakdown {
  const passes = results.passes.length

  const weightedViolations = results.violations.reduce(
    (sum, v) => sum + getWeight(v.impact),
    0
  )

  const weightedIncomplete = results.incomplete.reduce(
    (sum, v) => sum + getWeight(v.impact) * 0.5,
    0
  )

  const effectiveTotal = passes + weightedViolations + weightedIncomplete
  const scorePercentage =
    effectiveTotal > 0 ? Math.round((passes / effectiveTotal) * 100) : 100

  const violationsByImpact = groupByImpact(results.violations)
  const incompleteByImpact = groupByImpact(results.incomplete)

  return {
    passes,
    weightedViolations,
    weightedIncomplete,
    effectiveTotal,
    scorePercentage,
    violationsByImpact,
    incompleteByImpact,
  }
}

function groupByImpact(issues: Result[]): Record<string, number> {
  return issues.reduce<Record<string, number>>((acc, issue) => {
    const key = issue.impact ?? "unknown"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

// ── WCAG minimum compliance ──────────────────────────────────────────────────

const MINIMUM_TAGS = new Set(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])

function isMinimumLevel(issue: Result): boolean {
  return issue.tags.some((tag) => MINIMUM_TAGS.has(tag))
}

export type ComplianceStatus = "passed" | "unverified" | "failed"

export interface ComplianceResult {
  status: ComplianceStatus
  minimumViolationCount: number
  minimumIncompleteCount: number
}

export function checkCompliance(results: AxeResults): ComplianceResult {
  const minimumViolations = results.violations.filter(isMinimumLevel)
  const minimumIncomplete = results.incomplete.filter(isMinimumLevel)

  let status: ComplianceStatus
  if (minimumViolations.length > 0) {
    status = "failed"
  } else if (minimumIncomplete.length > 0) {
    status = "unverified"
  } else {
    status = "passed"
  }

  return {
    status,
    minimumViolationCount: minimumViolations.length,
    minimumIncompleteCount: minimumIncomplete.length,
  }
}
