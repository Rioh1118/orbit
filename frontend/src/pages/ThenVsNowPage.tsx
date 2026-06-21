import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { CategoryTabs, type Category } from "@/components/orbit/CategoryTabs";
import { DeltaTable } from "@/components/orbit/DeltaTable";
import { PeriodTabs } from "@/components/orbit/PeriodTabs";
import { ThenNowDonuts } from "@/components/orbit/ThenNowDonuts";
import { ThenVsNowChart, type WeekPoint } from "@/components/orbit/ThenVsNowChart";
import { Divider } from "@/components/ui/Divider";
import { ErrorText } from "@/components/ui/ErrorText";
import { chartTheme } from "@/lib/chartTheme";
import {
  ALL_WINDOW_WEEKS,
  analyzeThenVsNow,
  type ThenVsNowWindow,
} from "@/lib/thenVsNow";
import { useThenVsNow } from "@/features/reports/hooks";

const MIN_WEEKS_FOR_TREND = 2;

function shortWeek(week: string): string {
  return week.length >= 10 ? week.slice(5) : week;
}

export default function ThenVsNowPage() {
  const [category, setCategory] = useState<Category>("new_feature");
  const [period, setPeriod] = useState<ThenVsNowWindow>(8);
  const weeks = period === "all" ? ALL_WINDOW_WEEKS : period;
  const { data, isLoading, error } = useThenVsNow(category, weeks);

  const modeRows = useMemo(() => data?.mode_by_week ?? [], [data]);

  // Comparison-narrative core (donuts + delta + sample-size gate) — the new main view.
  const analysis = useMemo(() => analyzeThenVsNow(modeRows), [modeRows]);

  // Demoted weekly trend (proportion area chart), folded away under <details>.
  const { points, modes } = useMemo(() => {
    const byWeek = new Map<string, WeekPoint>();
    const order: string[] = [];
    const modeSet = new Set<string>();
    for (const r of modeRows) {
      modeSet.add(r.mode);
      if (!byWeek.has(r.week)) {
        byWeek.set(r.week, { week: shortWeek(r.week) } as WeekPoint);
        order.push(r.week);
      }
      const w = byWeek.get(r.week);
      if (w) w[r.mode] = Math.round(r.seconds / 60);
    }
    return { points: order.map((k) => byWeek.get(k) as WeekPoint), modes: Array.from(modeSet) };
  }, [modeRows]);

  const completionSeries = useMemo(
    () =>
      (data?.completed_by_week ?? [])
        .filter((c) => c.task_count >= 1)
        .map((c) => ({
          week: shortWeek(c.week),
          min: Math.round(c.avg_seconds_per_task / 60),
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryTabs value={category} onChange={setCategory} />
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {isLoading && <p className="text-sm text-ink-muted">読み込み中…</p>}
      {error && <ErrorText>{(error as Error).message}</ErrorText>}

      {!isLoading && !error && (
        <>
          <section>
            <p className="prose-ledger text-base text-ink">{analysis.narrative}</p>
          </section>

          {analysis.hasEnough && (
            <>
              <section>
                <ThenNowDonuts
                  donutThen={analysis.donutThen}
                  donutNow={analysis.donutNow}
                  thenTotalMinutes={analysis.then.totalMinutes}
                  nowTotalMinutes={analysis.now.totalMinutes}
                />
              </section>

              <section>
                <Divider label="モード配分の変化" />
                <div className="mt-4">
                  <DeltaTable deltas={analysis.deltas} />
                </div>
              </section>
            </>
          )}

          <details className="rounded-lg border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm text-ink-muted">週次推移を見る</summary>
            {points.length >= MIN_WEEKS_FOR_TREND ? (
              <div className="mt-4">
                <ThenVsNowChart data={points} modes={modes} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">
                週次推移を表示するにはデータが不足しています。
              </p>
            )}
          </details>

          <section>
            <Divider label="完了時間 / タスク (分)" />
            {completionSeries.length < MIN_WEEKS_FOR_TREND ? (
              <p className="mt-4 text-sm text-ink-muted">データ不足 — 完了タスクが足りません</p>
            ) : (
              <div
                className="mt-4 h-24 w-full"
                role="img"
                aria-label="タスクあたりの完了時間の週次推移（分）"
              >
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
                      isAnimationActive={false}
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
                <span className="ml-2 text-xs text-ink-muted">{frictionSummary.detail}</span>
              )}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
