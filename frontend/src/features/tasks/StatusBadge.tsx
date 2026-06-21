import { STATUS_META, nextPromotionStatus } from "./taskState";
import type { TaskStatus } from "./types";

/**
 * Glyph colours (brief §7.12.2): done's ✓ is the only accent use — accent is
 * non-text, and a glyph fill qualifies (3.26:1 ≥ 3:1, brief §3.3). Status is never
 * conveyed by colour alone — every badge pairs a distinct glyph with a text label.
 */
const GLYPH_COLOR: Record<TaskStatus, string> = {
  open: "text-ink-muted",
  in_progress: "text-primary",
  blocked: "text-friction",
  done: "text-accent",
  archived: "text-ink-muted",
};

interface StatusBadgeProps {
  status: TaskStatus;
  onPromote: (to: TaskStatus) => void;
}

/**
 * Status badge with one-click forward promotion (brief §7.12.2). open / in_progress
 * render as a button that advances the status; terminal/branch states (done, blocked,
 * archived) render as static text — every reverse/destructive move lives in the ⋯ menu.
 */
export function StatusBadge({ status, onPromote }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const next = nextPromotionStatus(status);

  if (!next) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-muted">
        <span aria-hidden className={GLYPH_COLOR[status]}>
          {meta.glyph}
        </span>
        {meta.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPromote(next)}
      aria-label={`${meta.label}。クリックで${STATUS_META[next].label}にする`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
    >
      <span aria-hidden className={GLYPH_COLOR[status]}>
        {meta.glyph}
      </span>
      {meta.label}
    </button>
  );
}
