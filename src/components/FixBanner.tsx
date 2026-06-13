import { Loader2, Wrench } from "lucide-react"

interface FixBannerProps {
  fixesApplied: boolean
  applyingFixes: boolean
  currentTabUrl: string
  onApplyFixes: () => void
}

export function FixBanner({
  fixesApplied,
  applyingFixes,
  currentTabUrl,
  onApplyFixes,
}: FixBannerProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
        fixesApplied
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
      }`}
    >
      <div>
        <p
          className={`mb-0.5 text-[11px] font-bold tracking-wider uppercase ${
            fixesApplied
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-blue-700 dark:text-blue-400"
          }`}
        >
          {fixesApplied ? "✓ patch applied" : "patch available"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {fixesApplied
            ? "Accessibility fixes injected — rescanning complete."
            : `Known fixes available for ${currentTabUrl}. Inject and rescan.`}
        </p>
      </div>

      {!fixesApplied && (
        <button
          disabled={applyingFixes}
          onClick={onApplyFixes}
          className="flex shrink-0 items-center gap-1.5 rounded border border-blue-300 bg-blue-100 px-3 py-1.5 text-[11px] tracking-wider text-blue-700 uppercase transition-colors hover:border-blue-500 hover:bg-blue-200 disabled:opacity-40 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          {applyingFixes ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              applying
            </>
          ) : (
            <>
              <Wrench className="h-3 w-3" />
              inject
            </>
          )}
        </button>
      )}
    </div>
  )
}
