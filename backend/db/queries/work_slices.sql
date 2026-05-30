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

-- name: GetWorkSlice :one
SELECT * FROM work_slices
WHERE id = $1 AND user_id = $2
LIMIT 1;

-- name: CreateWorkSlice :one
INSERT INTO work_slices (id, user_id, task_id, mode, started_at, note)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateWorkSlice :one
UPDATE work_slices
SET mode = $3,
    task_id = $4,
    started_at = $5,
    ended_at = $6,
    duration_sec = $7,
    density = $8,
    note = $9,
    updated_at = now()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteWorkSlice :exec
DELETE FROM work_slices WHERE id = $1 AND user_id = $2;

-- name: SumWorkSlicesByModeInRange :many
-- Sum durations by mode for ended slices within [from, to).
-- Treats in-progress slices (ended_at NULL) as 0 to keep the query stable.
SELECT mode, COALESCE(SUM(duration_sec), 0)::bigint AS total_seconds
FROM work_slices
WHERE user_id = $1
  AND started_at >= $2
  AND started_at < $3
  AND ended_at IS NOT NULL
GROUP BY mode;
