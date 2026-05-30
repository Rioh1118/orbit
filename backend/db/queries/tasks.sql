-- name: ListTasks :many
SELECT * FROM tasks
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListTasksByStatus :many
SELECT * FROM tasks
WHERE user_id = $1 AND status = $2 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: ListTasksByCategory :many
SELECT * FROM tasks
WHERE user_id = $1 AND category = $2 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: ListTasksByStatusAndCategory :many
SELECT * FROM tasks
WHERE user_id = $1 AND status = $2 AND category = $3 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;

-- name: CountTasks :one
SELECT count(*) FROM tasks
WHERE user_id = $1 AND deleted_at IS NULL;

-- name: CountTasksByStatus :one
SELECT count(*) FROM tasks
WHERE user_id = $1 AND status = $2 AND deleted_at IS NULL;

-- name: CountTasksByCategory :one
SELECT count(*) FROM tasks
WHERE user_id = $1 AND category = $2 AND deleted_at IS NULL;

-- name: CountTasksByStatusAndCategory :one
SELECT count(*) FROM tasks
WHERE user_id = $1 AND status = $2 AND category = $3 AND deleted_at IS NULL;

-- name: GetTask :one
SELECT * FROM tasks
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
LIMIT 1;

-- name: CreateTask :one
INSERT INTO tasks (id, user_id, title, description, category, status, external_ref)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateTask :one
UPDATE tasks
SET title = $3,
    description = $4,
    category = $5,
    status = $6,
    external_ref = $7,
    started_at = $8,
    completed_at = $9,
    updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteTask :exec
UPDATE tasks
SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;
