import { StatusHero, type HeroState } from "@/components/orbit/StatusHero";
import { ErrorText } from "@/components/ui/ErrorText";
import { useNow } from "@/lib/useNow";
import { useTasks } from "@/features/tasks/hooks";
import { useCurrentSlice, useEndSlice, useStartOff } from "./hooks";
import { OFF_REASONS, SLICE_MODE_META } from "./types";

// Always-on recovery guard (ADR 005 / review M1): if a work segment has been open
// this long, it was almost certainly forgotten — prompt to close before it pollutes data.
const RECOVERY_THRESHOLD_MIN = 8 * 60;

function elapsedMinutes(startedAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ActiveSliceCard() {
  const { data: current, isLoading } = useCurrentSlice();
  const { data: tasksResp } = useTasks();
  const end = useEndSlice();
  const startOff = useStartOff();
  const now = useNow();

  if (isLoading) return <p className="text-sm text-mist">読み込み中…</p>;

  let state: HeroState;
  if (!current) {
    state = { kind: "idle" };
  } else if (current.type === "off") {
    const reasonLabel =
      OFF_REASONS.find((r) => r.value === current.off_reason)?.label ??
      current.off_reason;
    state = {
      kind: "off",
      reasonLabel,
      elapsedLabel: formatElapsed(elapsedMinutes(current.started_at, now)),
    };
  } else {
    const minutes = elapsedMinutes(current.started_at, now);
    const modeLabel = current.mode
      ? (SLICE_MODE_META[current.mode]?.label ?? current.mode)
      : "—";
    const taskTitle = current.task_id
      ? (tasksResp?.data.find((t) => t.id === current.task_id)?.title ?? "—")
      : "";
    state = {
      kind: "working",
      modeLabel,
      driverLabel: current.driver || "—",
      taskTitle,
      elapsedLabel: formatElapsed(minutes),
      stale: minutes > RECOVERY_THRESHOLD_MIN,
    };
  }

  const handleEnd = current ? () => end.mutate(current.id) : undefined;
  const handleBreak =
    current && current.type === "work"
      ? () => startOff.mutate({ reason: "break" })
      : undefined;

  return (
    <div className="space-y-2">
      <StatusHero
        state={state}
        onEnd={handleEnd}
        onBreak={handleBreak}
        busy={end.isPending || startOff.isPending}
      />
      {end.error && <ErrorText>{(end.error as Error).message}</ErrorText>}
      {startOff.error && (
        <ErrorText>{(startOff.error as Error).message}</ErrorText>
      )}
    </div>
  );
}
