import { FrictionItem } from "@/components/orbit/FrictionItem";
import { ErrorText } from "@/components/ui/ErrorText";
import { useFrictions, useUpdateFriction, useDeleteFriction } from "./hooks";

interface Props {
  limit?: number;
  resolved?: boolean;
}

export function FrictionLog({ limit = 20, resolved }: Props) {
  const { data, isLoading, error } = useFrictions({ limit, resolved });
  const update = useUpdateFriction();
  const remove = useDeleteFriction();

  if (isLoading) return <p className="text-sm text-ink-muted">読み込み中…</p>;
  if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">記録された詰まりはありません</p>;
  }

  return (
    <ul>
      {rows.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <FrictionItem
              note={f.description}
              patternTag={f.pattern_tag}
              resolved={f.resolved_at != null}
            />
          </div>
          {/* ≥24px targets with spacing (review L8 / SC 2.5.8). */}
          <div className="flex shrink-0 items-center gap-1">
            {!f.resolved_at && (
              <button
                type="button"
                onClick={() =>
                  update.mutate({ id: f.id, input: { resolved: true } })
                }
                className="inline-flex h-6 items-center justify-center rounded px-2 text-xs text-ink-muted transition-colors hover:text-accent"
                aria-label="解決にする"
              >
                解決
              </button>
            )}
            <button
              type="button"
              onClick={() => remove.mutate(f.id)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-base text-ink-muted transition-colors hover:text-danger"
              aria-label="削除"
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
