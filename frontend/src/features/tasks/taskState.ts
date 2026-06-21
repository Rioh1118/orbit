import type { TaskStatus } from "./types";

/**
 * Task UX state graph (brief §7.12.2). This module owns *which* transitions the UI
 * offers and *how* they are surfaced; the authoritative timestamp side effects live
 * in the Go backend (task.NextLifecycle), so the frontend only ever sends `status`.
 *
 * Two tiers of affordance, by destructiveness (review note, brief §7.12.2):
 *   - One-click badge promotion: the non-destructive forward path
 *     open -> in_progress -> done.
 *   - The ⋯ menu: every reverse / lateral / destructive move (reopen, block,
 *     archive, …). Delete additionally requires a confirm dialog.
 */

export interface StatusMeta {
  label: string;
  glyph: string;
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  open: { label: "未着手", glyph: "●" },
  in_progress: { label: "進行中", glyph: "◐" },
  blocked: { label: "ブロック", glyph: "▲" },
  done: { label: "完了", glyph: "✓" },
  archived: { label: "アーカイブ", glyph: "⊘" },
};

/** The next status for a one-click badge promotion, or null if there is none. */
export function nextPromotionStatus(status: TaskStatus): TaskStatus | null {
  switch (status) {
    case "open":
      return "in_progress";
    case "in_progress":
      return "done";
    default:
      return null;
  }
}

export function canPromote(status: TaskStatus): boolean {
  return nextPromotionStatus(status) !== null;
}

export type RowActionId =
  | "edit"
  | "reopen"
  | "block"
  | "unblock"
  | "archive"
  | "restore"
  | "delete";

export interface RowAction {
  id: RowActionId;
  label: string;
  /** Target status for transition actions; undefined for edit / delete. */
  toStatus?: TaskStatus;
  /** True for moves that lose data: delete (row) and reopen (clears completion). */
  destructive?: boolean;
}

const EDIT: RowAction = { id: "edit", label: "編集" };
const DELETE: RowAction = { id: "delete", label: "削除する", destructive: true };
const ARCHIVE: RowAction = { id: "archive", label: "アーカイブする", toStatus: "archived" };

/** The ⋯ menu actions available from a given status. */
export function getRowActions(status: TaskStatus): RowAction[] {
  switch (status) {
    case "open":
    case "in_progress":
      return [EDIT, { id: "block", label: "ブロックにする", toStatus: "blocked" }, ARCHIVE, DELETE];
    case "blocked":
      return [EDIT, { id: "unblock", label: "ブロックを解除", toStatus: "open" }, ARCHIVE, DELETE];
    case "done":
      return [
        EDIT,
        { id: "reopen", label: "完了を取り消す", toStatus: "open", destructive: true },
        ARCHIVE,
        DELETE,
      ];
    case "archived":
      return [EDIT, { id: "restore", label: "復元する", toStatus: "open" }, DELETE];
  }
}

/**
 * Whether moving from `from` to `to` would discard a completion stamp. The backend
 * clears completed_at when a task returns to an active state (open / in_progress),
 * so that move is destructive only when the task actually has a completion to lose.
 */
export function isDestructiveTransition(
  from: TaskStatus,
  to: TaskStatus,
  hasCompletedAt: boolean,
): boolean {
  void from;
  return hasCompletedAt && (to === "open" || to === "in_progress");
}
