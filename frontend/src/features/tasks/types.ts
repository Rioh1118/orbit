export type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  description: string;
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
  status?: TaskStatus;
  external_ref?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  external_ref?: string;
}
