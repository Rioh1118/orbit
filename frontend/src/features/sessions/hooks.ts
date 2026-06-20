import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, type ListSessionsQuery } from "@/api/sessions";
import type { EndSessionInput, StartSessionInput } from "./types";

const ACTIVE_KEY = ["work-sessions", "active"] as const;
const LIST_KEY = ["work-sessions", "list"] as const;

export function useActiveSessions() {
  return useQuery({
    queryKey: ACTIVE_KEY,
    queryFn: () => sessionsApi.active(),
    refetchInterval: 30_000,
  });
}

export function useSessions(q: ListSessionsQuery = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, q],
    queryFn: () => sessionsApi.list(q),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["work-sessions"] });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartSessionInput) => sessionsApi.start(input),
    onSuccess: () => invalidate(qc),
  });
}

export function useEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: EndSessionInput }) =>
      sessionsApi.end(id, input ?? {}),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
}
