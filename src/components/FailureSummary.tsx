interface FailureSummaryProps {
  summary: string
}

export function FailureSummary({ summary }: FailureSummaryProps) {
  const lines = summary.split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const [header, ...items] = lines

  return (
    <div className="rounded border border-border bg-muted/50 p-3 text-xs">
      <p className="mb-2 font-mono font-semibold text-foreground uppercase tracking-wider text-[10px]">
        {header}
      </p>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-muted-foreground font-mono">
              <span className="text-muted-foreground/40 select-none">›</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}