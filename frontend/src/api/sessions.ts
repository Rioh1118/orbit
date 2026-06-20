import { request, requestList, requestNoBody } from "./client";
import type {
  EndSessionInput,
  StartSessionInput,
  WorkSession,
} from "@/features/sessions/types";

type QueryParams = Record<string, string | number | undefined | null>;

function buildQuery(params: QueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export interface ListSessionsQuery {
  task_id?: string;
  mode?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const sessionsApi = {
  list: (q: ListSessionsQuery = {}) =>
    requestList<WorkSession>(`/v1/work-sessions${buildQuery({ ...q })}`),
  active: () => request<WorkSession[]>("/v1/work-sessions/active"),
  start: (input: StartSessionInput) =>
    request<WorkSession>("/v1/work-sessions/start", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  end: (id: string, input: EndSessionInput = {}) =>
    request<WorkSession>(`/v1/work-sessions/${id}/end`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => requestNoBody(`/v1/work-sessions/${id}`, { method: "DELETE" }),
};
