import { Link, NavLink, Route, Routes } from "react-router-dom";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";
import ThenVsNowPage from "./pages/ThenVsNowPage";

// Active nav gets an underline that slides in (::after width 0→100%), brief §7.10/§5.1.
const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `relative text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-200 after:content-[''] ${
    isActive ? "text-ink after:w-full" : "text-ink-muted hover:text-ink after:w-0"
  }`;

export default function App() {
  return (
    <div className="min-h-screen text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        本文へスキップ
      </a>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-4 py-3 sm:gap-x-6 sm:px-8 sm:py-4">
        <Link
          to="/"
          className="font-semibold tracking-wide text-ink"
          aria-label="Orbit home"
        >
          <span aria-hidden className="mr-1.5 text-ink">
            ◯
          </span>
          orbit
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-5">
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
      <main
        id="main"
        tabIndex={-1}
        className="px-4 py-12 focus:outline-none sm:px-8"
      >
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/then-vs-now" element={<ThenVsNowPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </main>
    </div>
  );
}
