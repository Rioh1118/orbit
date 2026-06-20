import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import type { Category } from "@/components/orbit/CategoryTabs";

function browserTZ(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function useThenVsNow(category: Category, weeks = 4) {
  const tz = browserTZ();
  return useQuery({
    queryKey: ["reports", "then-vs-now", category, weeks, tz],
    queryFn: () => reportsApi.thenVsNow({ category, weeks, tz }),
  });
}
