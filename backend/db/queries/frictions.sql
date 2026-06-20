-- name: ListFrictions :many
SELECT * FROM frictions
WHERE user_id = $1
  AND (sqlc.narg('task_id')::uuid IS NULL OR task_id = sqlc.narg('task_id'))
  AND (sqlc.narg('work_slice_id')::uuid IS NULL OR work_slice_id = sqlc.narg('work_slice_id'))
  AND (sqlc.narg('pattern_tag')::text IS NULL OR pattern_tag = sqlc.narg('pattern_tag'))
  AND (
    sqlc.narg('resolved')::bool IS NULL
    OR (sqlc.narg('resolved')::bool = true AND resolved_at IS NOT NULL)
    OR (sqlc.narg('resolved')::bool = false AND resolved_at IS NULL)
  )
  AND (sqlc.narg('from_time')::timestamptz IS NULL OR created_at >= sqlc.narg('from_time'))
  AND (sqlc.narg('to_time')::timestamptz IS NULL OR created_at < sqlc.narg('to_time'))
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountFrictions :one
SELECT count(*) FROM frictions
WHERE user_id = $1
  AND (sqlc.narg('task_id')::uuid IS NULL OR task_id = sqlc.narg('task_id'))
  AND (sqlc.narg('work_slice_id')::uuid IS NULL OR work_slice_id = sqlc.narg('work_slice_id'))
  AND (sqlc.narg('pattern_tag')::text IS NULL OR pattern_tag = sqlc.narg('pattern_tag'))
  AND (
    sqlc.narg('resolved')::bool IS NULL
    OR (sqlc.narg('resolved')::bool = true AND resolved_at IS NOT NULL)
    OR (sqlc.narg('resolved')::bool = false AND resolved_at IS NULL)
  )
  AND (sqlc.narg('from_time')::timestamptz IS NULL OR created_at >= sqlc.narg('from_time'))
  AND (sqlc.narg('to_time')::timestamptz IS NULL OR created_at < sqlc.narg('to_time'));

-- name: GetFriction :one
SELECT * FROM frictions
WHERE id = $1 AND user_id = $2
LIMIT 1;

-- name: CreateFriction :one
INSERT INTO frictions (id, user_id, task_id, work_slice_id, pattern_tag, description)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateFriction :one
UPDATE frictions
SET task_id = $3,
    work_slice_id = $4,
    pattern_tag = $5,
    description = $6,
    resolved_at = $7,
    resolution_note = $8,
    updated_at = now()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteFriction :exec
DELETE FROM frictions WHERE id = $1 AND user_id = $2;
