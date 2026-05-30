export type FrictionPatternTag =
  | "cant_find"
  | "unexpected_state"
  | "type_mismatch"
  | "api_contract"
  | "env_setup"
  | "flaky_test"
  | "unclear_spec"
  | "waiting_human"
  | "tool_quirk"
  | "concept_gap";

export interface PatternTagMeta {
  value: FrictionPatternTag;
  label: string;
  /** 1-key digit used for quick selection in the friction modal. */
  key: string;
}

// Order chosen so that the first 9 map to digit keys 1-9 and `concept_gap` → 0.
export const PATTERN_TAGS: ReadonlyArray<PatternTagMeta> = [
  { value: "cant_find", label: "cant_find", key: "1" },
  { value: "unexpected_state", label: "unexpected_state", key: "2" },
  { value: "type_mismatch", label: "type_mismatch", key: "3" },
  { value: "api_contract", label: "api_contract", key: "4" },
  { value: "env_setup", label: "env_setup", key: "5" },
  { value: "flaky_test", label: "flaky_test", key: "6" },
  { value: "unclear_spec", label: "unclear_spec", key: "7" },
  { value: "waiting_human", label: "waiting_human", key: "8" },
  { value: "tool_quirk", label: "tool_quirk", key: "9" },
  { value: "concept_gap", label: "concept_gap", key: "0" },
];

export const PATTERN_TAG_BY_KEY: Record<string, FrictionPatternTag> = PATTERN_TAGS.reduce(
  (acc, m) => {
    acc[m.key] = m.value;
    return acc;
  },
  {} as Record<string, FrictionPatternTag>,
);

export interface Friction {
  id: string;
  task_id: string | null;
  work_session_id: string | null;
  pattern_tag: FrictionPatternTag;
  severity: number;
  description: string;
  resolved_at: string | null;
  resolution_note: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFrictionInput {
  task_id?: string | null;
  work_session_id?: string | null;
  pattern_tag: FrictionPatternTag;
  severity?: number;
  description: string;
}

export interface UpdateFrictionInput {
  task_id?: string | null;
  work_session_id?: string | null;
  pattern_tag?: FrictionPatternTag;
  severity?: number;
  description?: string;
  resolution_note?: string;
  resolved?: boolean;
}
