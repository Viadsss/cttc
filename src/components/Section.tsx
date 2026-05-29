import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SectionProps {
  title: string
  count: number
  prefix: string
  accent: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Section({
  title,
  count,
  prefix,
  accent,
  defaultOpen = true,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 border-b border-border bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted">
            <span
              className={`font-mono text-[10px] font-bold tracking-widest ${accent}`}
            >
              {prefix}
            </span>
            <span className="flex-1 font-mono text-xs font-semibold tracking-wider text-foreground uppercase">
              {title}
            </span>
            <span className="mr-2 font-mono text-xs text-muted-foreground/50">
              [{count}]
            </span>
            <span className="text-muted-foreground/40">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y divide-border/60 bg-background">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
