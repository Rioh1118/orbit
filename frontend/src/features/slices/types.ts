export type SliceMode =
  | "spec_read"
  | "task_breakdown"
  | "study"
  | "code_explore"
  | "design"
  | "implement"
  | "review"
  | "verify"
  | "debug"
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
  { value: "study", label: "study", key: "Y" },
  { value: "code_explore", label: "code explore", key: "E" },
  { value: "design", label: "design", key: "G" },
  { value: "implement", label: "implement", key: "I" },
  { value: "review", label: "review", key: "R" },
  { value: "verify", label: "verify", key: "V" },
  { value: "debug", label: "debug", key: "D" },
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

export const SLICE_MODE_META: Record<SliceMode, SliceModeMeta> =
  SLICE_MODES.reduce(
    (acc, m) => {
      acc[m.value] = m;
      return acc;
    },
    {} as Record<SliceMode, SliceModeMeta>,
  );

export type SliceDriver = "solo" | "ai" | "human";

export const SLICE_DRIVERS: ReadonlyArray<{
  value: SliceDriver;
  label: string;
}> = [
  { value: "solo", label: "solo" },
  { value: "ai", label: "ai" },
  { value: "human", label: "human" },
];

export type SliceType = "work" | "off";

export type OffReason = "break" | "meeting" | "other";

export const OFF_REASONS: ReadonlyArray<{ value: OffReason; label: string }> = [
  { value: "break", label: "休憩" },
  { value: "meeting", label: "会議" },
  { value: "other", label: "その他" },
];

export interface WorkSlice {
  id: string;
  task_id: string | null;
  type: SliceType;
  mode: SliceMode | "";
  driver: SliceDriver | "";
  off_reason: OffReason | "";
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface StartSliceInput {
  mode: SliceMode;
  driver?: SliceDriver;
  task_id?: string | null;
  note?: string;
}

export interface StartOffInput {
  reason: OffReason;
  note?: string;
}
