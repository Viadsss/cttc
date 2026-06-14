interface FailureSummaryProps {
  summary: string
}

export function FailureSummary({ summary }: FailureSummaryProps) {
  const lines = summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null

  const [header, ...items] = lines

  return (
    <div className="rounded border border-border bg-muted/50 p-3 text-sm">
      <p className="mb-2 font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
        {header}
      </p>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 font-mono text-muted-foreground"
            >
              <span className="text-muted-foreground/70 select-none">›</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
