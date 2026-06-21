import { Button } from "@/components/ui/Button";

// The single, always-present "what is happening right now" block at the top of Today.
// ADR 005 §2 requires the current state machine position to be unmistakable — so every
// state (working / off / idle / stale) renders at equal visual weight: same surface,
// border, padding, accent bar, and status-line size. The idle state is deliberately just
// as loud as the active one, killing the "am I still tracking?" misread.
//
// State colour mapping (brief §7.9 / §3.3): working = primary (the "here, now" subject),
// off = ink-muted (not measured → desaturated), stale = friction (attention). accent
// (green) is reserved for growth signals and is never a state colour.

interface WorkingState {
  kind: "working";
  modeLabel: string;
  driverLabel: string;
  taskTitle: string;
  elapsedLabel: string;
  // true once the segment has been open past the recovery threshold (likely forgotten).
  stale: boolean;
}

interface OffState {
  kind: "off";
  reasonLabel: string;
  elapsedLabel: string;
}

interface IdleState {
  kind: "idle";
}

export type HeroState = WorkingState | OffState | IdleState;

interface StatusHeroProps {
  state: HeroState;
  onEnd?: () => void;
  onBreak?: () => void;
  busy?: boolean;
}

interface StateView {
  bar: string;
  dot: string;
  phrase: string;
}

function viewFor(state: HeroState): StateView {
  switch (state.kind) {
    case "working":
      return state.stale
        ? { bar: "bg-friction", dot: "bg-friction", phrase: "作業中 · 確認が必要" }
        : { bar: "bg-primary", dot: "bg-primary", phrase: "作業中" };
    case "off":
      return {
        bar: "bg-ink-muted",
        dot: "bg-ink-muted",
        phrase: `計測対象外 · ${state.reasonLabel}`,
      };
    case "idle":
      return {
        bar: "bg-border-strong",
        dot: "border border-border-strong",
        phrase: "作業していません",
      };
  }
}

export function StatusHero({ state, onEnd, onBreak, busy }: StatusHeroProps) {
  const view = viewFor(state);
  const isActive = state.kind === "working" || state.kind === "off";
  const stale = state.kind === "working" && state.stale;

  return (
    <section
      aria-label="現在の計測状態"
      className="relative flex min-h-[6rem] flex-col gap-3 overflow-hidden rounded-lg border border-border bg-surface px-5 py-4 pl-6 shadow-sm"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1.5 transition-colors duration-200 ${view.bar}`}
      />

      <div className="flex items-start justify-between gap-4">
        {/* role="status" implies aria-live="polite". Only the state phrase is announced —
            the elapsed clock is excluded so it doesn't re-announce on every 30s tick. */}
        <p role="status" className="flex items-center gap-2.5 text-lg text-ink">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${view.dot}`}
          />
          {view.phrase}
        </p>
        {isActive && (
          <span
            className={
              stale
                ? "shrink-0 font-mono text-lg tabular-nums text-ink-muted"
                : "shrink-0 font-mono text-2xl tabular-nums text-ink"
            }
          >
            {state.elapsedLabel}
          </span>
        )}
      </div>

      {state.kind === "working" && (
        <p className="text-sm text-ink-muted">
          {state.modeLabel} · {state.driverLabel}
          {state.taskTitle && (
            <>
              {" · "}
              <span className="text-ink">{state.taskTitle}</span>
            </>
          )}
        </p>
      )}

      {stale && (
        <p className="border-l-2 border-friction pl-2.5 text-sm text-ink">
          長時間開いたままです。終了すると開始からの全経過時間が記録されます — 閉じ忘れの場合はご注意ください。
        </p>
      )}

      {state.kind === "idle" && (
        <p className="text-sm text-ink-muted">下のモードを選んで計測を開始します。</p>
      )}

      {isActive && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="subtle" onClick={onEnd} disabled={busy}>
            {stale ? "閉じる" : "終了"}
          </Button>
          {state.kind === "working" && (
            <Button type="button" variant="ghost" onClick={onBreak} disabled={busy}>
              休憩
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
