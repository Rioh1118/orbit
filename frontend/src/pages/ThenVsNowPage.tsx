import { useMemo, useState } from "react";
import { CategoryTabs, type Category } from "@/components/orbit/CategoryTabs";
import {
  ThenVsNowChart,
  type WeekPoint,
} from "@/components/orbit/ThenVsNowChart";
import { Divider } from "@/components/ui/Divider";
import { StatTile } from "@/components/orbit/StatTile";
import { useThenVsNow } from "@/features/reports/hooks";

const MIN_WEEKS_FOR_SIGNAL = 2;

function shortWeek(week: string): string {
  // "2026-06-15" -> "06-15"
  return week.length >= 10 ? week.slice(5) : week;
}

function formatHM(seconds: number): string {
  const m = Math.round(seconds / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

function pctChange(first: number, last: number): string {
  if (first === 0) return "—";
  return `${Math.round(((last - first) / first) * 100)}%`;
}

export default function ThenVsNowPage() {
  const [category, setCategory] = useState<Category>("new_feature");
  const { data, isLoading, error } = useThenVsNow(category);

  const { points, modes } = useMemo(() => {
    if (!data) return { points: [] as WeekPoint[], modes: [] as string[] };
    const byWeek = new Map<string, WeekPoint>();
    const modeSet = new Set<string>();
    for (const r of data.mode_by_week) {
      modeSet.add(r.mode);
      const w =
        byWeek.get(r.week) ?? ({ week: shortWeek(r.week) } as WeekPoint);
      w[r.mode] = Math.round(r.seconds / 60);
      byWeek.set(r.week, w);
    }
    return { points: Array.from(byWeek.values()), modes: Array.from(modeSet) };
  }, [data]);

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

  // first→now change for a signal mode (minutes).
  const changeFor = (mode: string): string => {
    if (points.length < MIN_WEEKS_FOR_SIGNAL) return "—";
    const first = Number(points[0][mode] ?? 0);
    const last = Number(points[points.length - 1][mode] ?? 0);
    return pctChange(first, last);
  };

  const latestCompleted = data?.completed_by_week.at(-1);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-instrument text-mist">
          then · vs · now
        </p>
        <h1 className="mt-2 font-serif text-2xl text-parchment">
          同じ作業、前より速く解けるようになった?
        </h1>
      </header>

      <CategoryTabs value={category} onChange={setCategory} />

      {isLoading && <p className="text-sm text-mist">loading…</p>}
      {error && (
        <p className="text-sm text-danger">error: {(error as Error).message}</p>
      )}

      {!isLoading && !error && points.length < MIN_WEEKS_FOR_SIGNAL && (
        <p className="font-mono text-xs uppercase tracking-instrument text-mist">
          データ不足 — あと {MIN_WEEKS_FOR_SIGNAL - points.length}{" "}
          週分で推移を表示します
        </p>
      )}

      {points.length >= MIN_WEEKS_FOR_SIGNAL && (
        <>
          <section>
            <Divider label="mode allocation / weekly (minutes)" />
            <div className="mt-5">
              <ThenVsNowChart data={points} modes={modes} />
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <StatTile
              label="code explore"
              value={changeFor("code_explore")}
              hint="first → now"
            />
            <StatTile
              label="implement"
              value={changeFor("implement")}
              hint="first → now"
            />
            <StatTile
              label="completion / task"
              value={
                latestCompleted
                  ? formatHM(latestCompleted.avg_seconds_per_task)
                  : "—"
              }
              hint="latest week avg"
            />
          </section>

          <section>
            <Divider label="frictions / this window" />
            <p className="mt-4 font-mono text-sm text-parchment">
              {frictionSummary.total} 件
              {frictionSummary.detail && (
                <span className="ml-2 text-xs text-mist">
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
