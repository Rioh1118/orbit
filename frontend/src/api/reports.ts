import { request } from "./client";

export interface ModeWeek {
  week: string;
  mode: string;
  seconds: number;
}

export interface CompletedWeek {
  week: string;
  task_count: number;
  total_seconds: number;
  avg_seconds_per_task: number;
}

export interface FrictionWeek {
  week: string;
  pattern_tag: string;
  count: number;
}

export interface ThenVsNow {
  category: string;
  tz: string;
  from: string;
  to: string;
  mode_by_week: ModeWeek[];
  completed_by_week: CompletedWeek[];
  friction_by_week: FrictionWeek[];
}

export interface ThenVsNowQuery {
  category: string;
  weeks?: number;
  tz?: string;
}

export const reportsApi = {
  thenVsNow: (q: ThenVsNowQuery) => {
    const params = new URLSearchParams({ category: q.category });
    if (q.weeks) params.set("weeks", String(q.weeks));
    if (q.tz) params.set("tz", q.tz);
    return request<ThenVsNow>(`/v1/reports/then-vs-now?${params.toString()}`);
  },
};
