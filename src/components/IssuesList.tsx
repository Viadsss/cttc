import type { AxeResults } from "axe-core"
import { Section } from "./Section"
import { IssueCard } from "./IssueCard"

interface IssuesListProps {
  results: AxeResults
  expandedIssue: string | null
  onToggle: (key: string) => void
}

export function IssuesList({
  results,
  expandedIssue,
  onToggle,
}: IssuesListProps) {
  const isClean =
    results.violations.length === 0 && results.incomplete.length === 0

  return (
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
                onToggle={() => onToggle(key)}
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
                onToggle={() => onToggle(key)}
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
                onToggle={() => onToggle(key)}
              />
            )
          })}
        </Section>
      )}

      {isClean && (
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
  )
}
