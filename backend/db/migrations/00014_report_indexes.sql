-- +goose Up
-- +goose StatementBegin
-- Indexes for the Then-vs-Now report queries (review H3): avoid seq scans on the
-- completed_at range scan and the work_slices↔tasks JOIN.
CREATE INDEX IF NOT EXISTS tasks_user_category_completed_at_idx
    ON tasks (user_id, category, completed_at DESC)
    WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS work_slices_user_task_started_at_idx
    ON work_slices (user_id, task_id, started_at DESC)
    WHERE type = 'work' AND ended_at IS NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS work_slices_user_task_started_at_idx;
DROP INDEX IF EXISTS tasks_user_category_completed_at_idx;
-- +goose StatementEnd
