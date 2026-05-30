-- +goose Up
-- +goose StatementBegin
-- Map old 9-value mode to new 11-value mode (ADR 004).
UPDATE work_slices SET mode = 'spec_read'    WHERE mode = 'spec';
UPDATE work_slices SET mode = 'code_explore' WHERE mode = 'explore';
UPDATE work_slices SET mode = 'verify'       WHERE mode = 'test';
UPDATE work_slices SET mode = 'human_review' WHERE mode = 'review';

ALTER TABLE work_slices DROP CONSTRAINT work_slices_mode_check;
ALTER TABLE work_slices ADD CONSTRAINT work_slices_mode_check CHECK (
    mode IN (
        'spec_read',
        'task_breakdown',
        'code_explore',
        'design',
        'implement',
        'verify',
        'debug',
        'ai_review',
        'human_review',
        'consult',
        'other'
    )
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Reverse only structural CHECK; data mapping is not perfectly reversible.
UPDATE work_slices SET mode = 'spec'    WHERE mode = 'spec_read';
UPDATE work_slices SET mode = 'explore' WHERE mode = 'code_explore';
UPDATE work_slices SET mode = 'test'    WHERE mode = 'verify';
UPDATE work_slices SET mode = 'review'  WHERE mode = 'human_review';
-- Drop rows that can't map back to old enum (task_breakdown / ai_review).
DELETE FROM work_slices WHERE mode IN ('task_breakdown','ai_review');

ALTER TABLE work_slices DROP CONSTRAINT work_slices_mode_check;
ALTER TABLE work_slices ADD CONSTRAINT work_slices_mode_check CHECK (
    mode IN ('spec','explore','design','implement','test','debug','review','consult','other')
);
-- +goose StatementEnd
