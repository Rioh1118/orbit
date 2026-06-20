import { useEffect, useRef, useState } from "react";
import { KeyCap } from "@/components/ui/KeyCap";
import { ErrorText } from "@/components/ui/ErrorText";
import { useCurrentSlice } from "@/features/slices/hooks";
import { useCreateFriction } from "./hooks";
import {
  PATTERN_TAGS,
  PATTERN_TAG_BY_KEY,
  type FrictionPatternTag,
} from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FrictionModal({ open, onClose }: Props) {
  const create = useCreateFriction();
  const { data: current } = useCurrentSlice();
  const [tag, setTag] = useState<FrictionPatternTag | null>(null);
  const [description, setDescription] = useState("");
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Drive the native <dialog> from the `open` prop. showModal() gives focus trapping,
  // an inert background, ESC-to-close, and focus restoration for free — the WAI-ARIA APG
  // dialog pattern handled by the platform instead of hand-rolled JS.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setTag(null);
      setDescription("");
      queueMicrotask(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Quick tag selection with Alt+key while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;
      const mapped = PATTERN_TAG_BY_KEY[e.key];
      if (mapped) {
        e.preventDefault();
        setTag(mapped);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const activeSlice = current ?? undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;
    if (!description.trim()) return;
    await create.mutateAsync({
      pattern_tag: tag,
      description: description.trim(),
      work_slice_id: activeSlice?.id ?? null,
      task_id: activeSlice?.task_id ?? null,
    });
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // A click whose target is the dialog itself is a backdrop click (content lives
        // in the child <form>), so dismiss.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-labelledby="friction-modal-title"
      className="m-auto w-full max-w-xl rounded-md border border-instrument/40 bg-surface p-0 text-parchment backdrop:bg-canvas/70"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <header className="flex items-baseline justify-between gap-3">
          <h2
            id="friction-modal-title"
            className="text-sm font-medium text-parchment"
          >
            record friction
          </h2>
          <span className="text-xs text-mist">
            esc to close · alt+1-9,0,a to tag
          </span>
        </header>

        <textarea
          ref={inputRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="what stuck?"
          rows={3}
          maxLength={2000}
          required
          className="w-full rounded border border-instrument/40 bg-canvas px-3 py-2 text-sm text-parchment focus:border-instrument"
          aria-label="friction description"
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-mist">pattern_tag</legend>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {PATTERN_TAGS.map((p) => {
              const active = tag === p.value;
              return (
                <li key={p.value}>
                  <button
                    type="button"
                    onClick={() => setTag(p.value)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-sm transition-colors hover:border-instrument ${
                      active
                        ? "border-instrument bg-elevated text-parchment"
                        : "border-instrument/30 bg-canvas text-parchment-muted"
                    }`}
                  >
                    <KeyCap k={p.key} size="sm" />
                    <span className="font-mono text-xs">{p.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-mist">
            {activeSlice
              ? `linked to current segment (${activeSlice.mode || activeSlice.off_reason})`
              : "no current segment — friction will be unlinked"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-3 py-1 text-sm text-mist transition-colors hover:text-parchment"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!tag || !description.trim() || create.isPending}
              className="rounded border border-instrument bg-elevated px-3 py-1 text-sm text-parchment disabled:opacity-50"
            >
              {create.isPending ? "saving…" : "record"}
            </button>
          </div>
        </div>

        {create.error && (
          <ErrorText>{(create.error as Error).message}</ErrorText>
        )}
      </form>
    </dialog>
  );
}
