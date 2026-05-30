-- +goose Up
-- +goose StatementBegin
ALTER TABLE frictions ADD COLUMN pattern_tag text;

-- Map deprecated kind values to new pattern_tag values (ADR 004).
UPDATE frictions SET pattern_tag = CASE kind
    WHEN 'spec_unclear'   THEN 'unclear_spec'
    WHEN 'code_not_found' THEN 'cant_find'
    WHEN 'tool_failure'   THEN 'tool_quirk'
    WHEN 'waiting_review' THEN 'waiting_human'
    WHEN 'waiting_answer' THEN 'waiting_human'
    WHEN 'bug_repeat'     THEN 'unexpected_state'
    WHEN 'env_issue'      THEN 'env_setup'
    ELSE 'tool_quirk'
END;

ALTER TABLE frictions
    ALTER COLUMN pattern_tag SET NOT NULL,
    ADD CONSTRAINT frictions_pattern_tag_check CHECK (
        pattern_tag IN (
            'cant_find',
            'unexpected_state',
            'type_mismatch',
            'api_contract',
            'env_setup',
            'flaky_test',
            'unclear_spec',
            'waiting_human',
            'tool_quirk',
            'concept_gap'
        )
    );

-- Drop legacy kind constraint so old enum values no longer block inserts.
ALTER TABLE frictions DROP CONSTRAINT IF EXISTS frictions_kind_check;
ALTER TABLE frictions ALTER COLUMN kind DROP NOT NULL;

DROP INDEX IF EXISTS frictions_user_kind_idx;
CREATE INDEX frictions_user_pattern_tag_idx
    ON frictions (user_id, pattern_tag, created_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS frictions_user_pattern_tag_idx;
ALTER TABLE frictions
    DROP CONSTRAINT IF EXISTS frictions_pattern_tag_check,
    DROP COLUMN IF EXISTS pattern_tag;
ALTER TABLE frictions ALTER COLUMN kind SET NOT NULL;
ALTER TABLE frictions ADD CONSTRAINT frictions_kind_check CHECK (
    kind IN ('spec_unclear','code_not_found','tool_failure','waiting_review','waiting_answer','bug_repeat','env_issue','other')
);
CREATE INDEX frictions_user_kind_idx ON frictions (user_id, kind);
-- +goose StatementEnd
