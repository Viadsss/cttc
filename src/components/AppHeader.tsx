import { Zap } from "lucide-react"

export function AppHeader() {
  return (
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
          axe-core · wcag 2.2 audit engine
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground/40 uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500/60" />
        ready
      </div>
    </div>
  )
}
