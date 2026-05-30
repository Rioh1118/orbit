import { useDeleteTask, useTasks, useUpdateTask } from "./hooks";
import type { TaskStatus } from "./types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "未着手",
  in_progress: "進行中",
  blocked: "ブロック",
  done: "完了",
  archived: "アーカイブ",
};

export function TaskList() {
  const { data, isLoading, error } = useTasks();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  if (isLoading) return <p className="text-sm text-neutral-400">読み込み中...</p>;
  if (error) return <p className="text-sm text-red-400">エラー: {(error as Error).message}</p>;
  if (!data || data.data.length === 0)
    return <p className="text-sm text-neutral-400">タスクがありません。新規作成してください。</p>;

  return (
    <ul className="divide-y divide-neutral-800">
      {data.data.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-medium ${t.status === "done" ? "text-neutral-500 line-through" : ""}`}
            >
              {t.title}
            </p>
            {t.description && (
              <p className="truncate text-xs text-neutral-500">{t.description}</p>
            )}
          </div>
          <select
            value={t.status}
            onChange={(e) =>
              update.mutate({ id: t.id, input: { status: e.target.value as TaskStatus } })
            }
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
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
            className="text-xs text-neutral-500 hover:text-red-400"
            aria-label="削除"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
