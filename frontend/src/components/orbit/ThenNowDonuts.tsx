import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTheme, sliceColor } from "@/lib/chartTheme";
import type { DonutSlice } from "@/lib/thenVsNow";

function formatMinutes(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  }
  return `${min}m`;
}

interface DonutProps {
  title: string;
  slices: DonutSlice[];
  totalMinutes: number;
}

function Donut({ title, slices, totalMinutes }: DonutProps) {
  return (
    <div>
      <p className="mb-1 text-center text-xs font-medium text-ink-muted">{title}</p>
      <div className="relative h-44 w-full" role="img" aria-label={`${title} のモード配分`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="minutes"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={sliceColor(s.key)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTheme.tooltipStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              formatter={(value: number | string, name) => [formatMinutes(Number(value)), name as string]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-base text-ink">{formatMinutes(totalMinutes)}</span>
        </div>
      </div>
    </div>
  );
}

interface ThenNowDonutsProps {
  donutThen: DonutSlice[];
  donutNow: DonutSlice[];
  thenTotalMinutes: number;
  nowTotalMinutes: number;
}

/**
 * Two donuts (Then / Now) of mode distribution (brief §7.9). Animation is disabled so
 * the data reads as precise, not as motion. The full breakdown lives in the adjacent
 * delta table; these are the at-a-glance "shape" of each half.
 */
export function ThenNowDonuts({
  donutThen,
  donutNow,
  thenTotalMinutes,
  nowTotalMinutes,
}: ThenNowDonutsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Donut title="Then (前半)" slices={donutThen} totalMinutes={thenTotalMinutes} />
      <Donut title="Now (後半)" slices={donutNow} totalMinutes={nowTotalMinutes} />
    </div>
  );
}
