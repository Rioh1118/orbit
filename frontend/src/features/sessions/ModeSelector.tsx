import { useEffect, useState } from "react";
import { KeyCap } from "@/components/ui/KeyCap";
import { useTasks } from "@/features/tasks/hooks";
import { useStartSession } from "./hooks";
import { SESSION_MODES, SESSION_MODE_BY_KEY, type SessionMode } from "./types";

interface Props {
  disabled?: boolean;
}

export function ModeSelector({ disabled }: Props) {
  const start = useStartSession();
  const { data: tasksResp } = useTasks();
  const [taskId, setTaskId] = useState<string>("");

  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const mode = SESSION_MODE_BY_KEY[e.key.toLowerCase()];
      if (!mode) return;
      e.preventDefault();
      void start.mutateAsync({ mode, task_id: taskId || null });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, start, taskId]);

  const startMode = (mode: SessionMode) => start.mutate({ mode, task_id: taskId || null });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="session-task" className="font-mono text-xs uppercase tracking-instrument text-mist">
          task
        </label>
        <select
          id="session-task"
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
        {SESSION_MODES.map((m) => (
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
