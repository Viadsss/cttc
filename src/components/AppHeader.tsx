import { Zap } from "lucide-react"

export function AppHeader() {
  return (
    <div className="flex items-start justify-between pt-1">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Zap className="h-4 w-4 text-amber-500" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">
            AccessCheck
          </h1>
          <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">
            v1
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 tracking-wide">
          axe-core · wcag 2.x audit engine
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 uppercase tracking-widest">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse" />
        ready
      </div>
    </div>
  )
}