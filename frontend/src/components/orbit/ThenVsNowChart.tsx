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

export interface WeekPoint {
  week: string;
  [mode: string]: number | string;
}

interface ThenVsNowChartProps {
  data: WeekPoint[];
  modes: string[];
}

export function ThenVsNowChart({ data, modes }: ThenVsNowChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
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
            unit="m"
          />
          <Tooltip contentStyle={chartTheme.tooltipStyle} cursor={{ fill: "rgba(148,180,193,0.06)" }} />
          {modes.map((m) => (
            <Area
              key={m}
              type="monotone"
              dataKey={m}
              stackId="1"
              stroke={modeColors[m] ?? "#6b7a89"}
              fill={modeColors[m] ?? "#6b7a89"}
              fillOpacity={0.85}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
