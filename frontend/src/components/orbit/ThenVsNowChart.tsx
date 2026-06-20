import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTheme, modeColors } from "@/lib/chartTheme";
import type { SliceMode } from "@/features/slices/types";

export interface WeekPoint {
  week: string;
  [mode: string]: number | string;
}

interface ThenVsNowChartProps {
  data: WeekPoint[];
  modes: string[];
}

// Renders mode *proportion* per week (stackOffset="expand"), not absolute minutes —
// so "学習割合が痩せた" is visible even when total hours change (review H1). Raw
// minutes remain available in the tooltip (secondary).
export function ThenVsNowChart({ data, modes }: ThenVsNowChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          stackOffset="expand"
          margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.opacity}
            vertical={false}
          />
          <XAxis
            dataKey="week"
            stroke={chartTheme.axis.stroke}
            fontSize={chartTheme.axis.fontSize}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={chartTheme.axis.stroke}
            fontSize={chartTheme.axis.fontSize}
            tickLine={false}
            axisLine={false}
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
          />
          <Tooltip
            contentStyle={chartTheme.tooltipStyle}
            cursor={{ fill: "rgba(148,180,193,0.06)" }}
            formatter={(value: number | string) =>
              `${Math.round(Number(value))}m`
            }
          />
          {modes.map((m) => (
            <Area
              key={m}
              type="monotone"
              dataKey={m}
              stackId="1"
              stroke={modeColors[m as SliceMode] ?? "#6b7a89"}
              fill={modeColors[m as SliceMode] ?? "#6b7a89"}
              fillOpacity={0.85}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
