import { KeyCap } from "@/components/ui/KeyCap";
import { modeColors } from "@/lib/chartTheme";

interface ModeSlice {
  modeKey: string;
  mode: string;
  label: string;
  pct: number;
}

interface ModeBarProps {
  slices: ModeSlice[];
}

export function ModeBar({ slices }: ModeBarProps) {
  const sorted = [...slices].sort((a, b) => b.pct - a.pct);

  return (
    <ul className="space-y-2">
      {sorted.map((s) => (
        <li key={s.modeKey} className="flex items-center gap-3 text-sm">
          <KeyCap k={s.modeKey} size="sm" />
          <span className="w-24 text-mist">{s.label}</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-sm bg-instrument/20">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${s.pct}%`,
                backgroundColor: modeColors[s.mode] ?? "var(--color-instrument)",
              }}
            />
          </div>
          <span className="w-10 text-right font-mono text-xs text-parchment-muted">{s.pct}%</span>
        </li>
      ))}
    </ul>
  );
}
