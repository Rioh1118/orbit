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

  if (isLoading) return <p className="text-sm text-mist">loading…</p>;
  if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-mist">no frictions recorded</p>;
  }

  return (
    <ul>
      {rows.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <FrictionItem
              note={f.description}
              patternTag={f.pattern_tag}
              resolved={f.resolved_at != null}
            />
          </div>
          <div className="flex shrink-0 gap-2">
            {!f.resolved_at && (
              <button
                type="button"
                onClick={() =>
                  update.mutate({ id: f.id, input: { resolved: true } })
                }
                className="text-xs text-mist transition-colors hover:text-growth"
                aria-label="resolve"
              >
                resolve
              </button>
            )}
            <button
              type="button"
              onClick={() => remove.mutate(f.id)}
              className="text-xs text-mist transition-colors hover:text-danger"
              aria-label="delete"
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
