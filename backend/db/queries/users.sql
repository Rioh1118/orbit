-- name: GetUserByAPIKeyPrefix :one
SELECT * FROM users WHERE api_key_prefix = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (id, email, display_name, api_key_hash, api_key_prefix)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateAPIKey :one
UPDATE users
SET api_key_hash = $2, api_key_prefix = $3, updated_at = now()
WHERE id = $1
RETURNING *;
