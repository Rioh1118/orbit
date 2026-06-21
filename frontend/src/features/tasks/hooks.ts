import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/api/tasks";
import type { CreateTaskInput, UpdateTaskInput } from "./types";

const TASKS_KEY = ["tasks"] as const;

type TaskListResult = Awaited<ReturnType<typeof tasksApi.list>>;
interface UpdateVars {
  id: string;
  input: UpdateTaskInput;
}
interface RollbackContext {
  previous?: TaskListResult;
}

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => tasksApi.list(),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, UpdateVars, RollbackContext>({
    mutationFn: ({ id, input }: UpdateVars) => tasksApi.update(id, input),
    // Optimistic in-place update: the status badge flips instantly ("触ると返事する",
    // brief §6) and, since the default filter is "all", the operated row never
    // vanishes mid-promote (brief §7.12.5). Rollback on error, then reconcile.
    onMutate: async ({ id, input }): Promise<RollbackContext> => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const previous = qc.getQueryData<TaskListResult>(TASKS_KEY);
      if (previous) {
        qc.setQueryData<TaskListResult>(TASKS_KEY, {
          ...previous,
          data: previous.data.map((t) => (t.id === id ? { ...t, ...input } : t)),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(TASKS_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation<void, Error, string, RollbackContext>({
    mutationFn: (id: string) => tasksApi.remove(id),
    onMutate: async (id): Promise<RollbackContext> => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const previous = qc.getQueryData<TaskListResult>(TASKS_KEY);
      if (previous) {
        qc.setQueryData<TaskListResult>(TASKS_KEY, {
          ...previous,
          data: previous.data.filter((t) => t.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(TASKS_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
