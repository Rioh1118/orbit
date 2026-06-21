import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { Input } from "@/components/ui/Input";
import { Radio } from "@/components/ui/Radio";
import { validateTaskTitle } from "./validation";
import { TASK_CATEGORIES, type Task, type TaskCategory } from "./types";

export interface EditTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
}

interface EditTaskDialogProps {
  open: boolean;
  task: Task;
  /** Persists the edit; rejects on failure (the dialog shows the error and stays open). */
  onSave: (input: EditTaskInput) => Promise<void>;
  onClose: () => void;
}

/**
 * Native `<dialog>` task editor (brief §7.12.3): title (floating Input), description
 * (textarea with a visible label) and category (Radio group). Fields seed from the
 * task on open; an empty title shows an inline field error, and a failed save shows
 * an inline error and keeps the dialog open (no silent failure). Close path mirrors
 * FrictionModal (onClose + backdrop click + native Esc).
 */
export function EditTaskDialog({ open, task, onSave, onClose }: EditTaskDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const descId = useId();

  // Seed fields from the task whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setError(null);
    setSaveError(null);
    setSaving(false);
  }, [open, task]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      titleRef.current?.focus();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = validateTaskTitle(title);
    if (!result.ok) {
      setError(result.error);
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ title: result.value, description: description.trim(), category });
      ref.current?.close(); // success → onClose → parent unmounts
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby={headingId}
      className="m-auto w-[min(92vw,32rem)] rounded-lg border border-border bg-surface p-0 text-ink shadow-lg motion-safe:animate-[moveInBottom_300ms_cubic-bezier(.16,1,.3,1)]"
    >
      <form onSubmit={submit} className="space-y-5 p-6">
        <h2 id={headingId} className="text-lg text-ink">
          タスクを編集
        </h2>
        <Input
          ref={titleRef}
          id="edit-task-title"
          label="タイトル"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          error={error ?? undefined}
        />
        <div>
          <label htmlFor={descId} className="mb-1 block text-xs text-ink-muted">
            説明
          </label>
          <textarea
            id={descId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={5000}
            className="block w-full rounded-md border border-border-strong bg-surface p-2 text-sm text-ink outline-none transition-colors focus:border-primary"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-xs text-ink-muted">カテゴリ</legend>
          <div className="grid grid-cols-2 gap-2">
            {TASK_CATEGORIES.map((c) => (
              <Radio
                key={c.value}
                name="edit-task-category"
                value={c.value}
                label={c.label}
                checked={category === c.value}
                onChange={(v) => setCategory(v as TaskCategory)}
              />
            ))}
          </div>
        </fieldset>
        {saveError && <ErrorText>{saveError}</ErrorText>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => ref.current?.close()}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
