import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { frictionsApi, type ListFrictionsQuery } from "@/api/frictions";
import type { CreateFrictionInput, UpdateFrictionInput } from "./types";

const FRICTIONS_KEY = ["frictions"] as const;

export function useFrictions(q: ListFrictionsQuery = {}) {
  return useQuery({
    queryKey: [...FRICTIONS_KEY, q],
    queryFn: () => frictionsApi.list(q),
  });
}

export function useOpenFrictions() {
  return useFrictions({ resolved: false, limit: 50 });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: FRICTIONS_KEY });
}

export function useCreateFriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFrictionInput) => frictionsApi.create(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateFriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFrictionInput }) =>
      frictionsApi.update(id, input),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteFriction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => frictionsApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
