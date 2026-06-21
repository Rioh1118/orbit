import { TaskList } from "@/features/tasks/TaskList";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-light tracking-tight text-ink">タスク</h1>
      <TaskList />
    </div>
  );
}
