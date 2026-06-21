interface StatTileProps {
  label: string;
  value: number | string;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-sm motion-safe:animate-[moveInBottom_500ms_ease-out]">
      <div className="text-xs font-medium text-ink-muted">{label}</div>
      <div className="mt-2 font-mono text-3xl font-normal text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}
