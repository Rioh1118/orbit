import { useEffect, useState } from "react";
import { ActiveSliceBanner } from "@/components/orbit/ActiveSliceBanner";
import { KeyCap } from "@/components/ui/KeyCap";
import { useTasks } from "@/features/tasks/hooks";
import { useActiveSlices, useEndSlice } from "./hooks";
import { SLICE_MODE_META, type WorkSlice } from "./types";

const DENSITIES = [1, 2, 3, 4, 5] as const;

interface DensityPickerProps {
  onPick: (d: number) => void;
  disabled?: boolean;
}

function DensityPicker({ onPick, disabled }: DensityPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-instrument text-mist">
        density
      </span>
      {DENSITIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onPick(d)}
          disabled={disabled}
          aria-label={`density ${d}`}
          className="rounded border border-instrument/40 bg-surface px-2 py-1 hover:border-instrument disabled:opacity-50"
        >
          <KeyCap k={String(d)} size="sm" />
        </button>
      ))}
    </div>
  );
}

function elapsedMinutes(startedAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
}

export function ActiveSliceCard() {
  const { data: actives, isLoading } = useActiveSlices();
  const { data: tasksResp } = useTasks();
  const end = useEndSlice();
  const [now, setNow] = useState(() => Date.now());
  const [pendingEndId, setPendingEndId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const slice: WorkSlice | undefined = actives?.[0];

  useEffect(() => {
    if (!pendingEndId) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "Escape") {
        setPendingEndId(null);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 5) {
        e.preventDefault();
        end.mutate(
          { id: pendingEndId, input: { density: n } },
          { onSettled: () => setPendingEndId(null) },
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pendingEndId, end]);

  if (isLoading) return <p className="text-sm text-mist">loading active slice…</p>;
  if (!slice) {
    return (
      <p className="font-mono text-xs uppercase tracking-instrument text-mist">
        no active slice — pick a mode below to start
      </p>
    );
  }

  const meta = SLICE_MODE_META[slice.mode];
  const taskTitle = slice.task_id
    ? (tasksResp?.data.find((t) => t.id === slice.task_id)?.title ?? "—")
    : "(no task)";

  return (
    <div className="space-y-3">
      <ActiveSliceBanner
        taskTitle={taskTitle}
        mode={slice.mode}
        modeKey={meta?.key ?? "?"}
        elapsedMinutes={elapsedMinutes(slice.started_at, now)}
      />
      {pendingEndId === slice.id ? (
        <DensityPicker
          disabled={end.isPending}
          onPick={(d) =>
            end.mutate(
              { id: slice.id, input: { density: d } },
              { onSettled: () => setPendingEndId(null) },
            )
          }
        />
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPendingEndId(slice.id)}
            className="rounded border border-instrument/40 bg-surface px-3 py-1.5 text-sm text-parchment hover:border-instrument"
          >
            end slice
          </button>
          <button
            type="button"
            onClick={() => end.mutate({ id: slice.id, input: {} })}
            className="font-mono text-xs uppercase tracking-instrument text-mist hover:text-parchment"
          >
            end without density
          </button>
        </div>
      )}
      {end.error && <p className="text-xs text-danger">{(end.error as Error).message}</p>}
    </div>
  );
}
