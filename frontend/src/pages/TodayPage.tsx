import { useEffect, useMemo, useState } from "react";
import { ModeBar } from "@/components/orbit/ModeBar";
import { StatTile } from "@/components/orbit/StatTile";
import { Divider } from "@/components/ui/Divider";
import { ActiveSliceCard } from "@/features/slices/ActiveSliceCard";
import { ModeSelector } from "@/features/slices/ModeSelector";
import { useSlices } from "@/features/slices/hooks";
import {
  SLICE_MODE_META,
  type SliceMode,
  type WorkSlice,
} from "@/features/slices/types";
import { FrictionModal } from "@/features/frictions/FrictionModal";
import { FrictionLog } from "@/features/frictions/FrictionLog";
import { useOpenFrictions } from "@/features/frictions/hooks";

function dayWindowISO(date: Date): { from: string; to: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function sliceDurationSec(s: WorkSlice, now: number): number {
  if (s.duration_sec != null) return s.duration_sec;
  if (s.ended_at) {
    return Math.max(
      0,
      Math.floor(
        (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) /
          1000,
      ),
    );
  }
  return Math.max(
    0,
    Math.floor((now - new Date(s.started_at).getTime()) / 1000),
  );
}

function formatHM(seconds: number): string {
  const total = Math.floor(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TodayPage() {
  const { from, to } = useMemo(() => dayWindowISO(new Date()), []);
  const { data, isLoading, error } = useSlices({ from, to, limit: 200 });
  const { data: openFrictions } = useOpenFrictions();
  const [frictionOpen, setFrictionOpen] = useState(false);

  // Global hotkey `f` to record a friction (ignored while typing).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFrictionOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const slices = data?.data ?? [];
  // Growth time is craft only; off segments (break/meeting) are excluded (ADR 005).
  const workSlices = slices.filter((s) => s.type === "work");
  const now = Date.now();
  const totalSec = workSlices.reduce(
    (acc, s) => acc + sliceDurationSec(s, now),
    0,
  );

  const modeSlices = useMemo(() => {
    if (totalSec === 0) return [];
    const byMode = new Map<SliceMode, number>();
    for (const s of workSlices) {
      if (!s.mode) continue;
      const mode = s.mode as SliceMode;
      byMode.set(mode, (byMode.get(mode) ?? 0) + sliceDurationSec(s, now));
    }
    return Array.from(byMode.entries()).map(([mode, secs]) => {
      const meta = SLICE_MODE_META[mode];
      return {
        mode,
        label: meta?.label ?? mode,
        modeKey: meta?.key ?? "?",
        pct: Math.round((secs / totalSec) * 100),
      };
    });
  }, [workSlices, totalSec, now]);

  const openCount = openFrictions?.data.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <ActiveSliceCard />

      <section>
        <Divider label="start a slice" />
        <div className="mt-5">
          <ModeSelector />
        </div>
      </section>

      <section>
        <Divider label="today / modes" />
        <div className="mt-5">
          {isLoading && <p className="text-sm text-mist">loading…</p>}
          {error && (
            <p className="text-sm text-danger">
              error: {(error as Error).message}
            </p>
          )}
          {!isLoading && !error && modeSlices.length === 0 && (
            <p className="font-mono text-xs uppercase tracking-instrument text-mist">
              no work segments today yet
            </p>
          )}
          {modeSlices.length > 0 && <ModeBar slices={modeSlices} />}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatTile label="focus" value={formatHM(totalSec)} hint="today" />
        <StatTile label="segments" value={workSlices.length} hint="today" />
        <StatTile label="frictions" value={openCount} hint="open" />
      </section>

      <section>
        <Divider label="friction log" />
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-instrument text-mist">
            press{" "}
            <kbd className="rounded border border-instrument/40 px-1">f</kbd> to
            record
          </p>
          <button
            type="button"
            onClick={() => setFrictionOpen(true)}
            className="rounded border border-instrument/40 bg-surface px-3 py-1 text-sm text-parchment hover:border-instrument"
          >
            + friction
          </button>
        </div>
        <div className="mt-3">
          <FrictionLog limit={20} />
        </div>
      </section>

      <FrictionModal
        open={frictionOpen}
        onClose={() => setFrictionOpen(false)}
      />
    </div>
  );
}
