import { useEffect, useState } from "react";
import { KeyCap } from "@/components/ui/KeyCap";
import { ErrorText } from "@/components/ui/ErrorText";
import { useTasks } from "@/features/tasks/hooks";
import { useStartSlice } from "./hooks";
import {
  SLICE_DRIVERS,
  SLICE_MODES,
  SLICE_MODE_BY_KEY,
  type SliceDriver,
  type SliceMode,
} from "./types";

interface Props {
  disabled?: boolean;
}

export function ModeSelector({ disabled }: Props) {
  const start = useStartSlice();
  const { data: tasksResp } = useTasks();
  const [taskId, setTaskId] = useState<string>("");
  const [driver, setDriver] = useState<SliceDriver>("solo");

  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      const mode = SLICE_MODE_BY_KEY[e.key.toLowerCase()];
      if (!mode) return;
      e.preventDefault();
      void start.mutateAsync({ mode, driver, task_id: taskId || null });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, start, taskId, driver]);

  const startMode = (mode: SliceMode) =>
    start.mutate({ mode, driver, task_id: taskId || null });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="slice-task" className="text-xs font-medium text-mist">
            タスク
          </label>
          <select
            id="slice-task"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="rounded border border-instrument/40 bg-surface px-2 py-1 text-sm text-parchment"
          >
            <option value="">— なし —</option>
            {tasksResp?.data.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.category}] {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span id="driver-label" className="text-xs font-medium text-mist">
            ドライバー
          </span>
          {/* single-select → radiogroup/radio + aria-checked (review H2 / SC 4.1.2) */}
          <div
            role="radiogroup"
            aria-labelledby="driver-label"
            className="flex items-center gap-1"
          >
            {SLICE_DRIVERS.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={driver === d.value}
                onClick={() => setDriver(d.value)}
                className={`rounded border px-2 py-1 text-xs ${
                  driver === d.value
                    ? "border-instrument bg-elevated text-parchment"
                    : "border-instrument/30 bg-surface text-mist hover:text-parchment"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {SLICE_MODES.map((m) => (
          <li key={m.value}>
            <button
              type="button"
              onClick={() => startMode(m.value)}
              disabled={disabled || start.isPending}
              className="flex w-full items-center gap-2 rounded border border-instrument/40 bg-surface px-3 py-2 text-left text-sm text-parchment hover:border-instrument disabled:opacity-50"
              aria-label={`${m.label} を開始`}
            >
              <KeyCap k={m.key} size="sm" />
              <span className="text-xs text-mist">{m.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
    </div>
  );
}
