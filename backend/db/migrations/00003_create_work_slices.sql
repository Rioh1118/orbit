-- +goose Up
-- +goose StatementBegin
CREATE TABLE work_slices (
    id            uuid PRIMARY KEY,
    user_id       uuid NOT NULL REFERENCES users(id),
    task_id       uuid REFERENCES tasks(id),
    mode          text NOT NULL CHECK (mode IN ('spec','explore','design','implement','test','debug','review','consult','other')),
    started_at    timestamptz NOT NULL,
    ended_at      timestamptz,
    duration_sec  integer,
    note          text CHECK (note IS NULL OR char_length(note) <= 1000),
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX work_slices_user_started_at_idx ON work_slices (user_id, started_at DESC);
CREATE INDEX work_slices_task_started_at_idx ON work_slices (task_id, started_at DESC) WHERE task_id IS NOT NULL;
CREATE INDEX work_slices_user_active_idx     ON work_slices (user_id) WHERE ended_at IS NULL;
CREATE INDEX work_slices_user_mode_idx       ON work_slices (user_id, mode, started_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS work_slices;
-- +goose StatementEnd
