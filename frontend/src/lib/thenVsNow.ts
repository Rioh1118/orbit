import { SLICE_MODE_META, type SliceMode } from "@/features/slices/types";

/**
 * Then-vs-Now analysis (brief §7.9). Pure functions so the aggregation, the
 * sample-size gate, and the rule-based narrative are unit-testable without React or
 * Recharts. The page splits a period's weeks into two halves (Then = earlier,
 * Now = later) and compares the mode *distribution* (share of time per mode).
 */

export type ThenVsNowWindow = 4 | 8 | 12 | "all";
/** "all" maps to a very large weeks query (~10 years) — effectively unbounded. */
export const ALL_WINDOW_WEEKS = 520;

export interface ModeWeekRow {
  week: string;
  mode: string;
  seconds: number;
}

// Sample-size gate (brief §7.9 / §13). MIN_WEEKS counts weeks-with-data (not calendar
// weeks), so a side with one noisy week can't fabricate a story. MIN_MINUTES guards
// against near-empty sides. Both are deliberately conservative floors.
export const MIN_WEEKS_PER_SIDE = 2;
export const MIN_MINUTES_PER_SIDE = 60;
/** A share-point change below this is "not meaningful" for narrative + accent. */
export const SIGNIFICANT_DELTA_PP = 5;
export const DONUT_TOP_N = 4;
/** Synthetic key for the grouped "その他" donut slice (distinct from the real `other` mode). */
export const REST_KEY = "__rest__";

/**
 * Per-mode "improvement" direction, grounded in ADR-005's growth signals: producing
 * more (implement up) and needing less ramp-up / getting less stuck (study,
 * code_explore, spec_read, debug down) read as growth. Everything else is neutral and
 * never coloured — accent stays a rare, meaningful signal (brief §3.3 / §7.9).
 */
const IMPROVEMENT_DIRECTION: Record<SliceMode, "up" | "down" | "none"> = {
  implement: "up",
  study: "down",
  code_explore: "down",
  spec_read: "down",
  debug: "down",
  task_breakdown: "none",
  design: "none",
  review: "none",
  verify: "none",
  consult: "none",
  other: "none",
};

export function modeLabel(mode: string): string {
  return SLICE_MODE_META[mode as SliceMode]?.label ?? mode;
}

function isImprovement(mode: string, deltaPp: number): boolean {
  const dir = IMPROVEMENT_DIRECTION[mode as SliceMode] ?? "none";
  if (dir === "up") return deltaPp >= SIGNIFICANT_DELTA_PP;
  if (dir === "down") return deltaPp <= -SIGNIFICANT_DELTA_PP;
  return false;
}

export interface SideAgg {
  weeksWithData: number;
  totalMinutes: number;
  minutesByMode: Record<string, number>;
}

export interface ModeDelta {
  mode: string;
  thenShare: number; // 0..1
  nowShare: number; // 0..1
  deltaPp: number; // (nowShare - thenShare) * 100, rounded
  improvement: boolean;
}

export interface DonutSlice {
  key: string;
  label: string;
  minutes: number;
  share: number; // 0..1
}

export interface ThenVsNowAnalysis {
  then: SideAgg;
  now: SideAgg;
  deltas: ModeDelta[]; // every mode, sorted by |deltaPp| desc
  donutThen: DonutSlice[];
  donutNow: DonutSlice[];
  hasEnough: boolean;
  narrative: string;
}

/**
 * Split rows into Then (earlier half) / Now (later half) by weeks-with-data.
 * Assumes `week` is an ISO date string (YYYY-MM-DD) so a lexicographic sort is
 * chronological — the only week format the reports API returns.
 */
export function splitWeeks(rows: ModeWeekRow[]): { thenRows: ModeWeekRow[]; nowRows: ModeWeekRow[] } {
  const weeks = Array.from(new Set(rows.map((r) => r.week))).sort();
  const mid = Math.floor(weeks.length / 2);
  const thenWeeks = new Set(weeks.slice(0, mid));
  const nowWeeks = new Set(weeks.slice(mid));
  return {
    thenRows: rows.filter((r) => thenWeeks.has(r.week)),
    nowRows: rows.filter((r) => nowWeeks.has(r.week)),
  };
}

