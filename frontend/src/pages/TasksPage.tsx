import { TaskForm } from "@/features/tasks/TaskForm";
import { TaskList } from "@/features/tasks/TaskList";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section>
        <h2 className="mb-3 text-xl font-normal text-ink">新規タスク</h2>
        <TaskForm />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-normal text-ink">タスク一覧</h2>
        <TaskList />
      </section>
    </div>
  );
}
