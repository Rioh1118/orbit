import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { slicesApi, type ListSlicesQuery } from "@/api/slices";
import type { EndSliceInput, StartSliceInput } from "./types";

const ACTIVE_KEY = ["work-slices", "active"] as const;
const LIST_KEY = ["work-slices", "list"] as const;

export function useActiveSlices() {
  return useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: () => slicesApi.active(),
    refetchInterval: 30_000,
  });
}

export function useSlices(q: ListSlicesQuery = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, q],
    queryFn: () => slicesApi.list(q),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["work-slices"] });
}

export function useStartSlice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartSliceInput) => slicesApi.start(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useEndSlice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: EndSliceInput }) =>
      slicesApi.end(id, input ?? {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteSlice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slicesApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
