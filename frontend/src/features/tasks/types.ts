export type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "archived";

export type TaskCategory =
  | "learning"
  | "new_feature"
  | "bug_fix"
  | "refactor"
  | "investigation"
  | "support"
  | "other";

export const TASK_CATEGORIES: ReadonlyArray<{ value: TaskCategory; label: string }> = [
  { value: "learning", label: "学習 (Learning)" },
  { value: "new_feature", label: "新規機能 (New feature)" },
  { value: "bug_fix", label: "バグ修正 (Bug fix)" },
  { value: "refactor", label: "リファクタ (Refactor)" },
  { value: "investigation", label: "調査 (Investigation)" },
  { value: "support", label: "サポート (Support)" },
  { value: "other", label: "その他 (Other)" },
];

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  external_ref: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  status?: TaskStatus;
  external_ref?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  external_ref?: string;
}
