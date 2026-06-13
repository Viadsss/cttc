import type { AxeResults, Result } from "axe-core"

// Penalty deducted per violation by impact level
export const IMPACT_PENALTIES: Record<string, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
  unknown: 2,
}

function getPenalty(impact?: string | null): number {
  return IMPACT_PENALTIES[impact ?? "unknown"] ?? 2
}

export interface ScoreBreakdown {
  passes: number
  totalPasses: number
  violations: number
  passRate: number
  penalties: number
  score: number
  cleanPasses: Result[]
  cleanIncomplete: Result[]
  violationsByImpact: Record<string, number>
  incompleteByImpact: Record<string, number>
}

export function computeScore(results: AxeResults): ScoreBreakdown {
  const violationIds = new Set(results.violations.map((v) => v.id))
  const incompleteIds = new Set(results.incomplete.map((v) => v.id))

  const cleanPasses = results.passes.filter(
    (p) => !violationIds.has(p.id) && !incompleteIds.has(p.id)
  )

  const cleanIncomplete = results.incomplete.filter(
    (i) => !violationIds.has(i.id)
  )

  const passes = cleanPasses.length
  const violations = results.violations.length

  const passRate = passes + violations > 0 ? passes / (passes + violations) : 1

  const violationPenalties = results.violations.reduce(
    (sum, v) => sum + getPenalty(v.impact),
    0
  )

  const incompletePenalties = cleanIncomplete.reduce(
    (sum, v) => sum + getPenalty(v.impact) * 0.5,
    0
  )

  const penalties = violationPenalties + incompletePenalties

  const raw = passRate * 100 - penalties
  const score = Math.round(Math.max(0, Math.min(100, raw)))

  const violationsByImpact = groupByImpact(results.violations)
  const incompleteByImpact = groupByImpact(cleanIncomplete)

  return {
    passes,
    totalPasses: results.passes.length,
    violations,
    passRate,
    penalties,
    score,
    cleanPasses,
    cleanIncomplete,
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
