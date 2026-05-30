import { Link, NavLink, Route, Routes } from "react-router-dom";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";
import ThenVsNowPage from "./pages/ThenVsNowPage";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `font-mono text-xs uppercase tracking-instrument transition-colors ${
    isActive ? "text-parchment" : "text-mist hover:text-parchment"
  }`;

export default function App() {
  return (
    <div className="min-h-screen text-parchment">
      <header className="flex items-center gap-8 border-b border-instrument/40 px-8 py-4">
        <Link
          to="/"
          className="font-mono text-sm uppercase tracking-[0.2em] text-parchment"
          aria-label="Orbit home"
        >
          <span aria-hidden className="mr-1.5 text-mist">◯</span>orbit
        </Link>
        <nav className="flex gap-5">
          <NavLink to="/" end className={navItemClass}>
            today
          </NavLink>
          <NavLink to="/then-vs-now" className={navItemClass}>
            then · now
          </NavLink>
          <NavLink to="/tasks" className={navItemClass}>
            tasks
          </NavLink>
        </nav>
      </header>
      <main className="px-8 py-10">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/then-vs-now" element={<ThenVsNowPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </main>
    </div>
  );
}
