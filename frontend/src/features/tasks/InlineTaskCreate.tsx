import { type KeyboardEvent, useRef, useState } from "react";
import { ErrorText } from "@/components/ui/ErrorText";
import { CategoryMenu } from "./CategoryMenu";
import { validateTaskTitle } from "./validation";
import type { TaskCategory } from "./types";

interface InlineTaskCreateProps {
  category: TaskCategory;
  onCategoryChange: (category: TaskCategory) => void;
  onCreate: (input: { title: string; category: TaskCategory }) => Promise<void>;
  isPending: boolean;
  autoFocus?: boolean;
}

/**
 * Row-end inline creation (brief §7.12.4, Linear/Todoist style): Enter creates and
 * refocuses the field for continuous entry, Esc clears, an empty title shows an
 * inline error (never silent), and the category persists across creates (lifted to
 * the parent so the last-used category is the default).
 */
export function InlineTaskCreate({
  category,
  onCategoryChange,
  onCreate,
  isPending,
  autoFocus,
}: InlineTaskCreateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    const result = validateTaskTitle(title);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    try {
      await onCreate({ title: result.value, category });
      setTitle("");
      inputRef.current?.focus();
    } catch {
      // The mutation error is surfaced by the parent (create.error); keep the typed
      // title so the user can retry without re-entering it.
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTitle("");
      setError(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-ink-muted">
          ＋
        </span>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          placeholder="新しいタスクを追加…"
          maxLength={200}
          autoFocus={autoFocus}
          aria-label="新しいタスクのタイトル"
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
        />
        <CategoryMenu category={category} onChange={onCategoryChange} />
        <button
          type="button"
          onClick={() => void commit()}
          disabled={isPending}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
        >
          {isPending ? "追加中…" : "追加"}
        </button>
      </div>
      {error && (
        <div className="mt-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </div>
  );
}
