import { Link, NavLink, Route, Routes } from "react-router-dom";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-white" : "text-neutral-400 hover:text-neutral-200";

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex items-center gap-6 border-b border-neutral-800 px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-tight">
          Orbit
        </Link>
        <nav className="flex gap-4 text-sm">
          <NavLink to="/" end className={navItemClass}>
            Today
          </NavLink>
          <NavLink to="/tasks" className={navItemClass}>
            Tasks
          </NavLink>
        </nav>
      </header>
      <main className="px-6 py-8">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </main>
    </div>
  );
}
