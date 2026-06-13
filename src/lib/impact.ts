export type ImpactLevel =
  | "minor"
  | "moderate"
  | "serious"
  | "critical"
  | "unknown"

export interface ImpactConfig {
  label: string
  code: string
  description: string
  className: string
  barClass: string
}

export const IMPACT: Record<ImpactLevel, ImpactConfig> = {
  minor: {
    label: "MINOR",
    code: "MINOR",
    description: "Cosmetic — unlikely to block most users.",
    className:
      "text-sky-500 dark:text-sky-400 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40",
    barClass: "bg-sky-500 dark:bg-sky-400",
  },
  moderate: {
    label: "MODERATE",
    code: "MODERATE",
    description: "Affects some users — should be addressed.",
    className:
      "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
    barClass: "bg-amber-500 dark:bg-amber-400",
  },
  serious: {
    label: "SERIOUS",
    code: "SERIOUS",
    description: "Hard to work around — impacts many users.",
    className:
      "text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40",
    barClass: "bg-orange-500 dark:bg-orange-400",
  },
  critical: {
    label: "CRITICAL",
    code: "CRITICAL",
    description: "Blocks access entirely — fix immediately.",
    className:
      "text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40",
    barClass: "bg-red-500",
  },
  unknown: {
    label: "UNKNOWN",
    code: "P?",
    description: "No impact level assigned.",
    className: "text-muted-foreground border-border bg-muted/40",
    barClass: "bg-muted-foreground/40",
  },
}

export function getImpact(impact?: string | null): ImpactConfig {
  return IMPACT[(impact as ImpactLevel) ?? "unknown"] ?? IMPACT.unknown
}
