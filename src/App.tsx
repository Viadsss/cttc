import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap,
  ChevronDown,
  ChevronRight,
  Crosshair,
  X,
  Wrench,
  Loader2,
} from "lucide-react"
import { URL_FIXES } from "./fixes"

// ─── Impact config ────────────────────────────────────────────────────────────

type ImpactLevel = "minor" | "moderate" | "serious" | "critical" | "unknown"

const IMPACT: Record<
  ImpactLevel,
  { label: string; description: string; className: string; dotClass: string }
> = {
  minor: {
    label: "Minor",
    description: "Cosmetic; unlikely to block most users.",
    className: "border-sky-300 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-400",
  },
  moderate: {
    label: "Moderate",
    description: "Affects some users; should be addressed.",
    className: "border-amber-300 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-400",
  },
  serious: {
    label: "Serious",
    description: "Hard to work around; impacts many users.",
    className: "border-orange-400 bg-orange-50 text-orange-700",
    dotClass: "bg-orange-500",
  },
  critical: {
    label: "Critical",
    description: "Blocks access entirely; fix immediately.",
    className: "border-red-500 bg-red-50 text-red-700",
    dotClass: "bg-red-600",
  },
  unknown: {
    label: "Unknown",
    description: "No impact level assigned.",
    className: "border-gray-300 bg-gray-50 text-gray-600",
    dotClass: "bg-gray-400",
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
    <div className="rounded-md border border-border bg-card p-3 text-xs">
      <p className="mb-1.5 font-semibold text-foreground">{header}</p>
      {items.length > 0 && (
        <ul className="space-y-1 pl-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-muted-foreground"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  count: number
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({
  title,
  count,
  icon,
  defaultOpen = true,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted">
          <span className="text-muted-foreground">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          {icon}
          <span className="font-semibold text-foreground">{title}</span>
          <Badge variant="secondary" className="ml-1 rounded-full text-xs">
            {count}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
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
            // @ts-expect-error - axe is injected into the page
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

      // Inject the fix function directly into the page
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: fixFn,
      })

      setFixesApplied(true)

      // Re-run the scan so results reflect the fixes
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

  const scorePercentage = results
    ? Math.round(
        (results.passes.length /
          (results.passes.length +
            results.violations.length +
            results.incomplete.length)) *
          100
      )
    : 0

  // Check if we have a fix registered for the current domain
  const hasFix = currentTabUrl in URL_FIXES

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AccessCheck</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Web accessibility testing powered by axe-core
          </p>
        </div>

        <Button
          onClick={runScan}
          disabled={loading || applyingFixes}
          className="h-12 w-full text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            "Run Accessibility Check"
          )}
        </Button>

        {results && (
          <>
            {/* Meta */}
            <Card>
              <CardContent className="space-y-2 pt-4 text-sm">
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    Tested URL
                  </p>
                  <p className="font-mono text-xs break-all text-primary">
                    {results.url}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    Tested At
                  </p>
                  <p className="text-xs text-foreground">
                    {new Date(results.timestamp).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fix available banner */}
            {hasFix && (
              <Card
                className={
                  fixesApplied
                    ? "border-green-300 bg-green-50"
                    : "border-blue-200 bg-blue-50"
                }
              >
                <CardContent className="flex items-center justify-between pt-4 pb-4">
                  <div>
                    <p
                      className={`text-sm font-semibold ${fixesApplied ? "text-green-800" : "text-blue-800"}`}
                    >
                      {fixesApplied
                        ? `✓ Fixes applied for ${currentTabUrl}`
                        : `We have fixes available for ${currentTabUrl}`}
                    </p>
                    <p
                      className={`mt-0.5 text-xs ${fixesApplied ? "text-green-600" : "text-blue-600"}`}
                    >
                      {fixesApplied
                        ? "Page patched and rescanned."
                        : "Click to inject accessibility fixes and rescan."}
                    </p>
                  </div>
                  {!fixesApplied && (
                    <Button
                      size="sm"
                      disabled={applyingFixes}
                      className="ml-4 shrink-0 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleApplyFixes}
                    >
                      {applyingFixes ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Applying…
                        </>
                      ) : (
                        <>
                          <Wrench className="h-3 w-3" />
                          Apply Fixes
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Score */}
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Overall Score
                  </p>
                  <p className="text-4xl font-bold text-foreground">
                    {scorePercentage}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {results.passes.length} passed /{" "}
                    {results.violations.length + results.incomplete.length}{" "}
                    issues
                  </p>
                </div>
                <ChartContainer
                  config={{
                    score: { label: "Score", color: "var(--color-chart-1)" },
                  }}
                  className="h-32 w-32"
                >
                  <RadialBarChart
                    data={[{ score: scorePercentage }]}
                    startAngle={90}
                    endAngle={90 - 360 * (scorePercentage / 100)}
                    innerRadius={44}
                    outerRadius={58}
                    barSize={12}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="score"
                      background={{ fill: "var(--color-border)" }}
                      fill="var(--color-chart-1)"
                      cornerRadius={6}
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
              </CardContent>
            </Card>

            {/* Impact Severity Legend */}
            <Card>
              <CardHeader className="pt-4 pb-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Impact Severity
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {(
                  ["minor", "moderate", "serious", "critical"] as ImpactLevel[]
                ).map((level) => {
                  const cfg = IMPACT[level]
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`w-24 justify-center gap-1.5 text-xs font-medium ${cfg.className}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`}
                        />
                        {cfg.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {cfg.description}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Summary grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Issues",
                  icon: <AlertCircle className="h-5 w-5" />,
                  count: results.violations.length,
                  color: "text-destructive",
                },
                {
                  label: "Needs Review",
                  icon: <HelpCircle className="h-5 w-5" />,
                  count: results.incomplete.length,
                  color: "text-amber-500",
                },
                {
                  label: "Passed",
                  icon: <CheckCircle2 className="h-5 w-5" />,
                  count: results.passes.length,
                  color: "text-green-600",
                },
              ].map((card) => (
                <Card key={card.label}>
                  <CardContent className="pt-4 text-center">
                    <div className={`mb-2 flex justify-center ${card.color}`}>
                      {card.icon}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {card.count}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {card.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {results.violations.length > 0 && (
                <Section
                  title="Accessibility Issues"
                  count={results.violations.length}
                  icon={<AlertCircle className="h-4 w-4 text-destructive" />}
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
                  title="Needs Review"
                  count={results.incomplete.length}
                  icon={<HelpCircle className="h-4 w-4 text-amber-500" />}
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
                  title="Passed Rules"
                  count={results.passes.length}
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
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
                  <Card>
                    <CardContent className="py-8 text-center">
                      <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
                      <h3 className="mb-1 font-semibold text-foreground">
                        Great job!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        No accessibility issues detected
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </>
        )}

        {!results && (
          <p className="text-center text-sm text-muted-foreground">
            Click the button above to scan this page for accessibility issues
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

  const impactBadgeClass =
    type === "passes"
      ? "border-green-300 bg-green-50 text-green-700"
      : impact.className
  const impactLabel = type === "passes" ? "Passed" : impact.label
  const showDot = type !== "passes"

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
    <Card className="overflow-hidden">
      <button
        onClick={handleToggle}
        className="flex w-full items-start justify-between px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold text-foreground">
            {issue.help}
          </p>
          <p className="text-xs text-muted-foreground">{issue.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`gap-1 text-xs font-medium ${impactBadgeClass}`}
            >
              {showDot && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${impact.dotClass}`}
                />
              )}
              {impactLabel}
            </Badge>
            {issue.nodes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {issue.nodes.length}{" "}
                {issue.nodes.length === 1 ? "element" : "elements"}
              </Badge>
            )}
            {issue.tags
              .filter((t) => t.startsWith("wcag") || t === "best-practice")
              .slice(0, 3)
              .map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
        <span className="mt-0.5 ml-2 text-lg leading-none text-muted-foreground">
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-border bg-muted px-4 py-3">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {type === "passes" ? "Why it passed" : "What to fix"}
            </p>
            <p className="rounded-md border border-border bg-card p-2 text-xs text-foreground">
              {issue.help}
            </p>
          </div>

          {issue.nodes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {type === "passes"
                  ? `Passing Elements (${issue.nodes.length})`
                  : `Affected Elements (${issue.nodes.length})`}
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
                        <span className="text-xs font-medium text-muted-foreground">
                          Element {idx + 1}
                        </span>
                        {selector && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-6 gap-1.5 px-2 text-xs transition-colors ${
                              isHighlighted
                                ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHighlight(selector)
                            }}
                          >
                            {isHighlighted ? (
                              <>
                                <X className="h-3 w-3" />
                                Clear
                              </>
                            ) : (
                              <>
                                <Crosshair className="h-3 w-3" />
                                Highlight
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      <div
                        className={`rounded-md border bg-card p-2 font-mono text-xs break-all text-foreground transition-all ${
                          isHighlighted
                            ? "border-red-400 ring-2 ring-red-200"
                            : "border-border"
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
              className="inline-block text-xs font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Learn more →
            </a>
          )}
        </div>
      )}
    </Card>
  )
}

export default App
