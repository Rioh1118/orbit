import { useEffect, useState } from "react";
import { ActiveSliceBanner } from "@/components/orbit/ActiveSliceBanner";
import { useTasks } from "@/features/tasks/hooks";
import { useCurrentSlice, useEndSlice, useStartOff } from "./hooks";
import { OFF_REASONS, SLICE_MODE_META } from "./types";

function elapsedMinutes(startedAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
}

export function ActiveSliceCard() {
  const { data: current, isLoading } = useCurrentSlice();
  const { data: tasksResp } = useTasks();
  const end = useEndSlice();
  const startOff = useStartOff();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (isLoading)
    return <p className="text-sm text-mist">loading current segment…</p>;

  if (!current) {
    return (
      <p className="font-mono text-xs uppercase tracking-instrument text-mist">
        not working — pick a mode below to start
      </p>
    );
  }

  // Off segment (break/meeting): show plainly with a single end action.
  if (current.type === "off") {
    const reasonLabel =
      OFF_REASONS.find((r) => r.value === current.off_reason)?.label ??
      current.off_reason;
    return (
      <div className="flex items-center justify-between rounded border border-instrument/30 bg-surface px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-instrument text-mist">
          計測対象外 · {reasonLabel} · {elapsedMinutes(current.started_at, now)}
          m
        </span>
        <button
          type="button"
          onClick={() => end.mutate(current.id)}
          className="rounded border border-instrument/40 bg-canvas px-3 py-1 text-sm text-parchment hover:border-instrument"
        >
          end
        </button>
      </div>
    );
  }

  const meta = current.mode ? SLICE_MODE_META[current.mode] : undefined;
  const taskTitle = current.task_id
    ? (tasksResp?.data.find((t) => t.id === current.task_id)?.title ?? "—")
    : "(no task)";

  return (
    <div className="space-y-3">
      <ActiveSliceBanner
        taskTitle={taskTitle}
        mode={`${current.mode} · ${current.driver}`}
        modeKey={meta?.key ?? "?"}
        elapsedMinutes={elapsedMinutes(current.started_at, now)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => end.mutate(current.id)}
          className="rounded border border-instrument/40 bg-surface px-3 py-1.5 text-sm text-parchment hover:border-instrument"
        >
          end segment
        </button>
        <button
          type="button"
          onClick={() => startOff.mutate({ reason: "break" })}
          className="font-mono text-xs uppercase tracking-instrument text-mist hover:text-parchment"
        >
          休憩
        </button>
      </div>
      {end.error && (
        <p className="text-xs text-danger">{(end.error as Error).message}</p>
      )}
    </div>
  );
}
