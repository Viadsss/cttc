import { Button } from "@/components/ui/button"
import type { AxeResults, Result, RunOptions } from "axe-core"
import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Zap,
  MinusCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import type axe from "axe-core"

/**
 * axe-core impact levels (low → high severity):
 *   minor     – unlikely to impact most users; cosmetic/inconvenient
 *   moderate  – affects some users; should be fixed but isn't blocking
 *   serious   – impacts many users; difficult to work around
 *   critical  – blocks access for many users; must fix immediately
 */
const impactConfig: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  minor: {
    label: "Minor",
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-700",
    dot: "bg-sky-400",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  serious: {
    label: "Serious",
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  critical: {
    label: "Critical",
    bg: "bg-red-50",
    border: "border-red-500",
    text: "text-red-700",
    dot: "bg-red-600",
  },
  unknown: {
    label: "Unknown",
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
}

function getImpact(impact?: string | null) {
  return impactConfig[impact ?? ""] ?? impactConfig.unknown
}

// ─── Collapsible Section ────────────────────────────────────────────────────

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
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted"
      >
        <span className="text-muted-foreground">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        {icon}
        <span className="font-semibold text-foreground">{title}</span>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </button>

      {open && <div className="space-y-2 pl-1">{children}</div>}
    </div>
  )
}

// ─── App ────────────────────────────────────────────────────────────────────

