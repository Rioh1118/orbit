-- Then vs Now: gross aggregations over {category × time window}, week-bucketed (ADR 005).
-- Week boundaries are cut in the client timezone (tz param), per DATA_MODEL.md.

-- name: SumWorkByCategoryModeWeek :many
-- mode distribution shift: total WORK seconds per (week, mode) for a category.
SELECT
    date_trunc('week', ws.started_at AT TIME ZONE sqlc.arg(tz)::text)::timestamp AS week_start,
    ws.mode AS mode,
    COALESCE(SUM(ws.duration_sec), 0)::bigint AS total_seconds
FROM work_slices ws
JOIN tasks t ON t.id = ws.task_id
WHERE ws.user_id = sqlc.arg(user_id)
  AND ws.type = 'work'
  AND ws.ended_at IS NOT NULL
  AND t.category = sqlc.arg(category)
  AND ws.started_at >= sqlc.arg(from_time)
  AND ws.started_at < sqlc.arg(to_time)
GROUP BY week_start, ws.mode
ORDER BY week_start, ws.mode;

-- name: SumCompletedTaskTimeByCategoryWeek :many
-- "completion time down": per week, count of completed tasks and their total own WORK time.
-- avg own-time per task = total_seconds / task_count (computed in the service).
SELECT
    date_trunc('week', t.completed_at AT TIME ZONE sqlc.arg(tz)::text)::timestamp AS week_start,
    COUNT(DISTINCT t.id)::bigint AS task_count,
    COALESCE(SUM(ws.duration_sec), 0)::bigint AS total_seconds
FROM tasks t
LEFT JOIN work_slices ws
    ON ws.task_id = t.id AND ws.type = 'work' AND ws.ended_at IS NOT NULL
WHERE t.user_id = sqlc.arg(user_id)
  AND t.category = sqlc.arg(category)
  AND t.completed_at IS NOT NULL
  AND t.completed_at >= sqlc.arg(from_time)
  AND t.completed_at < sqlc.arg(to_time)
GROUP BY week_start
ORDER BY week_start;

-- name: CountFrictionsByCategoryPatternWeek :many
-- stall counts per (week, pattern_tag) for a category (frictions linked to that category's tasks).
SELECT
    date_trunc('week', f.created_at AT TIME ZONE sqlc.arg(tz)::text)::timestamp AS week_start,
    f.pattern_tag AS pattern_tag,
    COUNT(*)::bigint AS cnt
FROM frictions f
JOIN tasks t ON t.id = f.task_id
WHERE f.user_id = sqlc.arg(user_id)
  AND t.category = sqlc.arg(category)
  AND f.created_at >= sqlc.arg(from_time)
  AND f.created_at < sqlc.arg(to_time)
GROUP BY week_start, f.pattern_tag
ORDER BY week_start, f.pattern_tag;
