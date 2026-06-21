import { Badge } from "@/components/ui/Badge";
import { ErrorText } from "@/components/ui/ErrorText";
import { useDeleteTask, useTasks, useUpdateTask } from "./hooks";
import { TASK_CATEGORIES, type TaskCategory, type TaskStatus } from "./types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "未着手",
  in_progress: "進行中",
  blocked: "ブロック",
  done: "完了",
  archived: "アーカイブ",
};

const CATEGORY_LABEL: Record<TaskCategory, string> = TASK_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.value] = c.label;
    return acc;
  },
  {} as Record<TaskCategory, string>,
);

const selectClass =
  "rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-primary";

export function TaskList() {
  const { data, isLoading, error } = useTasks();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  if (isLoading) return <p className="text-sm text-ink-muted">読み込み中...</p>;
  if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
  if (!data || data.data.length === 0)
    return (
      <p className="text-sm text-ink-muted">
        タスクがありません。新規作成してください。
      </p>
    );

  return (
    <ul className="divide-y divide-border">
      {data.data.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium ${t.status === "done" ? "text-ink-muted line-through" : "text-ink"}`}
            >
              {t.title}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
              <Badge tone="neutral">
                {CATEGORY_LABEL[t.category] ?? t.category}
              </Badge>
              {t.description && <span className="truncate">{t.description}</span>}
            </div>
          </div>
          <select
            value={t.category}
            onChange={(e) =>
              update.mutate({
                id: t.id,
                input: { category: e.target.value as TaskCategory },
              })
            }
            className={selectClass}
            aria-label="カテゴリ変更"
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={t.status}
            onChange={(e) =>
              update.mutate({ id: t.id, input: { status: e.target.value as TaskStatus } })
            }
            className={selectClass}
            aria-label="ステータス変更"
          >
            {(Object.entries(STATUS_LABEL) as [TaskStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove.mutate(t.id)}
            className="text-xs text-ink-muted transition-colors hover:text-danger"
            aria-label="削除"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
