import { request, requestList, requestNoBody } from "./client";
import type {
  CreateFrictionInput,
  Friction,
  UpdateFrictionInput,
} from "@/features/frictions/types";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params: QueryParams): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export interface ListFrictionsQuery {
  task_id?: string;
  work_session_id?: string;
  pattern_tag?: string;
  resolved?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const frictionsApi = {
  list: (q: ListFrictionsQuery = {}) =>
    requestList<Friction>(`/v1/frictions${buildQuery({ ...q })}`),
  create: (input: CreateFrictionInput) =>
    request<Friction>("/v1/frictions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateFrictionInput) =>
    request<Friction>(`/v1/frictions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) => requestNoBody(`/v1/frictions/${id}`, { method: "DELETE" }),
};
