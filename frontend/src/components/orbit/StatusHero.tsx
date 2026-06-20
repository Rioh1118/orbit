// The single, always-present "what is happening right now" block at the top of Today.
// ADR 005 §2 requires the current state machine position to be unmistakable — so every
// state (working / off / idle / stale) renders at equal visual weight: same surface,
// border, padding, accent bar, and status-line size. The idle state is deliberately just
// as loud as the active one, killing the "am I still tracking?" misread.

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
        : { bar: "bg-growth", dot: "bg-growth", phrase: "作業中" };
    case "off":
      return {
        bar: "bg-mist",
        dot: "bg-mist",
        phrase: `計測対象外 · ${state.reasonLabel}`,
      };
    case "idle":
      return {
        bar: "bg-instrument/40",
        dot: "border border-mist/60",
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
      className="relative flex min-h-[6rem] flex-col gap-3 overflow-hidden rounded-md border border-instrument/30 bg-surface px-5 py-4 pl-6 shadow-instrument"
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${view.bar}`} />

      <div className="flex items-start justify-between gap-4">
        {/* role="status" implies aria-live="polite". Only the state phrase is announced —
            the elapsed clock is excluded so it doesn't re-announce on every 30s tick. */}
        <p role="status" className="flex items-center gap-2.5 text-lg text-parchment">
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
                ? "shrink-0 font-mono text-lg tabular-nums text-parchment-muted"
                : "shrink-0 font-mono text-2xl tabular-nums text-parchment"
            }
          >
            {state.elapsedLabel}
          </span>
        )}
      </div>

      {state.kind === "working" && (
        <p className="text-sm text-mist">
          {state.modeLabel} · {state.driverLabel}
          {state.taskTitle && (
            <>
              {" · "}
              <span className="text-parchment-muted">{state.taskTitle}</span>
            </>
          )}
        </p>
      )}

      {stale && (
        <p className="border-l-2 border-friction pl-2.5 text-sm text-parchment">
          長時間開いたままです。終了すると開始からの全経過時間が記録されます — 閉じ忘れの場合はご注意ください。
        </p>
      )}

      {state.kind === "idle" && (
        <p className="text-sm text-mist">下のモードを選んで計測を開始します。</p>
      )}

      {isActive && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEnd}
            disabled={busy}
            className="rounded-md border border-instrument/50 bg-canvas px-3 py-1.5 text-sm text-parchment transition-colors hover:border-instrument disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stale ? "閉じる" : "終了"}
          </button>
          {state.kind === "working" && (
            <button
              type="button"
              onClick={onBreak}
              disabled={busy}
              className="rounded-md px-3 py-1.5 text-sm text-mist transition-colors hover:text-parchment disabled:cursor-not-allowed disabled:opacity-50"
            >
              休憩
            </button>
          )}
        </div>
      )}
    </section>
  );
}
