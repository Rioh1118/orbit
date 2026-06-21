import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  // an inert background, ESC-to-close, and focus restoration for free (WAI-ARIA APG dialog).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setTag(null);
      setDescription("");
      create.reset(); // review M3: clear a prior mutation error so it doesn't re-alert on reopen.
      queueMicrotask(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // create.reset is stable; depending only on `open` keeps this to open/close transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lock background scroll while the modal is open (review M4).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Quick tag selection with Alt+key while the dialog is open. Alt (not a bare key) is
  // deliberate: the description textarea holds focus, so bare digits must type, not tag.
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
      className="m-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-surface p-0 text-ink shadow-lg motion-safe:animate-[moveInBottom_300ms_ease-out]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <header className="flex items-baseline justify-between gap-3">
          <h2
            id="friction-modal-title"
            className="text-sm font-medium text-ink"
          >
            詰まりを記録
          </h2>
          <span className="text-xs text-ink-muted">
            esc で閉じる · alt+1-9,0,a でタグ
          </span>
        </header>

        <textarea
          ref={inputRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="何に詰まった?"
          rows={3}
          maxLength={2000}
          required
          className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary"
          aria-label="詰まりの内容"
        />

        <fieldset className="space-y-2">
          <legend
            id="friction-tag-label"
            className="text-sm font-medium text-ink-muted"
          >
            パターンタグ
          </legend>
          {/* single-select → radiogroup/radio + aria-checked (review H2 / SC 4.1.2) */}
          <div
            role="radiogroup"
            aria-labelledby="friction-tag-label"
            className="grid grid-cols-2 gap-1.5 sm:grid-cols-3"
          >
            {PATTERN_TAGS.map((p) => {
              const active = tag === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTag(p.value)}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-ink"
                      : "border-border bg-surface text-ink-muted hover:border-border-strong"
                  }`}
                >
                  <KeyCap k={p.key} size="sm" />
                  <span className="font-mono text-xs">{p.label}</span>
                </button>
              );
            })}
          </div>
          {!tag && (
            <p className="text-xs text-ink-muted">タグを選択してください。</p>
          )}
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            {activeSlice
              ? `現在の区間に紐付け (${activeSlice.mode || activeSlice.off_reason})`
              : "現在の区間なし — 紐付けなしで記録"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!tag || !description.trim() || create.isPending}
            >
              {create.isPending ? "保存中…" : "記録"}
            </Button>
          </div>
        </div>

        {create.error && (
          <ErrorText>{(create.error as Error).message}</ErrorText>
        )}
      </form>
    </dialog>
  );
}
