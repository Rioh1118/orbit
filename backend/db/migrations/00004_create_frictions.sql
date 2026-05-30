-- +goose Up
-- +goose StatementBegin
CREATE TABLE frictions (
    id              uuid PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES users(id),
    task_id         uuid REFERENCES tasks(id),
    work_slice_id   uuid REFERENCES work_slices(id),
    kind            text NOT NULL CHECK (kind IN ('spec_unclear','code_not_found','tool_failure','waiting_review','waiting_answer','bug_repeat','env_issue','other')),
    severity        integer NOT NULL CHECK (severity BETWEEN 1 AND 3),
    description     text NOT NULL CHECK (char_length(description) <= 2000),
    resolved_at     timestamptz,
    resolution_note text CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 2000),
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX frictions_user_created_at_idx ON frictions (user_id, created_at DESC);
CREATE INDEX frictions_user_kind_idx       ON frictions (user_id, kind);
CREATE INDEX frictions_user_unresolved_idx ON frictions (user_id) WHERE resolved_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS frictions;
-- +goose StatementEnd
