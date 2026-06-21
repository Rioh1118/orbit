import type { Task, TaskCategory, TaskStatus } from "./types";

/**
 * URL-backed task filters (brief §7.12.5). Pure functions so the URL <-> filter
 * mapping and the row filtering are unit-testable without React or a router.
 */

export type StatusFilter = "all" | TaskStatus;
export type CategoryFilter = "all" | TaskCategory;

export interface TaskFilter {
  status: StatusFilter;
  category: CategoryFilter;
}

export const DEFAULT_TASK_FILTER: TaskFilter = { status: "all", category: "all" };

const STATUS_VALUES: readonly TaskStatus[] = [
  "open",
  "in_progress",
  "blocked",
  "done",
  "archived",
];

const CATEGORY_VALUES: readonly TaskCategory[] = [
  "new_feature",
  "bug_fix",
  "refactor",
  "investigation",
  "support",
  "other",
];

function isStatusFilter(v: string | null): v is StatusFilter {
  return v === "all" || (v !== null && (STATUS_VALUES as readonly string[]).includes(v));
}

function isCategoryFilter(v: string | null): v is CategoryFilter {
  return v === "all" || (v !== null && (CATEGORY_VALUES as readonly string[]).includes(v));
}

/** Read a filter from URL query params; unknown values fall back to "all". */
export function parseTaskFilter(params: URLSearchParams): TaskFilter {
  const status = params.get("status");
  const category = params.get("category");
  return {
    status: isStatusFilter(status) ? status : "all",
    category: isCategoryFilter(category) ? category : "all",
  };
}

/** Serialize a filter to URL params, omitting defaults to keep the URL clean. */
export function taskFilterToParams(filter: TaskFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.status !== "all") params.set("status", filter.status);
  if (filter.category !== "all") params.set("category", filter.category);
  return params;
}

/**
 * Apply a filter to a task list. `status: "all"` means "all active" and hides
 * archived tasks — archive is an explicit view you opt into. This keeps the
 * default view free of filed-away noise while ensuring one-click promotion
 * (open -> in_progress -> done) never makes the operated row vanish (brief §7.12.5).
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter((t) => {
    const statusOk =
      filter.status === "all" ? t.status !== "archived" : t.status === filter.status;
    const categoryOk = filter.category === "all" || t.category === filter.category;
    return statusOk && categoryOk;
  });
}
