import { useEffect, useState } from "react";
import { KeyCap } from "@/components/ui/KeyCap";
import { useTasks } from "@/features/tasks/hooks";
import { useStartSlice } from "./hooks";
import { SLICE_MODES, SLICE_MODE_BY_KEY, type SliceMode } from "./types";

interface Props {
  disabled?: boolean;
}

export function ModeSelector({ disabled }: Props) {
  const start = useStartSlice();
  const { data: tasksResp } = useTasks();
  const [taskId, setTaskId] = useState<string>("");

  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const mode = SLICE_MODE_BY_KEY[e.key.toLowerCase()];
      if (!mode) return;
      e.preventDefault();
      void start.mutateAsync({ mode, task_id: taskId || null });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, start, taskId]);

  const startMode = (mode: SliceMode) => start.mutate({ mode, task_id: taskId || null });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="slice-task" className="font-mono text-xs uppercase tracking-instrument text-mist">
          task
        </label>
        <select
          id="slice-task"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="rounded border border-instrument/40 bg-surface px-2 py-1 text-sm text-parchment"
        >
          <option value="">— none —</option>
          {tasksResp?.data.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.category}] {t.title}
            </option>
          ))}
        </select>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {SLICE_MODES.map((m) => (
          <li key={m.value}>
            <button
              type="button"
              onClick={() => startMode(m.value)}
              disabled={disabled || start.isPending}
              className="flex w-full items-center gap-2 rounded border border-instrument/40 bg-surface px-3 py-2 text-left text-sm text-parchment hover:border-instrument disabled:opacity-50"
              aria-label={`start ${m.label}`}
            >
              <KeyCap k={m.key} size="sm" />
              <span className="font-mono text-xs uppercase tracking-instrument text-mist">
                {m.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {start.error && (
        <p className="text-xs text-danger">{(start.error as Error).message}</p>
      )}
    </div>
  );
}
