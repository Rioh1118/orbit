import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { useCreateTask } from "./hooks";
import { TASK_CATEGORIES, type TaskCategory } from "./types";

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("new_feature");
  const create = useCreateTask();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await create.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
        });
        setTitle("");
        setDescription("");
      }}
      className="space-y-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスクのタイトル"
        required
        maxLength={200}
        className={fieldClass}
        aria-label="タイトル"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明 (任意)"
        rows={2}
        maxLength={5000}
        className={fieldClass}
        aria-label="説明"
      />
      <div className="flex items-center gap-2">
        <label htmlFor="task-category" className="text-xs text-ink-muted">
          カテゴリ
        </label>
        <select
          id="task-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as TaskCategory)}
          className="rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-ink outline-none focus:border-primary"
        >
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={create.isPending || !title.trim()}
      >
        {create.isPending ? "作成中..." : "タスク作成"}
      </Button>
      {create.error && <ErrorText>{(create.error as Error).message}</ErrorText>}
    </form>
  );
}
