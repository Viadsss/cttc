import { IMPACT } from "../lib/impact"
import type { ImpactLevel } from "../lib/impact"

const LEVELS: ImpactLevel[] = ["critical", "serious", "moderate", "minor"]

export function SeverityLegend() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="mb-3 text-[10px] tracking-widest text-muted-foreground/60 uppercase">
        impact severity
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {LEVELS.map((level) => {
          const cfg = IMPACT[level]
          return (
            <div key={level} className="flex items-center gap-2">
              <span
                className={`text-center font-mono text-[10px] font-bold ${cfg.className.split(" ")[0]}`}
              >
                {cfg.code}
              </span>
              <div className={`h-1 w-6 rounded-full ${cfg.barClass}`} />
              <span className="text-[11px] text-muted-foreground">
                {cfg.description.split("—")[0].trim()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
