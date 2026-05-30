-- +goose Up
-- +goose StatementBegin
CREATE TABLE activity_events (
    id           uuid PRIMARY KEY,
    user_id      uuid NOT NULL REFERENCES users(id),
    occurred_at  timestamptz NOT NULL,
    received_at  timestamptz NOT NULL DEFAULT now(),
    source       text NOT NULL,
    event_type   text NOT NULL,
    payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activity_events_user_occurred_idx       ON activity_events (user_id, occurred_at DESC);
CREATE INDEX activity_events_user_type_occurred_idx  ON activity_events (user_id, event_type, occurred_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS activity_events;
-- +goose StatementEnd
