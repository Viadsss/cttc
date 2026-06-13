interface DiagRowProps {
  label: string
  value: React.ReactNode
}

export function DiagRow({ label, value }: DiagRowProps) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-xs">
      <span className="w-16 shrink-0 tracking-widest text-muted-foreground/60 uppercase">
        {label}
      </span>
      <span className="break-all text-foreground">{value}</span>
    </div>
  )
}
