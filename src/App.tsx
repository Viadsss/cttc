import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { AxeResults, Result, RunOptions } from "axe-core"
import { useState } from "react"
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import {
  ChevronDown,
  ChevronRight,
  Crosshair,
  X,
  Wrench,
  Loader2,
  Zap,
} from "lucide-react"
import { URL_FIXES } from "./fixes"

// ─── Impact config ────────────────────────────────────────────────────────────

type ImpactLevel = "minor" | "moderate" | "serious" | "critical" | "unknown"

const IMPACT: Record<
  ImpactLevel,
  {
    label: string
    code: string
    description: string
    className: string
    barClass: string
  }
> = {
  minor: {
    label: "MINOR",
    code: "P4",
    description: "Cosmetic — unlikely to block most users.",
    className:
      "text-sky-500 dark:text-sky-400 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40",
    barClass: "bg-sky-500 dark:bg-sky-400",
  },
  moderate: {
    label: "MODERATE",
    code: "P3",
    description: "Affects some users — should be addressed.",
    className:
      "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
    barClass: "bg-amber-500 dark:bg-amber-400",
  },
  serious: {
    label: "SERIOUS",
    code: "P2",
    description: "Hard to work around — impacts many users.",
    className:
      "text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40",
    barClass: "bg-orange-500 dark:bg-orange-400",
  },
  critical: {
    label: "CRITICAL",
    code: "P1",
    description: "Blocks access entirely — fix immediately.",
    className:
      "text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40",
    barClass: "bg-red-500",
  },
  unknown: {
    label: "UNKNOWN",
    code: "P?",
    description: "No impact level assigned.",
    className: "text-muted-foreground border-border bg-muted/40",
    barClass: "bg-muted-foreground/40",
  },
}

function getImpact(impact?: string | null) {
  return IMPACT[(impact as ImpactLevel) ?? "unknown"] ?? IMPACT.unknown
}

// ─── Highlight helpers ────────────────────────────────────────────────────────

const AXE_ATTR = "data-axe-highlight"

async function highlightElement(selector: string) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    args: [selector, AXE_ATTR],
    func: (sel, attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        ;(el as HTMLElement).style.removeProperty("outline")
        ;(el as HTMLElement).style.removeProperty("outline-offset")
        el.removeAttribute(attr)
      })
      const el = document.querySelector(sel) as HTMLElement | null
      if (!el) return
      el.setAttribute(attr, "true")
      el.style.outline = "3px solid #ef4444"
      el.style.outlineOffset = "3px"
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    },
  })
}

async function clearHighlights() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    args: [AXE_ATTR],
    func: (attr) => {
      document.querySelectorAll(`[${attr}]`).forEach((el) => {
        ;(el as HTMLElement).style.removeProperty("outline")
        ;(el as HTMLElement).style.removeProperty("outline-offset")
        el.removeAttribute(attr)
      })
    },
  })
}

// ─── FailureSummary ───────────────────────────────────────────────────────────

