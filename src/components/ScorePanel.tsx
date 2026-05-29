import type { AxeResults } from "axe-core"
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { StatTile } from "./StatTile"

interface ScorePanelProps {
  results: AxeResults
  scorePercentage: number
}

export function ScorePanel({ results, scorePercentage }: ScorePanelProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Radial score */}
      <div className="col-span-1 flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 p-4">
        <ChartContainer
          config={{ score: { label: "Score", color: "rgb(245 158 11)" } }}
          className="h-20 w-20"
        >
          <RadialBarChart
            data={[{ score: scorePercentage }]}
            startAngle={90}
            endAngle={90 - 360 * (scorePercentage / 100)}
            innerRadius={30}
            outerRadius={40}
            barSize={8}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="score"
              background={{ fill: "var(--color-border)" }}
              fill="rgb(245 158 11)"
              cornerRadius={4}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(v) => [`${v}%`, "Score"]}
                />
              }
            />
          </RadialBarChart>
        </ChartContainer>
        <span className="font-mono text-lg font-bold text-amber-500 tabular-nums">
          {scorePercentage}%
        </span>
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground/50 uppercase">
          score
        </span>
      </div>

      {/* Stat tiles */}
      <div className="col-span-3 grid grid-cols-3 gap-3">
        <StatTile
          label="issues"
          count={results.violations.length}
          accent="text-red-500 dark:text-red-400"
        />
        <StatTile
          label="review"
          count={results.incomplete.length}
          accent="text-amber-600 dark:text-amber-400"
        />
        <StatTile
          label="passed"
          count={results.passes.length}
          accent="text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </div>
  )
}
