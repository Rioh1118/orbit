import { useEffect, useRef, useState } from "react";
import { KeyCap } from "@/components/ui/KeyCap";
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset on open and focus the description.
  useEffect(() => {
    if (open) {
      setTag(null);
      setDescription("");
      // Defer focus to after render.
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  // Tag shortcuts work even while typing; we only react when Alt is held.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!e.altKey) return;
      if (e.metaKey || e.ctrlKey) return;
      const mapped = PATTERN_TAG_BY_KEY[e.key];
      if (mapped) {
        e.preventDefault();
        setTag(mapped);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

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
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="record friction"
      className="fixed inset-0 z-50 flex items-start justify-center bg-canvas/80 px-4 py-12 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-4 rounded-md border border-instrument/40 bg-surface p-5 shadow-glow"
      >
        <header className="flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-instrument text-mist">
            record friction
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-instrument text-mist">
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
          className="w-full rounded border border-instrument/40 bg-canvas px-3 py-2 text-sm text-parchment focus:border-instrument focus:outline-none"
          aria-label="friction description"
        />

        <fieldset className="space-y-2">
          <legend className="font-mono text-xs uppercase tracking-instrument text-mist">
            pattern_tag
          </legend>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {PATTERN_TAGS.map((p) => {
              const active = tag === p.value;
              return (
                <li key={p.value}>
                  <button
                    type="button"
                    onClick={() => setTag(p.value)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-sm hover:border-instrument ${
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

        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-instrument text-mist">
            {activeSlice
              ? `linked to current segment (${activeSlice.mode || activeSlice.off_reason})`
              : "no current segment — friction will be unlinked"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1 font-mono text-xs uppercase tracking-instrument text-mist hover:text-parchment"
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
          <p className="text-xs text-danger">
            {(create.error as Error).message}
          </p>
        )}
      </form>
    </div>
  );
}