function FailureSummary({ summary }: { summary: string }) {
  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  const [header, ...items] = lines
  return (
    <div className="rounded border border-border bg-muted/50 p-3 text-xs">
      <p className="mb-2 font-mono text-[10px] font-semibold tracking-wider text-foreground uppercase">
        {header}
      </p>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 font-mono text-muted-foreground"
            >
              <span className="text-muted-foreground/40 select-none">›</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── DiagRow ─────────────────────────────────────────────────────────────────

function DiagRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-xs">
      <span className="w-16 shrink-0 tracking-widest text-muted-foreground/60 uppercase">
        {label}
      </span>
      <span className="break-all text-foreground">{value}</span>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  count: number
  prefix: string
  accent: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({
  title,
  count,
  prefix,
  accent,
  defaultOpen = true,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 border-b border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted">
            <span
              className={`font-mono text-[10px] font-bold tracking-widest ${accent}`}
            >
              {prefix}
            </span>
            <span className="flex-1 font-mono text-xs font-semibold tracking-wider text-foreground uppercase">
              {title}
            </span>
            <span className="mr-2 font-mono text-xs text-muted-foreground/50">
              [{count}]
            </span>
            <span className="text-muted-foreground/40">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-border/60 bg-background">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({
  label,
  count,
  accent,
}: {
  label: string
  count: number
  accent: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-4">
      <span className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>
        {count}
      </span>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
        {label}
      </span>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [results, setResults] = useState<AxeResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [applyingFixes, setApplyingFixes] = useState(false)
  const [fixesApplied, setFixesApplied] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [currentTabUrl, setCurrentTabUrl] = useState("")

  async function runScan() {
    try {
      setLoading(true)
      setFixesApplied(false)
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      setCurrentTabUrl(tab.url ?? "")
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["node_modules/axe-core/axe.min.js"],
      })
      const axeOptions: RunOptions = {
        runOnly: {
          type: "tag",
          values: [
            "wcag2a",
            "wcag2aa",
            "wcag2aaa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
          ],
        },
      }
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        args: [axeOptions],
        func: (options) =>
          new Promise<unknown>((resolve, reject) => {
            // @ts-expect-error - axe is injected
            axe.run(document, options, (err: Error, results: unknown) => {
              if (err) reject(err)
              else resolve(results)
            })
          }),
      })
      setResults(injectionResults[0].result as AxeResults)
    } catch (error) {
      console.error("Error running accessibility check:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApplyFixes() {
    try {
      setApplyingFixes(true)
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      const fixEntry = Object.entries(URL_FIXES).find(
        ([url]) => tab.url === url
      )
      if (!fixEntry) return
      const [, fixFn] = fixEntry
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: fixFn,
      })
      setFixesApplied(true)
      await runScan()
    } catch (error) {
      console.error("Error applying fixes:", error)
    } finally {
      setApplyingFixes(false)
    }
  }

  function toggleIssue(key: string) {
    setExpandedIssue((prev) => (prev === key ? null : key))
  }

  const total = results
    ? results.passes.length +
      results.violations.length +
      results.incomplete.length
    : 0
  const scorePercentage =
    results && total > 0 ? Math.round((results.passes.length / total) * 100) : 0

  const hasFix = currentTabUrl in URL_FIXES

  return (
    <div className="min-h-screen bg-background p-4 font-mono text-foreground">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
                AccessCheck
              </h1>
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                v1
              </span>
            </div>
            <p className="text-[11px] tracking-wide text-muted-foreground/60">
              axe-core · wcag 2.x audit engine
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground/40 uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500/60" />
            ready
          </div>
        </div>

        {/* Scan button */}
        <button
          onClick={runScan}
          disabled={loading || applyingFixes}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/50 text-xs font-bold tracking-[0.15em] text-foreground uppercase transition-all hover:border-foreground/20 hover:bg-muted disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              <span className="text-amber-500">scanning…</span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/40">›</span>
              run accessibility audit
            </>
          )}
        </button>

        {results && (
          <>
            {/* Meta panel */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <DiagRow
                label="url"
                value={
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    {results.url}
                  </span>
                }
              />
              <div className="border-t border-border" />
              <DiagRow
                label="time"
                value={new Date(results.timestamp).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "medium",
                })}
              />
              <DiagRow
                label="engine"
                value="axe-core · wcag2a wcag2aa wcag21aa wcag22aa"
              />
            </div>

            {/* Fix banner */}
            {hasFix && (
              <div
                className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
                  fixesApplied
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                }`}
              >
                <div>
                  <p
                    className={`mb-0.5 text-[11px] font-bold tracking-wider uppercase ${
                      fixesApplied
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {fixesApplied ? "✓ patch applied" : "patch available"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {fixesApplied
                      ? "Accessibility fixes injected — rescanning complete."
                      : "Known fixes available for this page. Inject and rescan."}
                  </p>
                </div>
                {!fixesApplied && (
                  <button
                    disabled={applyingFixes}
                    onClick={handleApplyFixes}
                    className="flex shrink-0 items-center gap-1.5 rounded border border-blue-300 bg-blue-100 px-3 py-1.5 text-[11px] tracking-wider text-blue-700 uppercase transition-colors hover:border-blue-500 hover:bg-blue-200 disabled:opacity-40 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                  >
                    {applyingFixes ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        applying
                      </>
                    ) : (
                      <>
                        <Wrench className="h-3 w-3" />
                        inject
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Score + stats */}
            <div className="grid grid-cols-4 gap-3">
              {/* Score card */}
              <div className="col-span-1 flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 p-4">
                <ChartContainer
                  config={{
                    score: { label: "Score", color: "rgb(245 158 11)" },
                  }}
                  className="h-20 w-20"
                >
                  <RadialBarChart
                    data={[{ score: scorePercentage }]}
                    startAngle={90}
                    endAngle={90 - 360 * (scorePercentage / 100)}
                    innerRadius={30}
                    outerRadius={40}
                    barSize={8}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
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
                          formatter={(v) => [`${v}%`, "Score"]}
                        />
                      }
                    />
                  </RadialBarChart>
                </ChartContainer>
                <span className="font-mono text-lg font-bold text-amber-500 tabular-nums">
                  {scorePercentage}%
                </span>
                <span className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">
                  score
                </span>
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
                  count={results.incomplete.length}
                  accent="text-amber-600 dark:text-amber-400"
                />
                <StatTile
                  label="passed"
                  count={results.passes.length}
                  accent="text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            {/* Severity legend */}
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="mb-3 text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                impact severity
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {(
                  ["critical", "serious", "moderate", "minor"] as ImpactLevel[]
                ).map((level) => {
                  const cfg = IMPACT[level]
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <span
                        className={`w-6 text-center font-mono text-[10px] font-bold ${cfg.className.split(" ")[0]}`}
                      >
                        {cfg.code}
                      </span>
                      <div className={`h-1 w-8 rounded-full ${cfg.barClass}`} />
                      <span className="text-[11px] text-muted-foreground">
                        {cfg.description.split("—")[0].trim()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Issue sections */}
            <div className="space-y-3">
              {results.violations.length > 0 && (
                <Section
                  title="violations"
                  count={results.violations.length}
                  prefix="ERR"
                  accent="text-red-500 dark:text-red-400"
                  defaultOpen
                >
                  {results.violations.map((issue) => {
                    const key = `violation-${issue.id}`
                    return (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        type="violations"
                        isExpanded={expandedIssue === key}
                        onToggle={() => toggleIssue(key)}
                      />
                    )
                  })}
                </Section>
              )}

              {results.incomplete.length > 0 && (
                <Section
                  title="needs review"
                  count={results.incomplete.length}
                  prefix="WRN"
                  accent="text-amber-600 dark:text-amber-400"
                  defaultOpen
                >
                  {results.incomplete.map((issue) => {
                    const key = `incomplete-${issue.id}`
                    return (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        type="incomplete"
                        isExpanded={expandedIssue === key}
                        onToggle={() => toggleIssue(key)}
                      />
                    )
                  })}
                </Section>
              )}

              {results.passes.length > 0 && (
                <Section
                  title="passed rules"
                  count={results.passes.length}
                  prefix="OK"
                  accent="text-emerald-600 dark:text-emerald-400"
                  defaultOpen={false}
                >
                  {results.passes.map((issue) => {
                    const key = `pass-${issue.id}`
                    return (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        type="passes"
                        isExpanded={expandedIssue === key}
                        onToggle={() => toggleIssue(key)}
                      />
                    )
                  })}
                </Section>
              )}

              {results.violations.length === 0 &&
                results.incomplete.length === 0 && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-8 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                    <p className="mb-1 font-mono text-xs tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                      ✓ audit clean
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      No accessibility violations detected.
                    </p>
                  </div>
                )}
            </div>
          </>
        )}

        {!results && (
          <p className="py-4 text-center text-[11px] tracking-wide text-muted-foreground/40">
            — run audit to inspect this page —
          </p>
        )}
      </div>
    </div>
  )
}

// ─── IssueCard ────────────────────────────────────────────────────────────────

interface IssueCardProps {
  issue: Result
  type: "violations" | "incomplete" | "passes"
  isExpanded: boolean
  onToggle: () => void
}

function IssueCard({ issue, type, isExpanded, onToggle }: IssueCardProps) {
  const impact = getImpact(issue.impact)
  const [activeSelector, setActiveSelector] = useState<string | null>(null)

  const codeColor =
    type === "passes"
      ? "text-emerald-600 dark:text-emerald-400"
      : impact.className.split(" ")[0]

  async function handleHighlight(selector: string) {
    if (activeSelector === selector) {
      await clearHighlights()
      setActiveSelector(null)
    } else {
      await highlightElement(selector)
      setActiveSelector(selector)
    }
  }

  async function handleToggle() {
    if (isExpanded && activeSelector) {
      await clearHighlights()
      setActiveSelector(null)
    }
    onToggle()
  }

  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={handleToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span
          className={`mt-0.5 shrink-0 font-mono text-[10px] font-bold ${codeColor}`}
        >
          {type === "passes" ? "OK" : impact.code}
        </span>

        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs leading-snug font-semibold text-foreground">
            {issue.help}
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {issue.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {type !== "passes" && (
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${impact.className}`}
              >
                {impact.label}
              </span>
            )}
            {issue.nodes.length > 0 && (
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {issue.nodes.length}{" "}
                {issue.nodes.length === 1 ? "node" : "nodes"}
              </span>
            )}
            {issue.tags
              .filter((t) => t.startsWith("wcag") || t === "best-practice")
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>

        <span className="mt-0.5 shrink-0 text-base leading-none text-muted-foreground/40">
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4 bg-muted/20 px-4 pt-1 pb-4">
          <div>
            <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
              {type === "passes" ? "why it passed" : "fix required"}
            </p>
            <div className="rounded border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
              {issue.help}
            </div>
          </div>

          {issue.nodes.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
                {type === "passes" ? "passing elements" : "affected elements"}{" "}
                <span className="text-muted-foreground/30">
                  [{issue.nodes.length}]
                </span>
              </p>
              <div className="space-y-3">
                {issue.nodes.map((node, idx) => {
                  const rawTarget = node.target?.[0]
                  const selector =
                    typeof rawTarget === "string" ? rawTarget : null
                  const isHighlighted =
                    selector !== null && activeSelector === selector

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground/40">
                          node_{String(idx + 1).padStart(2, "0")}
                        </span>
                        {selector && (
                          <button
                            className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                              isHighlighted
                                ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHighlight(selector)
                            }}
                          >
                            {isHighlighted ? (
                              <>
                                <X className="h-2.5 w-2.5" />
                                clear
                              </>
                            ) : (
                              <>
                                <Crosshair className="h-2.5 w-2.5" />
                                highlight
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div
                        className={`rounded border px-3 py-2 font-mono text-[11px] leading-relaxed break-all transition-all ${
                          isHighlighted
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300"
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {node.html}
                      </div>

                      {node.failureSummary && (
                        <FailureSummary summary={node.failureSummary} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {issue.helpUrl && (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-600 transition-colors hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400"
            >
              docs ›
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default App
