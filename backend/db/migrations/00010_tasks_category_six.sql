-- +goose Up
-- +goose StatementBegin
-- ADR 005: category を 6 値に (learning 削除 → study+code_explore の mode signature で観測)。
-- データ移行はしない方針 (dev DB 前提)。残データの learning は other に寄せて CHECK 追加が失敗しないようにする。
UPDATE tasks SET category = 'other' WHERE category = 'learning';

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check CHECK (
    category IN (
        'new_feature',
        'bug_fix',
        'refactor',
        'investigation',
        'support',
        'other'
    )
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check CHECK (
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
-- +goose StatementEnd
