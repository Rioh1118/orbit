import { describe, expect, it } from "vitest";
import {
  type ModeWeekRow,
  type SideAgg,
  analyzeThenVsNow,
  buildNarrative,
  computeDeltas,
  hasEnoughData,
  topSlices,
} from "./thenVsNow";

function row(week: string, mode: string, minutes: number): ModeWeekRow {
  return { week, mode, seconds: minutes * 60 };
}

function side(minutesByMode: Record<string, number>, weeksWithData: number): SideAgg {
  const totalMinutes = Object.values(minutesByMode).reduce((a, b) => a + b, 0);
  return { minutesByMode, totalMinutes, weeksWithData };
}

describe("analyzeThenVsNow — aggregation & shares", () => {
  const rows: ModeWeekRow[] = [
    row("2026-05-04", "code_explore", 30),
    row("2026-05-04", "implement", 20),
    row("2026-05-11", "code_explore", 30),
    row("2026-05-11", "implement", 20),
    row("2026-05-18", "code_explore", 15),
    row("2026-05-18", "implement", 35),
    row("2026-05-25", "code_explore", 15),
    row("2026-05-25", "implement", 35),
  ];

  it("splits weeks into Then (first half) / Now (second half) and sums minutes", () => {
    const a = analyzeThenVsNow(rows);
    expect(a.then.totalMinutes).toBe(100);
    expect(a.now.totalMinutes).toBe(100);
    expect(a.then.weeksWithData).toBe(2);
    expect(a.now.weeksWithData).toBe(2);
    expect(a.then.minutesByMode.code_explore).toBe(60);
    expect(a.now.minutesByMode.implement).toBe(70);
  });

  it("computes share-point deltas (now - then)", () => {
    const a = analyzeThenVsNow(rows);
    const impl = a.deltas.find((d) => d.mode === "implement");
    const ce = a.deltas.find((d) => d.mode === "code_explore");
    expect(impl?.deltaPp).toBe(30);
    expect(ce?.deltaPp).toBe(-30);
  });
});

describe("improvement direction (accent only on improvement)", () => {
  it("greens implement increasing and code_explore decreasing (mastery)", () => {
    const then = side({ code_explore: 60, implement: 40 }, 2);
    const now = side({ code_explore: 30, implement: 70 }, 2);
    const deltas = computeDeltas(then, now);
    expect(deltas.find((d) => d.mode === "implement")?.improvement).toBe(true);
    expect(deltas.find((d) => d.mode === "code_explore")?.improvement).toBe(true);
  });

  it("never greens a regression: implement falling or debug rising", () => {
    const then = side({ implement: 200 }, 2);
    const now = side({ implement: 120, debug: 80 }, 2);
    const deltas = computeDeltas(then, now);
    expect(deltas.find((d) => d.mode === "implement")?.improvement).toBe(false); // -40pp
    expect(deltas.find((d) => d.mode === "debug")?.improvement).toBe(false); // +40pp regression
  });

  it("ignores changes below the significance threshold", () => {
    const then = side({ implement: 50, code_explore: 50 }, 2);
    const now = side({ implement: 52, code_explore: 48 }, 2);
    const deltas = computeDeltas(then, now);
    expect(deltas.every((d) => d.improvement === false)).toBe(true);
  });
});

describe("hasEnoughData — sample-size gate", () => {
  it("passes when both sides have >= 2 weeks and >= the minute floor", () => {
    expect(hasEnoughData(side({ implement: 100 }, 2), side({ implement: 100 }, 2))).toBe(true);
  });

  it("fails when a side has only one week of data", () => {
    expect(hasEnoughData(side({ implement: 100 }, 1), side({ implement: 100 }, 2))).toBe(false);
  });

  it("fails when a side is below the minute floor", () => {
    expect(hasEnoughData(side({ implement: 20 }, 2), side({ implement: 100 }, 2))).toBe(false);
  });
});

describe("buildNarrative", () => {
  it("reports insufficient data when the gate fails", () => {
    const deltas = computeDeltas(side({ implement: 100 }, 2), side({ implement: 100 }, 2));
    expect(buildNarrative(deltas, false)).toContain("十分なデータがありません");
  });

  it("reports no meaningful change when the top delta is below threshold", () => {
    const deltas = computeDeltas(
      side({ implement: 52, code_explore: 48 }, 2),
      side({ implement: 50, code_explore: 50 }, 2),
    );
    expect(buildNarrative(deltas, true)).toContain("大きな変化は見えていません");
  });

  it("names the two biggest movers when both are significant", () => {
    const deltas = computeDeltas(
      side({ code_explore: 60, implement: 40 }, 2),
      side({ code_explore: 30, implement: 70 }, 2),
    );
    const text = buildNarrative(deltas, true);
    expect(text).toContain("implement");
    expect(text).toContain("code explore");
    expect(text).toMatch(/[+-]?30pp/);
  });
});

describe("topSlices — donut top-N + その他", () => {
  it("keeps the top 4 modes and groups the rest", () => {
    const s = side(
      { implement: 50, code_explore: 40, debug: 30, review: 20, study: 10, spec_read: 5 },
      2,
    );
    const slices = topSlices(s);
    expect(slices).toHaveLength(5);
    const rest = slices.find((sl) => sl.key === "__rest__");
    expect(rest?.minutes).toBe(15); // study 10 + spec_read 5
    expect(slices.filter((sl) => sl.key !== "__rest__").map((sl) => sl.key)).toEqual([
      "implement",
      "code_explore",
      "debug",
      "review",
    ]);
  });

  it("omits the その他 bucket when there are 4 or fewer modes", () => {
    const s = side({ implement: 50, code_explore: 40, debug: 30 }, 2);
    const slices = topSlices(s);
    expect(slices.some((sl) => sl.key === "__rest__")).toBe(false);
  });
});

describe("edge cases", () => {
  it("treats empty rows as insufficient data", () => {
    const a = analyzeThenVsNow([]);
    expect(a.hasEnough).toBe(false);
    expect(a.narrative).toContain("十分なデータがありません");
    expect(a.deltas).toEqual([]);
  });

  it("treats all-zero-duration rows as insufficient (the minute floor catches it)", () => {
    const rows: ModeWeekRow[] = [
      row("2026-05-04", "implement", 0),
      row("2026-05-11", "implement", 0),
      row("2026-05-18", "implement", 0),
      row("2026-05-25", "implement", 0),
    ];
    expect(analyzeThenVsNow(rows).hasEnough).toBe(false);
  });

  it("buildNarrative on empty deltas (defensive) reports no meaningful change", () => {
    expect(buildNarrative([], true)).toContain("大きな変化は見えていません");
  });
});
