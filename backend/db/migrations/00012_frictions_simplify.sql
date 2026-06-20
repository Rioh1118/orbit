-- +goose Up
-- +goose StatementBegin
-- ADR 005: 停滞は件数が主シグナル。pattern_tag に waiting_ai 追加 (11値)。severity / 旧 kind 列を削除。
ALTER TABLE frictions DROP CONSTRAINT IF EXISTS frictions_pattern_tag_check;
ALTER TABLE frictions ADD CONSTRAINT frictions_pattern_tag_check CHECK (
    pattern_tag IN (
        'cant_find',
        'unexpected_state',
        'type_mismatch',
        'api_contract',
        'env_setup',
        'flaky_test',
        'unclear_spec',
        'waiting_human',
        'waiting_ai',
        'tool_quirk',
        'concept_gap'
    )
);

ALTER TABLE frictions DROP COLUMN IF EXISTS severity;
ALTER TABLE frictions DROP COLUMN IF EXISTS kind;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE frictions ADD COLUMN kind text;
ALTER TABLE frictions ADD COLUMN severity integer NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 3);

-- 新値 check を先に外し、旧スキーマに無い waiting_ai を近接へ正規化してから 10値に戻す
ALTER TABLE frictions DROP CONSTRAINT IF EXISTS frictions_pattern_tag_check;
UPDATE frictions SET pattern_tag = 'waiting_human' WHERE pattern_tag = 'waiting_ai';
ALTER TABLE frictions ADD CONSTRAINT frictions_pattern_tag_check CHECK (
    pattern_tag IN (
        'cant_find', 'unexpected_state', 'type_mismatch', 'api_contract', 'env_setup',
        'flaky_test', 'unclear_spec', 'waiting_human', 'tool_quirk', 'concept_gap'
    )
);
-- +goose StatementEnd
