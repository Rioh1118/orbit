import { Menu } from "@/components/ui/Menu";
import { CategoryMenu } from "./CategoryMenu";
import { StatusBadge } from "./StatusBadge";
import { getRowActions, type RowAction } from "./taskState";
import type { Task, TaskCategory, TaskStatus } from "./types";

interface TaskRowProps {
  task: Task;
  onPromote: (to: TaskStatus) => void;
  onCategoryChange: (category: TaskCategory) => void;
  onRowAction: (action: RowAction) => void;
}

/**
 * One task row (brief §7.12.1): status badge + title + category badge + ⋯ menu.
 * done is struck through and muted; archived is dimmed (brief §7.12.7).
 */
export function TaskRow({ task, onPromote, onCategoryChange, onRowAction }: TaskRowProps) {
  const done = task.status === "done";
  const archived = task.status === "archived";

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas ${
        archived ? "opacity-60" : ""
      }`}
    >
      <StatusBadge status={task.status} onPromote={onPromote} />
      <p
        className={`min-w-0 flex-1 truncate text-base ${
          done ? "text-ink-muted line-through" : "text-ink"
        }`}
      >
        {task.title}
      </p>
      <CategoryMenu category={task.category} onChange={onCategoryChange} />
      <Menu
        label={`「${task.title}」の操作`}
        triggerClassName="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
        items={getRowActions(task.status).map((a) => ({
          id: a.id,
          label: a.label,
          destructive: a.destructive,
          onSelect: () => onRowAction(a),
        }))}
      >
        <span aria-hidden>⋯</span>
      </Menu>
    </li>
  );
}
