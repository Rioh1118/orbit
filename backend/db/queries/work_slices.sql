-- name: ListWorkSlices :many
SELECT * FROM work_slices
WHERE user_id = $1
  AND (sqlc.narg('task_id')::uuid IS NULL OR task_id = sqlc.narg('task_id'))
  AND (sqlc.narg('mode')::text IS NULL OR mode = sqlc.narg('mode'))
  AND (sqlc.narg('from_time')::timestamptz IS NULL OR started_at >= sqlc.narg('from_time'))
  AND (sqlc.narg('to_time')::timestamptz IS NULL OR started_at < sqlc.narg('to_time'))
ORDER BY started_at DESC
LIMIT $2 OFFSET $3;

-- name: CountWorkSlices :one
SELECT count(*) FROM work_slices
WHERE user_id = $1
  AND (sqlc.narg('task_id')::uuid IS NULL OR task_id = sqlc.narg('task_id'))
  AND (sqlc.narg('mode')::text IS NULL OR mode = sqlc.narg('mode'))
  AND (sqlc.narg('from_time')::timestamptz IS NULL OR started_at >= sqlc.narg('from_time'))
  AND (sqlc.narg('to_time')::timestamptz IS NULL OR started_at < sqlc.narg('to_time'));

-- name: ListActiveWorkSlices :many
SELECT * FROM work_slices
WHERE user_id = $1 AND ended_at IS NULL
ORDER BY started_at DESC;

-- name: GetOpenWorkSlice :one
-- The single currently-open segment (state machine: at most one per user).
SELECT * FROM work_slices
WHERE user_id = $1 AND ended_at IS NULL
ORDER BY started_at DESC
LIMIT 1;

-- name: GetWorkSlice :one
SELECT * FROM work_slices
WHERE id = $1 AND user_id = $2
LIMIT 1;

-- name: CreateWorkSlice :one
INSERT INTO work_slices (id, user_id, task_id, type, mode, driver, off_reason, started_at, note)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateWorkSlice :one
UPDATE work_slices
SET task_id = $3,
    mode = $4,
    driver = $5,
    off_reason = $6,
    started_at = $7,
    ended_at = $8,
    duration_sec = $9,
    note = $10,
    updated_at = now()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteWorkSlice :exec
DELETE FROM work_slices WHERE id = $1 AND user_id = $2;

-- name: SumWorkModeInRange :many
-- Today distribution: total work seconds per mode for ended WORK segments in [from, to).
SELECT mode, COALESCE(SUM(duration_sec), 0)::bigint AS total_seconds
FROM work_slices
WHERE user_id = $1
  AND type = 'work'
  AND ended_at IS NOT NULL
  AND started_at >= $2
  AND started_at < $3
GROUP BY mode;
