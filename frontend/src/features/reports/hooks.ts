import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import type { Category } from "@/components/orbit/CategoryTabs";

// Resolved once at module load (review M8 — not per render).
const BROWSER_TZ: string = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
})();

export function useThenVsNow(category: Category, weeks = 4) {
  return useQuery({
    queryKey: ["reports", "then-vs-now", category, weeks, BROWSER_TZ],
    queryFn: () => reportsApi.thenVsNow({ category, weeks, tz: BROWSER_TZ }),
  });
}
