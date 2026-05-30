-- +goose Up
-- +goose StatementBegin
ALTER TABLE tasks
    ADD COLUMN category text;

UPDATE tasks SET category = 'other' WHERE category IS NULL;

ALTER TABLE tasks
    ALTER COLUMN category SET NOT NULL,
    ADD CONSTRAINT tasks_category_check CHECK (
        category IN (
            'learning',
            'new_feature',
            'bug_fix',
            'refactor',
            'investigation',
            'support',
            'other'
        )
    );

CREATE INDEX tasks_user_category_created_at_idx
    ON tasks (user_id, category, created_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS tasks_user_category_created_at_idx;
ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_category_check,
    DROP COLUMN IF EXISTS category;
-- +goose StatementEnd
