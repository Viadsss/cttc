import { Loader2 } from "lucide-react"

interface ScanButtonProps {
  loading: boolean
  disabled: boolean
  onClick: () => void
}

export function ScanButton({ loading, disabled, onClick }: ScanButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-muted/50 text-xs font-bold tracking-[0.15em] text-foreground uppercase transition-all hover:border-foreground/20 hover:bg-muted disabled:opacity-40"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
          <span className="text-amber-500">scanning…</span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground/40">›</span>
          run accessibility audit
        </>
      )}
    </button>
  )
}
