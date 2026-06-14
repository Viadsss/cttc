interface StatTileProps {
  label: string
  count: number
  accent: string
}

export function StatTile({ label, count, accent }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-4">
      <span className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>
        {count}
      </span>
      <span className="font-mono text-[11px] tracking-widest text-muted-foreground/80 uppercase">
        {label}
      </span>
    </div>
  )
}
