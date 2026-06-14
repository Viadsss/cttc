import { Zap, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function AppHeader() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <div className="flex items-start justify-between pt-1">
      <div>
        <div className="mb-0.5 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
            AccessCheck
          </h1>
          <span className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            v1
          </span>
        </div>
        <p className="text-xs tracking-wide text-muted-foreground">
          axe-core · wcag 2.2 audit engine
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] tracking-widest text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          ready
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle theme (D)"
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
