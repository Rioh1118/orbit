import type { ThenVsNowWindow } from "@/lib/thenVsNow";

const WINDOWS: { value: ThenVsNowWindow; label: string }[] = [
  { value: 4, label: "4週" },
  { value: 8, label: "8週" },
  { value: 12, label: "12週" },
  { value: "all", label: "全期間" },
];

interface PeriodTabsProps {
  value: ThenVsNowWindow;
  onChange: (window: ThenVsNowWindow) => void;
}

/**
 * Period selector for Then-vs-Now (brief §7.9). A group of toggle buttons with
 * aria-pressed conveys the active period — each button is an independent tab stop
 * (no roving-tabindex contract to honour), which keeps the keyboard model correct
 * and simple for a segmented view switcher.
 */
export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div
      role="group"
      aria-label="期間で絞り込み"
      className="inline-flex gap-1 rounded-md border border-border bg-surface p-1"
    >
      {WINDOWS.map((w) => {
        const active = w.value === value;
        return (
          <button
            key={String(w.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(w.value)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              active ? "bg-primary/10 font-medium text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {w.label}
          </button>
        );
      })}
    </div>
  );
}
