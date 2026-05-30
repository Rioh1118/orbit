export type SliceMode =
  | "spec_read"
  | "task_breakdown"
  | "code_explore"
  | "design"
  | "implement"
  | "verify"
  | "debug"
  | "ai_review"
  | "human_review"
  | "consult"
  | "other";

export interface SliceModeMeta {
  value: SliceMode;
  label: string;
  key: string;
}

export const SLICE_MODES: ReadonlyArray<SliceModeMeta> = [
  { value: "spec_read", label: "spec read", key: "S" },
  { value: "task_breakdown", label: "breakdown", key: "B" },
  { value: "code_explore", label: "code explore", key: "E" },
  { value: "design", label: "design", key: "G" },
  { value: "implement", label: "implement", key: "I" },
  { value: "verify", label: "verify", key: "V" },
  { value: "debug", label: "debug", key: "D" },
  { value: "ai_review", label: "ai review", key: "A" },
  { value: "human_review", label: "human review", key: "R" },
  { value: "consult", label: "consult", key: "C" },
  { value: "other", label: "other", key: "O" },
];

export const SLICE_MODE_BY_KEY: Record<string, SliceMode> = SLICE_MODES.reduce(
  (acc, m) => {
    acc[m.key.toLowerCase()] = m.value;
    return acc;
  },
  {} as Record<string, SliceMode>,
);

export const SLICE_MODE_META: Record<SliceMode, SliceModeMeta> = SLICE_MODES.reduce(
  (acc, m) => {
    acc[m.value] = m;
    return acc;
  },
  {} as Record<SliceMode, SliceModeMeta>,
);

export interface WorkSlice {
  id: string;
  task_id: string | null;
  mode: SliceMode;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  density: number | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface StartSliceInput {
  mode: SliceMode;
  task_id?: string | null;
  note?: string;
}

export interface EndSliceInput {
  density?: number;
}
