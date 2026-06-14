import type { AxeResults, Result } from "axe-core"

export const IMPACT_PENALTIES: Record<string, number> = {
  critical: 4,
  serious: 2,
  moderate: 1,
  minor: 0.5,
  unknown: 1,
}

function getPenalty(impact?: string | null): number {
  return IMPACT_PENALTIES[impact ?? "unknown"] ?? 1
}

export interface ScoreBreakdown {
  passes: number
  totalPasses: number
  violations: number
  passRate: number
  penalties: number
  score: number
  violationsByImpact: Record<string, number>
  incompleteByImpact: Record<string, number>
}

export function computeScore(results: AxeResults): ScoreBreakdown {
  const passes = results.passes.length
  const violations = results.violations.length

  const passRate = passes + violations > 0 ? passes / (passes + violations) : 1

  const violationPenalties = results.violations.reduce(
    (sum, v) => sum + getPenalty(v.impact),
    0
  )

  const incompletePenalties = results.incomplete.reduce(
    (sum, v) => sum + getPenalty(v.impact) * 0.5,
    0
  )

  const penalties = violationPenalties + incompletePenalties

  const raw = passRate * 100 - penalties
  const score = Math.round(Math.max(0, Math.min(100, raw)))

  const violationsByImpact = groupByImpact(results.violations)
  const incompleteByImpact = groupByImpact(results.incomplete)

  return {
    passes,
    totalPasses: results.passes.length,
    violations,
    passRate,
    penalties,
    score,
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

const MINIMUM_TAGS = new Set(["wcag2a", "wcag21a"])

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

export type ConformanceLevel = "A" | "AA" | "AAA"

const RULE_LEVEL_TAGS: Record<string, ConformanceLevel> = {
  wcag2a: "A",
  wcag21a: "A",
  wcag2aa: "AA",
  wcag21aa: "AA",
  wcag22aa: "AA",
  wcag2aaa: "AAA",
}

const LEVEL_ORDER: ConformanceLevel[] = ["A", "AA", "AAA"]

export function getRuleLevel(tags: string[]): ConformanceLevel | null {
  for (const level of LEVEL_ORDER) {
    if (tags.some((tag) => RULE_LEVEL_TAGS[tag] === level)) {
      return level
    }
  }
  return null
}

export function getConformanceLevelViolation(
  violations: Result[]
): ConformanceLevel | "None" {
  let lowest: ConformanceLevel | null = null

  for (const violation of violations) {
    const level = getRuleLevel(violation.tags)
    if (!level) continue

    if (!lowest || LEVEL_ORDER.indexOf(level) < LEVEL_ORDER.indexOf(lowest)) {
      lowest = level
    }
  }

  return lowest ?? "None"
}
