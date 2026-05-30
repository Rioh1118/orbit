import { Badge } from "@/components/ui/Badge";

interface ActiveSliceBannerProps {
  taskTitle: string;
  mode: string;
  modeKey: string;
  elapsedMinutes: number;
}

export function ActiveSliceBanner({
  taskTitle,
  mode,
  modeKey,
  elapsedMinutes,
}: ActiveSliceBannerProps) {
  const hours = Math.floor(elapsedMinutes / 60);
  const mins = elapsedMinutes % 60;
  const elapsed = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="relative overflow-hidden rounded-md border border-instrument/60 bg-surface px-5 py-4 shadow-glow">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-growth" />
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-instrument text-mist">now</span>
        <span className="text-lg text-parchment">{taskTitle}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <Badge tone="default">
          {modeKey} · {mode}
        </Badge>
        <span className="font-mono text-sm text-parchment-muted">{elapsed}</span>
      </div>
    </div>
  );
}
