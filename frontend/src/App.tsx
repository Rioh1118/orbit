export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Orbit</h1>
        <p className="text-xs text-neutral-400">
          開発作業ログ + 成長観察アプリ (Phase 1 skeleton)
        </p>
      </header>
      <main className="px-6 py-8">
        <section className="max-w-2xl">
          <h2 className="text-lg font-medium">Today</h2>
          <p className="mt-2 text-sm text-neutral-400">
            ここに進行中の Work Slice と本日のサマリが入る予定。
          </p>
        </section>
      </main>
    </div>
  );
}
