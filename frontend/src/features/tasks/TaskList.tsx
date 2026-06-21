import { useState } from "react";
import { ErrorText } from "@/components/ui/ErrorText";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { FilterBar } from "./FilterBar";
import { InlineTaskCreate } from "./InlineTaskCreate";
import { TaskRow } from "./TaskRow";
import { filterTasks } from "./filters";
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from "./hooks";
import type { RowAction } from "./taskState";
import { useTaskFilters } from "./useTaskFilters";
import type { Task, TaskCategory } from "./types";

interface EmptyStateProps {
  hasAnyTasks: boolean;
  onClearFilter: () => void;
}

function EmptyState({ hasAnyTasks, onClearFilter }: EmptyStateProps) {
  if (!hasAnyTasks) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-ink-muted">
        最初のタスクを作りましょう。下の入力欄から追加できます。
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-ink-muted">
      この条件のタスクはありません。{" "}
      <button
        type="button"
        onClick={onClearFilter}
        className="rounded text-primary underline underline-offset-2 hover:text-primary-hover"
      >
        フィルタをクリア
      </button>
    </p>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "不明なエラーが発生しました";
}

export function TaskList() {
  const { data, isLoading, error } = useTasks();
  const { filter, setStatus, setCategory, clear } = useTaskFilters();
  const update = useUpdateTask(); // row-level promote / category / menu transitions
  const editUpdate = useUpdateTask(); // edit dialog (separate so its errors stay in the dialog)
  const remove = useDeleteTask();
  const create = useCreateTask();

  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  // Category persists across creates: the last-used category is the next default.
  const [createCategory, setCreateCategory] = useState<TaskCategory>("new_feature");

  if (isLoading) return <p className="text-sm text-ink-muted">読み込み中...</p>;
  if (error) return <ErrorText>{errorMessage(error)}</ErrorText>;

  const allTasks = data?.data ?? [];
  const visible = filterTasks(allTasks, filter);

  function handleRowAction(task: Task, action: RowAction) {
    if (action.id === "edit") {
      setEditing(task);
    } else if (action.id === "delete") {
      setDeleting(task);
    } else if (action.toStatus) {
      update.mutate({ id: task.id, input: { status: action.toStatus } });
    }
  }

  return (
    <div className="space-y-4">
      <FilterBar filter={filter} onStatusChange={setStatus} onCategoryChange={setCategory} />

      {/* Optimistic row mutations roll back silently on failure; surface the reason. */}
      {update.error && <ErrorText>更新に失敗しました: {errorMessage(update.error)}</ErrorText>}
      {remove.error && <ErrorText>削除に失敗しました: {errorMessage(remove.error)}</ErrorText>}

      {visible.length === 0 ? (
        <EmptyState hasAnyTasks={allTasks.length > 0} onClearFilter={clear} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface [&>li:first-child]:rounded-t-lg [&>li:last-child]:rounded-b-lg">
          {visible.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onPromote={(to) => update.mutate({ id: t.id, input: { status: to } })}
              onCategoryChange={(category) => update.mutate({ id: t.id, input: { category } })}
              onRowAction={(action) => handleRowAction(t, action)}
            />
          ))}
        </ul>
      )}

      <InlineTaskCreate
        category={createCategory}
        onCategoryChange={setCreateCategory}
        isPending={create.isPending}
        createError={create.error ? errorMessage(create.error) : undefined}
        autoFocus={allTasks.length === 0}
        onCreate={async ({ title, category }) => {
          await create.mutateAsync({ title, category });
        }}
      />

      {editing && (
        <EditTaskDialog
          open
          task={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => editUpdate.mutateAsync({ id: editing.id, input }).then(() => undefined)}
        />
      )}
      {deleting && (
        <DeleteTaskDialog
          open
          taskTitle={deleting.title}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting.id)}
        />
      )}
    </div>
  );
}
