import { request, requestList, requestNoBody } from "./client";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/features/tasks/types";

export const tasksApi = {
  list: () => requestList<Task>("/v1/tasks"),
  get: (id: string) => request<Task>(`/v1/tasks/${id}`),
  create: (input: CreateTaskInput) =>
    request<Task>("/v1/tasks", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateTaskInput) =>
    request<Task>(`/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => requestNoBody(`/v1/tasks/${id}`, { method: "DELETE" }),
};
