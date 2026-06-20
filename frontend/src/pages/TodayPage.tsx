import { useEffect, useMemo, useState } from "react";
import { ModeBar } from "@/components/orbit/ModeBar";
import { StatTile } from "@/components/orbit/StatTile";
import { Divider } from "@/components/ui/Divider";
import { ErrorText } from "@/components/ui/ErrorText";
import { KeyCap } from "@/components/ui/KeyCap";
import { useNow } from "@/lib/useNow";
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
  // Construct fresh dates (no mutation — review L6 / immutability rule). y/m/d+1 keeps the
  // window correct across DST.
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const start = new Date(y, m, d);
  const end = new Date(y, m, d + 1);
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
  const now = useNow();

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

  // Single memo over the query result + clock tick (review M4: stable deps).
  const { workCount, totalSec, modeSlices } = useMemo(() => {
    const slices = data?.data ?? [];
    // Growth time is craft only; off segments (break/meeting) are excluded (ADR 005).
    const work = slices.filter((s) => s.type === "work");
    const total = work.reduce((acc, s) => acc + sliceDurationSec(s, now), 0);
    if (total === 0)
      return { workCount: work.length, totalSec: 0, modeSlices: [] };
    const byMode = new Map<SliceMode, number>();
    for (const s of work) {
      if (!s.mode) continue;
      const mode = s.mode as SliceMode;
      byMode.set(mode, (byMode.get(mode) ?? 0) + sliceDurationSec(s, now));
    }
    const bars = Array.from(byMode.entries()).map(([mode, secs]) => {
      const meta = SLICE_MODE_META[mode];
      return {
        mode,
        label: meta?.label ?? mode,
        modeKey: meta?.key ?? "?",
        pct: Math.round((secs / total) * 100),
      };
    });
    return { workCount: work.length, totalSec: total, modeSlices: bars };
  }, [data, now]);

  const openCount = openFrictions?.data.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <ActiveSliceCard />

      <section>
        <Divider label="計測を開始" />
        <div className="mt-5">
          <ModeSelector />
        </div>
      </section>

      <section>
        <Divider label="本日 / モード" />
        <div className="mt-5">
          {isLoading && <p className="text-sm text-mist">読み込み中…</p>}
          {error && <ErrorText>{(error as Error).message}</ErrorText>}
          {!isLoading && !error && modeSlices.length === 0 && (
            <p className="text-sm text-mist">本日の作業区間はまだありません</p>
          )}
          {modeSlices.length > 0 && <ModeBar slices={modeSlices} />}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="計測時間" value={formatHM(totalSec)} hint="本日" />
        <StatTile label="区間" value={workCount} hint="本日" />
        <StatTile label="詰まり" value={openCount} hint="未解決" />
      </section>

      <section>
        <Divider label="詰まりログ" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-mist">
            <KeyCap k="f" size="sm" /> キーで記録
          </p>
          <button
            type="button"
            onClick={() => setFrictionOpen(true)}
            className="rounded-md border border-instrument/40 bg-surface px-3 py-1 text-sm text-parchment transition-colors hover:border-instrument"
          >
            + 詰まり
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
