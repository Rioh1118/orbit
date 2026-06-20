interface StatTileProps {
  label: string;
  value: number | string;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-md border border-instrument/30 bg-canvas/40 p-4">
      <div className="text-xs font-medium text-mist">{label}</div>
      <div className="mt-2 font-mono text-3xl text-parchment">{value}</div>
      {hint && <div className="mt-1 text-xs text-parchment-muted">{hint}</div>}
    </div>
  );
}
