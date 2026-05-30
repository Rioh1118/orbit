export type SessionMode =
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

export interface SessionModeMeta {
  value: SessionMode;
  label: string;
  key: string;
}

export const SESSION_MODES: ReadonlyArray<SessionModeMeta> = [
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

export const SESSION_MODE_BY_KEY: Record<string, SessionMode> = SESSION_MODES.reduce(
  (acc, m) => {
    acc[m.key.toLowerCase()] = m.value;
    return acc;
  },
  {} as Record<string, SessionMode>,
);

export const SESSION_MODE_META: Record<SessionMode, SessionModeMeta> = SESSION_MODES.reduce(
  (acc, m) => {
    acc[m.value] = m;
    return acc;
  },
  {} as Record<SessionMode, SessionModeMeta>,
);

export interface WorkSession {
  id: string;
  task_id: string | null;
  mode: SessionMode;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  density: number | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface StartSessionInput {
  mode: SessionMode;
  task_id?: string | null;
  note?: string;
}

export interface EndSessionInput {
  density?: number;
}
