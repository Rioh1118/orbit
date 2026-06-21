import type { CategoryFilter, StatusFilter, TaskFilter } from "./filters";
import { STATUS_META } from "./taskState";
import { TASK_CATEGORIES } from "./types";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "open", label: STATUS_META.open.label },
  { value: "in_progress", label: STATUS_META.in_progress.label },
  { value: "blocked", label: STATUS_META.blocked.label },
  { value: "done", label: STATUS_META.done.label },
  { value: "archived", label: STATUS_META.archived.label },
];

interface FilterBarProps {
  filter: TaskFilter;
  onStatusChange: (status: StatusFilter) => void;
  onCategoryChange: (category: CategoryFilter) => void;
}

/**
 * Status + category filter bar (brief §7.12.5). Status is a group of toggle buttons
 * (aria-pressed conveys the active filter); category is a select with a visible
 * label. The chosen filter is mirrored to the URL by the parent's useTaskFilters hook.
 */
export function FilterBar({ filter, onStatusChange, onCategoryChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="ステータスで絞り込み" className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => {
          const active = filter.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusChange(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-primary/10 font-medium text-ink"
                  : "text-ink-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <label htmlFor="task-category-filter" className="flex items-center gap-2 text-sm text-ink-muted">
        カテゴリ
        <select
          id="task-category-filter"
          value={filter.category}
          onChange={(e) => onCategoryChange(e.target.value as CategoryFilter)}
          className="rounded-md border border-border-strong bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="all">すべて</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
