-- +goose Up
-- +goose StatementBegin
-- ADR 005: 状態機械のガードは opt-in。復帰時確認は常時ON (設定不要・アプリ実装)。
-- 放置検知 / 最大区間長 auto-close はユーザー設定で有効化 + 閾値指定。
CREATE TABLE user_settings (
    user_id              uuid PRIMARY KEY REFERENCES users(id),
    idle_check_enabled   boolean NOT NULL DEFAULT false,
    idle_threshold_min   integer CHECK (idle_threshold_min IS NULL OR idle_threshold_min BETWEEN 1 AND 1440),
    max_segment_enabled  boolean NOT NULL DEFAULT false,
    max_segment_min      integer CHECK (max_segment_min IS NULL OR max_segment_min BETWEEN 1 AND 1440),
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    -- 有効化したら閾値必須
    CHECK (NOT idle_check_enabled  OR idle_threshold_min IS NOT NULL),
    CHECK (NOT max_segment_enabled OR max_segment_min   IS NOT NULL)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_settings;
-- +goose StatementEnd
