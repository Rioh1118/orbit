import { useEffect, useMemo, useState } from "react";
import { ModeBar } from "@/components/orbit/ModeBar";
import { StatTile } from "@/components/orbit/StatTile";
import { Divider } from "@/components/ui/Divider";
import { ActiveSessionCard } from "@/features/sessions/ActiveSessionCard";
import { ModeSelector } from "@/features/sessions/ModeSelector";
import { useSessions } from "@/features/sessions/hooks";
import {
  SESSION_MODE_META,
  type SessionMode,
  type WorkSession,
} from "@/features/sessions/types";
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

function sessionDurationSec(s: WorkSession, now: number): number {
  if (s.duration_sec != null) return s.duration_sec;
  if (s.ended_at) {
    return Math.max(
      0,
      Math.floor(
        (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000,
      ),
    );
  }
  return Math.max(0, Math.floor((now - new Date(s.started_at).getTime()) / 1000));
}

function formatHM(seconds: number): string {
  const total = Math.floor(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TodayPage() {
  const { from, to } = useMemo(() => dayWindowISO(new Date()), []);
  const { data, isLoading, error } = useSessions({ from, to, limit: 200 });
  const { data: openFrictions } = useOpenFrictions();
  const [frictionOpen, setFrictionOpen] = useState(false);

  // Global hotkey `f` to record a friction (ignored while typing).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFrictionOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sessions = data?.data ?? [];
  const now = Date.now();
  const totalSec = sessions.reduce((acc, s) => acc + sessionDurationSec(s, now), 0);

  const modeSessions = useMemo(() => {
    if (totalSec === 0) return [];
    const byMode = new Map<SessionMode, number>();
    for (const s of sessions) {
      byMode.set(s.mode, (byMode.get(s.mode) ?? 0) + sessionDurationSec(s, now));
    }
    return Array.from(byMode.entries()).map(([mode, secs]) => {
      const meta = SESSION_MODE_META[mode];
      return {
        mode,
        label: meta?.label ?? mode,
        modeKey: meta?.key ?? "?",
        pct: Math.round((secs / totalSec) * 100),
      };
    });
  }, [sessions, totalSec, now]);

  const openCount = openFrictions?.data.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <ActiveSessionCard />

      <section>
        <Divider label="start a session" />
        <div className="mt-5">
          <ModeSelector />
        </div>
      </section>

      <section>
        <Divider label="today / modes" />
        <div className="mt-5">
          {isLoading && <p className="text-sm text-mist">loading…</p>}
          {error && (
            <p className="text-sm text-danger">error: {(error as Error).message}</p>
          )}
          {!isLoading && !error && modeSessions.length === 0 && (
            <p className="font-mono text-xs uppercase tracking-instrument text-mist">
              no sessions today yet
            </p>
          )}
          {modeSessions.length > 0 && <ModeBar sessions={modeSessions} />}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatTile label="focus" value={formatHM(totalSec)} hint="today" />
        <StatTile label="sessions" value={sessions.length} hint="today" />
        <StatTile label="frictions" value={openCount} hint="open" />
      </section>

      <section>
        <Divider label="friction log" />
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-instrument text-mist">
            press <kbd className="rounded border border-instrument/40 px-1">f</kbd> to record
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

      <FrictionModal open={frictionOpen} onClose={() => setFrictionOpen(false)} />
    </div>
  );
}
