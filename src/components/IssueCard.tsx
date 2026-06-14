import { useState } from "react"
import { Crosshair, X } from "lucide-react"
import type { Result } from "axe-core"
import { getImpact } from "../lib/impact"
import { highlightElement, clearHighlights } from "../lib/highlight"
import { FailureSummary } from "./FailureSummary"

export interface IssueCardProps {
  issue: Result
  type: "violations" | "incomplete" | "passes" | "inapplicable"
  isExpanded: boolean
  onToggle: () => void
}

export function IssueCard({
  issue,
  type,
  isExpanded,
  onToggle,
}: IssueCardProps) {
  const impact = getImpact(issue.impact)
  const [activeSelector, setActiveSelector] = useState<string | null>(null)

  const codeColor =
    type === "passes"
      ? "text-emerald-600 dark:text-emerald-400"
      : type === "inapplicable"
        ? "text-muted-foreground"
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
      {/* ── Header row ── */}
      <button
        onClick={handleToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span
          className={`mt-0.5 shrink-0 font-mono text-[11px] font-bold ${codeColor}`}
        >
          {type === "passes"
            ? "OK"
            : type === "inapplicable"
              ? "N/A"
              : impact.code}
        </span>

        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-sm leading-snug font-semibold text-foreground">
            {issue.help}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {issue.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {type !== "passes" && type !== "inapplicable" && (
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${impact.className}`}
              >
                {impact.label}
              </span>
            )}
            {issue.nodes.length > 0 && (
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
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
                  className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground/80"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>

        <span className="mt-0.5 shrink-0 text-base leading-none text-muted-foreground/70">
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div className="space-y-4 bg-muted/20 px-4 pt-1 pb-4">
          {/* Fix / pass reason */}
          <div>
            <p className="mb-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
              {type === "passes"
                ? "why it passed"
                : type === "inapplicable"
                  ? "why it doesn't apply"
                  : "fix required"}
            </p>
            <div className="rounded border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {issue.help}
            </div>
          </div>

          {/* Affected / passing elements */}
          {issue.nodes.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                {type === "passes"
                  ? "passing elements"
                  : type === "inapplicable"
                    ? "matched elements"
                    : "affected elements"}{" "}
                <span className="text-muted-foreground/70">
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
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          node_{String(idx + 1).padStart(2, "0")}
                        </span>
                        {selector && (
                          <button
                            className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] transition-colors ${
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
                        className={`rounded border px-3 py-2 font-mono text-xs leading-relaxed break-all transition-all ${
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
              className="inline-flex items-center gap-1 font-mono text-xs text-amber-600 transition-colors hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400"
            >
              docs ›
            </a>
          )}
        </div>
      )}
    </div>
  )
}
