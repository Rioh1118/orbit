-- +goose Up
-- +goose StatementBegin
CREATE TABLE users (
    id              uuid PRIMARY KEY,
    email           text NOT NULL UNIQUE,
    display_name    text,
    api_key_hash    text NOT NULL,
    api_key_prefix  text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_api_key_prefix_idx ON users (api_key_prefix);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
