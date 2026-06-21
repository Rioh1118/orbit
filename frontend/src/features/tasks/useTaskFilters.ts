import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type CategoryFilter,
  type StatusFilter,
  type TaskFilter,
  parseTaskFilter,
  taskFilterToParams,
} from "./filters";

/**
 * Bridges the URL query (`?status=&category=`) to the tested pure filter functions
 * (brief §7.12.5). `replace: true` keeps filter toggles out of the history stack.
 */
export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(() => parseTaskFilter(searchParams), [searchParams]);

  const setFilter = useCallback(
    (next: TaskFilter) => {
      setSearchParams(taskFilterToParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const setStatus = useCallback(
    (status: StatusFilter) => setFilter({ ...filter, status }),
    [filter, setFilter],
  );

  const setCategory = useCallback(
    (category: CategoryFilter) => setFilter({ ...filter, category }),
    [filter, setFilter],
  );

  const clear = useCallback(() => setFilter({ status: "all", category: "all" }), [setFilter]);

  return { filter, setStatus, setCategory, clear };
}
