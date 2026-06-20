import { Link, NavLink, Route, Routes } from "react-router-dom";
import TodayPage from "./pages/TodayPage";
import TasksPage from "./pages/TasksPage";
import ThenVsNowPage from "./pages/ThenVsNowPage";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${
    isActive ? "text-parchment" : "text-mist hover:text-parchment"
  }`;

export default function App() {
  return (
    <div className="min-h-screen text-parchment">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-instrument focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-parchment"
      >
        本文へスキップ
      </a>
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-instrument/40 px-4 py-4 sm:px-8">
        <Link
          to="/"
          className="font-semibold tracking-wide text-parchment"
          aria-label="Orbit home"
        >
          <span aria-hidden className="mr-1.5 text-mist">
            ◯
          </span>
          orbit
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
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
        className="px-4 py-8 focus:outline-none sm:px-8 sm:py-10"
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
