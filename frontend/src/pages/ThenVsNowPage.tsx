import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { CategoryTabs, type Category } from "@/components/orbit/CategoryTabs";
import {
  ThenVsNowChart,
  type WeekPoint,
} from "@/components/orbit/ThenVsNowChart";
import { Divider } from "@/components/ui/Divider";
import { ErrorText } from "@/components/ui/ErrorText";
import { StatTile } from "@/components/orbit/StatTile";
import { chartTheme } from "@/lib/chartTheme";
import { useThenVsNow } from "@/features/reports/hooks";

const MIN_WEEKS_FOR_SIGNAL = 2;

function shortWeek(week: string): string {
  return week.length >= 10 ? week.slice(5) : week;
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export default function ThenVsNowPage() {
  const [category, setCategory] = useState<Category>("new_feature");
  const { data, isLoading, error } = useThenVsNow(category);

  // Build week points (minutes per mode) + per-week totals for share math.
  const { points, modes, totals } = useMemo(() => {
    if (!data) {
      return {
        points: [] as WeekPoint[],
        modes: [] as string[],
        totals: [] as number[],
      };
    }
    const byWeek = new Map<string, WeekPoint>();
    const order: string[] = [];
    const modeSet = new Set<string>();
    for (const r of data.mode_by_week) {
      modeSet.add(r.mode);
      if (!byWeek.has(r.week)) {
        byWeek.set(r.week, { week: shortWeek(r.week) } as WeekPoint);
        order.push(r.week);
      }
      const w = byWeek.get(r.week);
      if (w) w[r.mode] = Math.round(r.seconds / 60);
    }
    const pts = order.map((k) => byWeek.get(k) as WeekPoint);
    const tot = pts.map((p) =>
      Object.entries(p).reduce(
        (a, [k, v]) => (k === "week" ? a : a + Number(v)),
        0,
      ),
    );
    return { points: pts, modes: Array.from(modeSet), totals: tot };
  }, [data]);

  // Share-point delta first→now for a mode (review H1: proportion, not absolute).
  const shareDelta = (mode: string): string => {
    if (points.length < MIN_WEEKS_FOR_SIGNAL) return "—";
    const first = totals[0] ? Number(points[0][mode] ?? 0) / totals[0] : 0;
    const lastIdx = points.length - 1;
    const last = totals[lastIdx]
      ? Number(points[lastIdx][mode] ?? 0) / totals[lastIdx]
      : 0;
    return `${pct(first)} → ${pct(last)}`;
  };

  // Completion-time trend: avg own-time/task per week, low-N weeks suppressed (review H2 / 原則4).
  const completionSeries = useMemo(
    () =>
      (data?.completed_by_week ?? [])
        .filter((c) => c.task_count >= 1)
        .map((c) => ({
          week: shortWeek(c.week),
          min: Math.round(c.avg_seconds_per_task / 60),
          n: c.task_count,
        })),
    [data],
  );

  const frictionSummary = useMemo(() => {
    const byTag = new Map<string, number>();
    let total = 0;
    for (const b of data?.friction_by_week ?? []) {
      byTag.set(b.pattern_tag, (byTag.get(b.pattern_tag) ?? 0) + b.count);
      total += b.count;
    }
    const detail = Array.from(byTag.entries())
      .map(([tag, n]) => `${tag} ${n}`)
      .join(" · ");
    return { total, detail };
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header>
        <h1 className="text-3xl font-light tracking-tight text-ink">
          同じ作業、前より速く解けるようになった?
        </h1>
      </header>

      <CategoryTabs value={category} onChange={setCategory} />

      {isLoading && <p className="text-sm text-ink-muted">読み込み中…</p>}
      {error && <ErrorText>{(error as Error).message}</ErrorText>}

      {!isLoading && !error && points.length < MIN_WEEKS_FOR_SIGNAL && (
        <p className="text-sm text-ink-muted">
          データ不足 — あと {MIN_WEEKS_FOR_SIGNAL - points.length}{" "}
          週分で推移を表示します
        </p>
      )}

      {points.length >= MIN_WEEKS_FOR_SIGNAL && (
        <>
          <section>
            <Divider label="モード配分 / 週次比率" />
            <div className="mt-5">
              <ThenVsNowChart data={points} modes={modes} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatTile
              label="コード探索の比率"
              value={shareDelta("code_explore")}
              hint="最初 → 現在"
            />
            <StatTile
              label="実装の比率"
              value={shareDelta("implement")}
              hint="最初 → 現在"
            />
          </section>

          <section>
            <Divider label="完了時間 / タスク (分)" />
            {completionSeries.length < MIN_WEEKS_FOR_SIGNAL ? (
              <p className="mt-4 text-sm text-ink-muted">
                データ不足 — 完了タスクが足りません
              </p>
            ) : (
              <div className="mt-4 h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={completionSeries}
                    margin={{ top: 6, right: 8, left: -8, bottom: 0 }}
                  >
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={chartTheme.tooltipStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                      formatter={(v: number | string) => `${Number(v)}m`}
                    />
                    <Line
                      type="monotone"
                      dataKey="min"
                      stroke="#00a368"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section>
            <Divider label="詰まり / この期間" />
            <p className="mt-4 text-sm text-ink">
              {frictionSummary.total} 件
              {frictionSummary.detail && (
                <span className="ml-2 text-xs text-ink-muted">
                  {frictionSummary.detail}
                </span>
              )}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
