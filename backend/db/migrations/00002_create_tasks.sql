-- +goose Up
-- +goose StatementBegin
CREATE TABLE tasks (
    id            uuid PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES users(id),
    title         text NOT NULL CHECK (char_length(title) <= 200),
    description   text CHECK (description IS NULL OR char_length(description) <= 5000),
    status        text NOT NULL CHECK (status IN ('open','in_progress','blocked','done','archived')),
    external_ref  text,
    started_at    timestamptz,
    completed_at  timestamptz,
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE INDEX tasks_user_status_idx       ON tasks (user_id, status);
CREATE INDEX tasks_user_created_at_idx   ON tasks (user_id, created_at DESC);
CREATE INDEX tasks_user_active_idx       ON tasks (user_id) WHERE deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS tasks;
-- +goose StatementEnd
