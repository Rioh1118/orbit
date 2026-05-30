import { TaskForm } from "@/features/tasks/TaskForm";
import { TaskList } from "@/features/tasks/TaskList";

export default function TasksPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">新規タスク</h2>
        <TaskForm />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium">タスク一覧</h2>
        <TaskList />
      </section>
    </div>
  );
}
