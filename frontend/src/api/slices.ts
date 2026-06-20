import { request, requestList, requestNoBody } from "./client";
import type {
  StartOffInput,
  StartSliceInput,
  WorkSlice,
} from "@/features/slices/types";

type QueryParams = Record<string, string | number | undefined | null>;

function buildQuery(params: QueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  );
}

export interface ListSlicesQuery {
  task_id?: string;
  mode?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const slicesApi = {
  list: (q: ListSlicesQuery = {}) =>
    requestList<WorkSlice>(`/v1/work-slices${buildQuery({ ...q })}`),
  active: () => request<WorkSlice[]>("/v1/work-slices/active"),
  current: () => request<WorkSlice | null>("/v1/work-slices/current"),
  start: (input: StartSliceInput) =>
    request<WorkSlice>("/v1/work-slices/start", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  startOff: (input: StartOffInput) =>
    request<WorkSlice>("/v1/work-slices/start-off", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  stop: () =>
    request<WorkSlice | null>("/v1/work-slices/stop", { method: "POST" }),
  end: (id: string) =>
    request<WorkSlice>(`/v1/work-slices/${id}/end`, { method: "POST" }),
  remove: (id: string) =>
    requestNoBody(`/v1/work-slices/${id}`, { method: "DELETE" }),
};