export function App() {
  const [results, setResults] = useState<AxeResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)

  const onClick = async () => {
    try {
      setLoading(true)
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

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
        func: (options) => {
          return new Promise<unknown>((resolve, reject) => {
            // @ts-expect-error - axe is injected into the page
            axe.run(document, options, (err: Error, results: unknown) => {
              if (err) reject(err)
              else resolve(results)
            })
          })
        },
      })

      const axeResults = injectionResults[0].result as AxeResults
      setResults(axeResults)
    } catch (error) {
      console.error("Error running accessibility check:", error)
    } finally {
      setLoading(false)
    }
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

  const summaryCards = results
    ? [
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
        {
          label: "N/A",
          icon: <MinusCircle className="h-5 w-5" />,
          count: results.inapplicable.length,
          color: "text-muted-foreground",
        },
      ]
    : []

  function toggleIssue(key: string) {
    setExpandedIssue((prev) => (prev === key ? null : key))
  }

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AccessCheck</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Web accessibility testing powered by axe-core
          </p>
        </div>

        {/* Main Button */}
        <Button
          onClick={onClick}
          disabled={loading}
          className="mb-6 h-12 w-full text-base font-semibold"
        >
          {loading ? "Scanning..." : "Run Accessibility Check"}
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* URL & Timestamp */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 font-medium text-muted-foreground">
                    Tested URL
                  </p>
                  <p className="truncate font-mono text-xs break-all text-primary">
                    {results.url}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-muted-foreground">
                    Tested At
                  </p>
                  <p className="text-xs text-foreground">
                    {new Date(results.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Overall Score
                  </p>
                  <div className="text-4xl font-bold text-foreground">
                    {scorePercentage}%
                  </div>
                </div>
                <div className="relative h-24 w-24">
                  <svg className="-rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="var(--color-chart-1)"
                      strokeWidth="8"
                      strokeDasharray={`${(scorePercentage / 100) * 283} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Impact Legend */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Impact Severity Legend
              </p>
              <div className="flex flex-wrap gap-2">
                {(["minor", "moderate", "serious", "critical"] as const).map(
                  (level) => {
                    const cfg = impactConfig[level]
                    return (
                      <div
                        key={level}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.border} ${cfg.text}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </div>
                    )
                  }
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                <strong>Minor</strong> – unlikely to impact most users.{" "}
                <strong>Moderate</strong> – affects some; should be fixed.{" "}
                <strong>Serious</strong> – impacts many; hard to work around.{" "}
                <strong>Critical</strong> – blocks access; fix immediately.
              </p>
            </div>

            {/* Summary Cards (4-col) */}
            <div className="grid grid-cols-4 gap-3">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-border bg-card p-4 text-center"
                >
                  <div className={`mb-2 flex justify-center ${card.color}`}>
                    {card.icon}
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {card.count}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>

            {/* All four sections — each collapsible */}
            <div className="space-y-4">
              {/* Violations */}
              {results.violations.length > 0 && (
                <Section
                  title="Accessibility Issues"
                  count={results.violations.length}
                  icon={<AlertCircle className="h-5 w-5 text-destructive" />}
                  defaultOpen={true}
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

              {/* Incomplete */}
              {results.incomplete.length > 0 && (
                <Section
                  title="Needs Review"
                  count={results.incomplete.length}
                  icon={<HelpCircle className="h-5 w-5 text-amber-500" />}
                  defaultOpen={true}
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

              {/* Passes */}
              {results.passes.length > 0 && (
                <Section
                  title="Passed Rules"
                  count={results.passes.length}
                  icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
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

              {/* Inapplicable */}
              {results.inapplicable.length > 0 && (
                <Section
                  title="Not Applicable"
                  count={results.inapplicable.length}
                  icon={
                    <MinusCircle className="h-5 w-5 text-muted-foreground" />
                  }
                  defaultOpen={false}
                >
                  {results.inapplicable.map((issue) => {
                    const key = `inapplicable-${issue.id}`
                    return (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        type="inapplicable"
                        isExpanded={expandedIssue === key}
                        onToggle={() => toggleIssue(key)}
                      />
                    )
                  })}
                </Section>
              )}

              {/* All-clear banner */}
              {results.violations.length === 0 &&
                results.incomplete.length === 0 && (
                  <div className="rounded-lg border border-border bg-card p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-chart-1" />
                    <h3 className="mb-1 font-semibold text-foreground">
                      Great job!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No accessibility issues detected
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!results && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Click the button above to scan this page for accessibility issues
          </div>
        )}
      </div>
    </div>
  )
}

// ─── IssueCard ───────────────────────────────────────────────────────────────

interface IssueCardProps {
  issue: Result
  type: "violations" | "incomplete" | "passes" | "inapplicable"
  isExpanded: boolean
  onToggle: () => void
}

function IssueCard({ issue, type, isExpanded, onToggle }: IssueCardProps) {
  const impact = getImpact(issue.impact)

  const badgeClass =
    type === "passes"
      ? "bg-green-50 border border-green-300 text-green-700"
      : type === "inapplicable"
        ? "bg-gray-50 border border-gray-300 text-gray-500"
        : `${impact.bg} border ${impact.border} ${impact.text}`

  const badgeLabel =
    type === "passes"
      ? "Passed"
      : type === "inapplicable"
        ? "N/A"
        : impact.label

  const showDot = type !== "passes" && type !== "inapplicable"

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <div className="flex-1">
          <h4 className="mb-1 text-sm font-semibold text-foreground">
            {issue.help}
          </h4>
          <p className="text-xs text-muted-foreground">{issue.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Impact / status badge */}
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${badgeClass}`}
            >
              {showDot && (
                <span className={`h-1.5 w-1.5 rounded-full ${impact.dot}`} />
              )}
              {badgeLabel}
            </span>
            {/* Element count */}
            {issue.nodes.length > 0 && (
              <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {issue.nodes.length}{" "}
                {issue.nodes.length === 1 ? "element" : "elements"}
              </span>
            )}
            {/* WCAG tags */}
            {issue.tags
              .filter((t) => t.startsWith("wcag") || t === "best-practice")
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
        <div className="mt-1 ml-2 text-lg leading-none text-muted-foreground">
          {isExpanded ? "−" : "+"}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t border-border bg-muted px-4 py-3">
          {/* Description */}
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">
              {type === "passes"
                ? "Why it passed:"
                : type === "inapplicable"
                  ? "Why it's not applicable:"
                  : "What to fix:"}
            </p>
            <p className="rounded border border-border bg-card p-2 text-xs text-foreground">
              {issue.help}
            </p>
          </div>

          {/* Elements — all of them, no cap */}
          {issue.nodes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {type === "passes"
                  ? `Passing Elements (${issue.nodes.length}):`
                  : type === "inapplicable"
                    ? `Checked Elements (${issue.nodes.length}):`
                    : `Affected Elements (${issue.nodes.length}):`}
              </p>
              <div className="space-y-2">
                {issue.nodes.map((node, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="rounded border border-border bg-card p-2 font-mono text-xs break-all text-foreground">
                      {node.html}
                    </div>
                    {node.failureSummary && (
                      <p className="pl-1 text-xs text-muted-foreground italic">
                        {node.failureSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learn more */}
          {issue.helpUrl && (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-primary underline hover:text-primary/80"
            >
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default App
