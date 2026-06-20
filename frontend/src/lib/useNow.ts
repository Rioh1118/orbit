import { useEffect, useState } from "react";

// Shared "now" clock ticking every `intervalMs` (default 30s). One source instead of
// duplicated setInterval in each consumer (review LOW / DRY).
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
