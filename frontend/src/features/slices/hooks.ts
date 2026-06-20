import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { slicesApi, type ListSlicesQuery } from "@/api/slices";
import type { StartOffInput, StartSliceInput } from "./types";

const ACTIVE_KEY = ["work-slices", "active"] as const;
const CURRENT_KEY = ["work-slices", "current"] as const;
const LIST_KEY = ["work-slices", "list"] as const;

export function useActiveSlices() {
  return useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: () => slicesApi.active(),
    refetchInterval: 30_000,
  });
}

// useCurrentSlice returns the single open segment, or null when not working.
export function useCurrentSlice() {
  return useQuery({
    queryKey: CURRENT_KEY,
    queryFn: () => slicesApi.current(),
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

export function useStartOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartOffInput) => slicesApi.startOff(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useEndSlice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slicesApi.end(id),
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
