import { useState } from "react";
import { useCreateTask } from "./hooks";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateTask();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await create.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
        });
        setTitle("");
        setDescription("");
      }}
      className="space-y-2"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスクのタイトル"
        required
        maxLength={200}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        aria-label="タイトル"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明 (任意)"
        rows={2}
        maxLength={5000}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
        aria-label="説明"
      />
      <button
        type="submit"
        disabled={create.isPending || !title.trim()}
        className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:bg-neutral-700"
      >
        {create.isPending ? "作成中..." : "タスク作成"}
      </button>
      {create.error && (
        <p className="text-xs text-red-400">{(create.error as Error).message}</p>
      )}
    </form>
  );
}
