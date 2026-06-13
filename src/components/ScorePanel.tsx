import { useState } from "react"
import type { AxeResults } from "axe-core"
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatTile } from "./StatTile"
import type { ScoreBreakdown, ComplianceResult } from "@/lib/score"
import { IMPACT_PENALTIES } from "@/lib/score"

interface ScorePanelProps {
  results: AxeResults
  breakdown: ScoreBreakdown
  compliance: ComplianceResult
}

const IMPACT_ORDER = [
  "critical",
  "serious",
  "moderate",
  "minor",
  "unknown",
] as const

const IMPACT_COLORS: Record<string, string> = {
  critical: "text-red-500 dark:text-red-400",
  serious: "text-orange-500 dark:text-orange-400",
  moderate: "text-amber-600 dark:text-amber-400",
  minor: "text-sky-500 dark:text-sky-400",
  unknown: "text-muted-foreground",
}

const COMPLIANCE_CONFIG = {
  passed: {
    label: "✓ meets wcag 2 aa",
    note: "automated check — ~30–40% of criteria covered",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  unverified: {
    label: "⚠ needs manual review",
    note: "no violations found, but incomplete items require human review",
    className:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  },
  failed: {
    label: "✗ wcag 2 aa violations found",
    note: "fix all A/AA violations to meet minimum requirements",
    className:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
  },
}

export function ScorePanel({
  results,
  breakdown,
  compliance,
}: ScorePanelProps) {
  const [open, setOpen] = useState(false)
  const {
    score,
    passes,
    violations,
    passRate,
    penalties,
    violationsByImpact,
    incompleteByImpact,
  } = breakdown
  const complianceCfg = COMPLIANCE_CONFIG[compliance.status]

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {/* Score tile */}
          <div className="col-span-1 flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-3">
            <ChartContainer
              config={{ score: { label: "Score", color: "rgb(245 158 11)" } }}
              className="h-20 w-20"
            >
              <RadialBarChart
                data={[{ score }]}
                startAngle={90}
                endAngle={90 - 360 * (score / 100)}
                innerRadius={30}
                outerRadius={40}
                barSize={8}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  dataKey="score"
                  background={{ fill: "var(--color-border)" }}
                  fill="rgb(245 158 11)"
                  cornerRadius={4}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v) => [`${v} / 100`, "Score"]}
                    />
                  }
                />
              </RadialBarChart>
            </ChartContainer>

            <span className="font-mono text-xl font-bold text-amber-500 tabular-nums">
              {score}
            </span>
            <span className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">
              / 100
            </span>

            <button
              onClick={() => setOpen(true)}
              className="mt-1 rounded border border-border px-2 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase transition-colors hover:border-foreground/20 hover:text-muted-foreground"
            >
              breakdown
            </button>
          </div>

          {/* Stat tiles */}
          <div className="col-span-3 grid grid-cols-3 gap-3">
            <StatTile
              label="issues"
              count={results.violations.length}
              accent="text-red-500 dark:text-red-400"
            />
            <StatTile
              label="review"
              count={breakdown.cleanIncomplete.length}
              accent="text-amber-600 dark:text-amber-400"
            />
            <StatTile
              label="passed"
              count={breakdown.passes}
              accent="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Compliance badge */}
        <div
          className={`rounded-lg border px-4 py-2.5 ${complianceCfg.className}`}
        >
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase">
            {complianceCfg.label}
          </p>
          <p className="mt-0.5 font-mono text-[10px] opacity-70">
            {compliance.status === "failed"
              ? `${compliance.minimumViolationCount} wcag a/aa violation${compliance.minimumViolationCount !== 1 ? "s" : ""} · fix these first`
              : compliance.status === "unverified"
                ? `${compliance.minimumIncompleteCount} item${compliance.minimumIncompleteCount !== 1 ? "s" : ""} need manual review`
                : complianceCfg.note}
          </p>
        </div>
      </div>

      {/* Breakdown dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              score breakdown
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Score summary */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="font-mono text-2xl font-bold text-amber-500 tabular-nums">
                  {score}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / 100
                  </span>
                </p>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  final score
                </p>
              </div>
              <div className="space-y-0.5 text-right font-mono text-[11px] text-muted-foreground">
                <p>
                  pass rate{" "}
                  <span className="text-foreground">
                    {(passRate * 100).toFixed(2)}%
                  </span>
                </p>
                <p>
                  {passes} / {passes + violations} rules
                </p>
                <p>
                  penalties{" "}
                  <span className="text-red-500 dark:text-red-400">
                    −{penalties.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            {/* Pass rate */}
            <div>
              <p className="mb-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                pass rate
              </p>
              <div className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2 font-mono text-xs">
                <span className="text-foreground">
                  {passes} passes / {passes + violations} total rules
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {(passRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Violations */}
            {IMPACT_ORDER.some((lvl) => violationsByImpact[lvl]) && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  violation penalties
                </p>
                <div className="divide-y divide-border/60 overflow-hidden rounded border border-border">
                  {IMPACT_ORDER.filter((lvl) => violationsByImpact[lvl]).map(
                    (lvl) => (
                      <div
                        key={lvl}
                        className="flex items-center justify-between bg-muted/20 px-3 py-2 font-mono text-xs"
                      >
                        <span className="text-foreground capitalize">
                          {lvl}
                          <span className="ml-1.5 text-muted-foreground">
                            ×{IMPACT_PENALTIES[lvl]}
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {violationsByImpact[lvl]} found
                          </span>
                          <span
                            className={`tabular-nums ${IMPACT_COLORS[lvl]}`}
                          >
                            −
                            {(
                              violationsByImpact[lvl] * IMPACT_PENALTIES[lvl]
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Incomplete */}
            {IMPACT_ORDER.some((lvl) => incompleteByImpact[lvl]) && (
              <div>
                <p className="mb-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  review penalties{" "}
                  <span className="text-muted-foreground/60">
                    (half penalty)
                  </span>
                </p>
                <div className="divide-y divide-border/60 overflow-hidden rounded border border-border">
                  {IMPACT_ORDER.filter((lvl) => incompleteByImpact[lvl]).map(
                    (lvl) => (
                      <div
                        key={lvl}
                        className="flex items-center justify-between bg-muted/20 px-3 py-2 font-mono text-xs"
                      >
                        <span className="text-foreground capitalize">
                          {lvl}
                          <span className="ml-1.5 text-muted-foreground">
                            ×{(IMPACT_PENALTIES[lvl] * 0.5).toFixed(2)}
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {incompleteByImpact[lvl]} found
                          </span>
                          <span
                            className={`tabular-nums ${IMPACT_COLORS[lvl]}`}
                          >
                            −
                            {(
                              incompleteByImpact[lvl] *
                              IMPACT_PENALTIES[lvl] *
                              0.5
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Formula */}
            <div className="rounded border border-border bg-muted/40 px-3 py-2.5 font-mono text-[11px]">
              <p className="mb-2 text-[10px] tracking-widest text-muted-foreground uppercase">
                formula
              </p>

              {/* Pass rate fraction */}
              <div className="mb-2 flex flex-col items-center gap-0.5 py-1 text-xs">
                <span className="text-foreground">passes</span>
                <div className="w-full border-t border-border" />
                <span className="text-muted-foreground">
                  (passes + violations)
                </span>
              </div>

              {/* Combined formula */}
              <div className="rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
                score = clamp(passRate × 100 − penalties, 0, 100)
              </div>

              <div className="mt-3 border-t border-border pt-2.5">
                <p className="mb-2 text-[10px] tracking-widest text-muted-foreground uppercase">
                  penalty weights
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">
                      critical
                    </span>
                    <span className="text-red-500 dark:text-red-400">−4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">
                      serious
                    </span>
                    <span className="text-orange-500 dark:text-orange-400">
                      −3
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">
                      moderate
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      −2
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">
                      minor
                    </span>
                    <span className="text-sky-500 dark:text-sky-400">−1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
