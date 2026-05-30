-- +goose Up
-- +goose StatementBegin
ALTER TABLE work_slices
    ADD COLUMN density int CHECK (density IS NULL OR (density BETWEEN 1 AND 5));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE work_slices DROP COLUMN IF EXISTS density;
-- +goose StatementEnd