export function aggregateSide(rows: ModeWeekRow[]): SideAgg {
  const minutesByMode: Record<string, number> = {};
  const weeks = new Set<string>();
  let totalMinutes = 0;
  for (const r of rows) {
    const minutes = Math.round(r.seconds / 60);
    minutesByMode[r.mode] = (minutesByMode[r.mode] ?? 0) + minutes;
    totalMinutes += minutes;
    weeks.add(r.week);
  }
  return { weeksWithData: weeks.size, totalMinutes, minutesByMode };
}

function share(side: SideAgg, mode: string): number {
  return side.totalMinutes > 0 ? (side.minutesByMode[mode] ?? 0) / side.totalMinutes : 0;
}

export function computeDeltas(then: SideAgg, now: SideAgg): ModeDelta[] {
  const modes = new Set([...Object.keys(then.minutesByMode), ...Object.keys(now.minutesByMode)]);
  const deltas = [...modes].map((mode) => {
    const thenShare = share(then, mode);
    const nowShare = share(now, mode);
    const deltaPp = Math.round((nowShare - thenShare) * 100);
    return { mode, thenShare, nowShare, deltaPp, improvement: isImprovement(mode, deltaPp) };
  });
  // Tie-break by mode name so equal-magnitude deltas order deterministically
  // (the narrative names deltas[0] / deltas[1]).
  deltas.sort((a, b) => Math.abs(b.deltaPp) - Math.abs(a.deltaPp) || a.mode.localeCompare(b.mode));
  return deltas;
}

export function topSlices(side: SideAgg, topN = DONUT_TOP_N): DonutSlice[] {
  const entries = Object.entries(side.minutesByMode)
    .filter(([, minutes]) => minutes > 0)
    .sort((a, b) => b[1] - a[1]);
  const slices: DonutSlice[] = entries.slice(0, topN).map(([mode, minutes]) => ({
    key: mode,
    label: modeLabel(mode),
    minutes,
    share: side.totalMinutes > 0 ? minutes / side.totalMinutes : 0,
  }));
  const restMinutes = entries.slice(topN).reduce((sum, [, minutes]) => sum + minutes, 0);
  if (restMinutes > 0) {
    slices.push({
      key: REST_KEY,
      label: "その他",
      minutes: restMinutes,
      share: side.totalMinutes > 0 ? restMinutes / side.totalMinutes : 0,
    });
  }
  return slices;
}

export function hasEnoughData(then: SideAgg, now: SideAgg): boolean {
  return (
    then.weeksWithData >= MIN_WEEKS_PER_SIDE &&
    now.weeksWithData >= MIN_WEEKS_PER_SIDE &&
    then.totalMinutes >= MIN_MINUTES_PER_SIDE &&
    now.totalMinutes >= MIN_MINUTES_PER_SIDE
  );
}

function formatDelta(d: ModeDelta): string {
  const sign = d.deltaPp > 0 ? "+" : "-";
  return `${modeLabel(d.mode)} が ${sign}${Math.abs(d.deltaPp)}pp`;
}

export function buildNarrative(deltas: ModeDelta[], enough: boolean): string {
  if (!enough) {
    return "この期間は判断に十分なデータがありません。";
  }
  const top1 = deltas[0];
  if (!top1 || Math.abs(top1.deltaPp) < SIGNIFICANT_DELTA_PP) {
    return "この期間ではモード配分の大きな変化は見えていません。";
  }
  const top2 = deltas[1];
  if (top2 && Math.abs(top2.deltaPp) >= SIGNIFICANT_DELTA_PP) {
    return `この期間で ${formatDelta(top1)}、${formatDelta(top2)} 変化しました。`;
  }
  return `この期間で ${formatDelta(top1)} 変化しました。`;
}

export function analyzeThenVsNow(rows: ModeWeekRow[]): ThenVsNowAnalysis {
  const { thenRows, nowRows } = splitWeeks(rows);
  const then = aggregateSide(thenRows);
  const now = aggregateSide(nowRows);
  const deltas = computeDeltas(then, now);
  const hasEnough = hasEnoughData(then, now);
  return {
    then,
    now,
    deltas,
    donutThen: topSlices(then),
    donutNow: topSlices(now),
    hasEnough,
    narrative: buildNarrative(deltas, hasEnough),
  };
}
