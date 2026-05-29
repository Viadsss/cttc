import type { AxeResults } from "axe-core"
import { DiagRow } from "./DiagRow"

interface MetaPanelProps {
  results: AxeResults
}

export function MetaPanel({ results }: MetaPanelProps) {
  return (
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
  )
}
