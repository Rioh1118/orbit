-- +goose Up
-- +goose StatementBegin
-- ADR 005: 作業区間を WORK / 計測対象外 の直交2層に。mode 11値 (study 追加・review 統合) × driver 3値。
-- density 廃止。単一現在活動の不変条件を partial unique index で DB レベルにも担保。

-- 1. 新カラム
ALTER TABLE work_slices ADD COLUMN type        text NOT NULL DEFAULT 'work';
ALTER TABLE work_slices ADD COLUMN driver      text;
ALTER TABLE work_slices ADD COLUMN off_reason  text;

-- 2. 残データの正規化 (データ移行ではなく CHECK 追加失敗回避のための最小処理)
UPDATE work_slices SET mode = 'review' WHERE mode IN ('ai_review', 'human_review');
UPDATE work_slices SET driver = 'solo' WHERE driver IS NULL;  -- 既存は全て type='work'

-- 3. mode を新 11 値に張り直し (type='off' では mode IS NULL のため列レベル NOT NULL を外す。
--    type='work' 時の mode 必須は下の work_slices_layer_check が担保する)
ALTER TABLE work_slices ALTER COLUMN mode DROP NOT NULL;
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_mode_check;
ALTER TABLE work_slices ADD CONSTRAINT work_slices_mode_check CHECK (
    mode IS NULL OR mode IN (
        'spec_read',
        'task_breakdown',
        'study',
        'code_explore',
        'design',
        'implement',
        'review',
        'verify',
        'debug',
        'consult',
        'other'
    )
);

-- 4. type / driver / off_reason の値域と組合せ不変条件
ALTER TABLE work_slices ADD CONSTRAINT work_slices_type_check
    CHECK (type IN ('work', 'off'));
ALTER TABLE work_slices ADD CONSTRAINT work_slices_driver_check
    CHECK (driver IS NULL OR driver IN ('solo', 'ai', 'human'));
ALTER TABLE work_slices ADD CONSTRAINT work_slices_off_reason_check
    CHECK (off_reason IS NULL OR off_reason IN ('break', 'meeting', 'other'));
ALTER TABLE work_slices ADD CONSTRAINT work_slices_layer_check CHECK (
    (type = 'work' AND mode IS NOT NULL AND driver IS NOT NULL AND off_reason IS NULL)
    OR
    (type = 'off'  AND off_reason IS NOT NULL AND mode IS NULL AND driver IS NULL AND task_id IS NULL)
);

-- 5. density 廃止
ALTER TABLE work_slices DROP COLUMN IF EXISTS density;

-- 6. 単一現在活動: ユーザーあたり開区間 (ended_at IS NULL) は高々1つ
DROP INDEX IF EXISTS work_slices_user_active_idx;
CREATE UNIQUE INDEX work_slices_user_open_uniq
    ON work_slices (user_id) WHERE ended_at IS NULL;

-- 7. グロス集計の主インデックスを type=work に限定
DROP INDEX IF EXISTS work_slices_user_mode_idx;
CREATE INDEX work_slices_user_mode_idx
    ON work_slices (user_id, mode, started_at DESC) WHERE type = 'work';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- 完全可逆ではない (ADR 004 の down と同様)。新制約を先に外し、その後で旧語彙へ正規化する。

-- 1. 新制約をすべて外す (off 行は旧スキーマに概念が無いので削除)
DELETE FROM work_slices WHERE type = 'off';
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_layer_check;
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_off_reason_check;
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_driver_check;
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_type_check;
ALTER TABLE work_slices DROP CONSTRAINT IF EXISTS work_slices_mode_check;

-- 2. 制約が外れた状態で旧語彙へ正規化
UPDATE work_slices SET mode = 'code_explore' WHERE mode = 'study';       -- study の旧等価なし → 近接へ
UPDATE work_slices SET mode = 'human_review' WHERE mode = 'review';      -- review 統合を解く (任意割当)
UPDATE work_slices SET mode = 'other' WHERE mode IS NULL;

-- 3. インデックスを旧形に
DROP INDEX IF EXISTS work_slices_user_mode_idx;
CREATE INDEX work_slices_user_mode_idx ON work_slices (user_id, mode, started_at DESC);
DROP INDEX IF EXISTS work_slices_user_open_uniq;
CREATE INDEX work_slices_user_active_idx ON work_slices (user_id) WHERE ended_at IS NULL;

-- 4. density 復活
ALTER TABLE work_slices ADD COLUMN density int CHECK (density IS NULL OR (density BETWEEN 1 AND 5));

-- 5. 旧 mode CHECK + NOT NULL
ALTER TABLE work_slices ADD CONSTRAINT work_slices_mode_check CHECK (
    mode IN (
        'spec_read', 'task_breakdown', 'code_explore', 'design', 'implement',
        'verify', 'debug', 'ai_review', 'human_review', 'consult', 'other'
    )
);
ALTER TABLE work_slices ALTER COLUMN mode SET NOT NULL;

-- 6. 新カラム削除
ALTER TABLE work_slices DROP COLUMN IF EXISTS off_reason;
ALTER TABLE work_slices DROP COLUMN IF EXISTS driver;
ALTER TABLE work_slices DROP COLUMN IF EXISTS type;
-- +goose StatementEnd
