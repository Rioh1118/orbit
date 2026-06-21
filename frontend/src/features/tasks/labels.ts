import type { TaskCategory } from "./types";

/** Compact category labels for dense list rows and the category badge (brief §7.12.7). */
export const CATEGORY_SHORT_LABEL: Record<TaskCategory, string> = {
  new_feature: "新機能",
  bug_fix: "バグ",
  refactor: "リファクタ",
  investigation: "調査",
  support: "サポート",
  other: "その他",
};
