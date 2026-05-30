# Orbit Data Model

## 設計原則

- すべてのテーブルに `id` (UUIDv7) と `created_at` `updated_at` (timestamptz UTC)
- すべての主要テーブルに `user_id` を持つ（Phase 1はシングルユーザーだが将来のため）
- `deleted_at` はソフト削除が必要なテーブルのみ
- 時刻は **UTC で保存**、表示はクライアント側でローカル変換
- 拡張フィールドは `metadata jsonb` で逃がす
- enum はDBレベルでは **text + CHECK制約** で表現（追加migrationが楽だから）

## ER (概観)

```
users (1) ──< (N) tasks
users (1) ──< (N) work_slices
users (1) ──< (N) frictions
users (1) ──< (N) activity_events

tasks (1) ──< (N) work_slices       (work_slice.task_id は NULL 可)
tasks (1) ──< (N) frictions          (friction.task_id   は NULL 可)

work_slices (1) ──< (N) frictions    (friction.work_slice_id は NULL 可)
```

## Tables

### `users`

Phase 1はシングルユーザーだが、最初からテーブルとして持つ。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK (UUIDv7) |
| email | text | UNIQUE, NOT NULL |
| display_name | text | |
| api_key_hash | text | NOT NULL, ハッシュのみ保存 |
| api_key_prefix | text | NOT NULL, 例 "orb_xxxx" (識別表示用) |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Phase 1は seed で 1ユーザーを投入。APIキーはマイグレーション時に1回だけstdoutに表示する。

### `tasks`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| title | text | NOT NULL, ≤200 |
| description | text | NULL OK, ≤5000 |
| status | text | enum: `open` / `in_progress` / `blocked` / `done` / `archived` |
| external_ref | text | GitHub Issue URLなど、NULL OK |
| started_at | timestamptz | 最初のSliceで自動セット |
| completed_at | timestamptz | status=done で自動セット |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |
| deleted_at | timestamptz | NULL OK (ソフト削除) |

**インデックス**:

- `(user_id, status)` — ステータス別取得
- `(user_id, created_at DESC)` — 最近のタスク
- `(user_id) WHERE deleted_at IS NULL` の部分インデックス

### `work_slices`

工程単位の作業セッション。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK（タスク未紐付けの作業も許可） |
| mode | text | enum: `spec`/`explore`/`design`/`implement`/`test`/`debug`/`review`/`consult`/`other` |
| started_at | timestamptz | NOT NULL |
| ended_at | timestamptz | NULL = 進行中 |
| duration_sec | int | ended_at セット時に計算してキャッシュ |
| note | text | NULL OK, ≤1000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**制約**:

- `CHECK (ended_at IS NULL OR ended_at >= started_at)`
- 同時に複数のオープン slice が存在しても良い（手動でstop忘れ対策はアプリ側でwarn）

**インデックス**:

- `(user_id, started_at DESC)`
- `(task_id, started_at DESC)` (task_idがNULLでない行のみ、部分インデックス)
- `(user_id) WHERE ended_at IS NULL` — 進行中のslice検索
- `(user_id, mode, started_at DESC)` — 工程別集計

### `frictions`

詰まりの記録。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK |
| work_slice_id | uuid | FK work_slices.id, NULL OK |
| kind | text | enum: `spec_unclear`/`code_not_found`/`tool_failure`/`waiting_review`/`waiting_answer`/`bug_repeat`/`env_issue`/`other` |
| severity | int | 1〜3 (low/med/high), CHECK (severity BETWEEN 1 AND 3) |
| description | text | NOT NULL, ≤2000 |
| resolved_at | timestamptz | NULL = 未解決 |
| resolution_note | text | NULL OK, ≤2000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**インデックス**:

- `(user_id, created_at DESC)`
- `(user_id, kind)` — Friction種別の集計
- `(user_id) WHERE resolved_at IS NULL` — 未解決一覧

### `activity_events`

将来のローカルAgent用イベント。Phase 1ではAPI雛形 + テーブルのみ作る。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| occurred_at | timestamptz | NOT NULL (クライアント時刻) |
| received_at | timestamptz | NOT NULL DEFAULT now() (サーバー受信時刻) |
| source | text | NOT NULL (例: `local-agent-mac/0.1.0`) |
| event_type | text | NOT NULL (例: `app.focus`, `git.branch_switch`, `window.title_change`) |
| payload | jsonb | NOT NULL DEFAULT '{}' (型は event_type 依存) |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**インデックス**:

- `(user_id, occurred_at DESC)`
- `(user_id, event_type, occurred_at DESC)`

**Note**: Phase 2でパーティショニング（月次など）を検討する。Phase 1はテーブル雛形のみ。

## Enum 一覧（参考）

| Enum | 値 |
|---|---|
| `task.status` | `open`, `in_progress`, `blocked`, `done`, `archived` |
| `work_slice.mode` | `spec`, `explore`, `design`, `implement`, `test`, `debug`, `review`, `consult`, `other` |
| `friction.kind` | `spec_unclear`, `code_not_found`, `tool_failure`, `waiting_review`, `waiting_answer`, `bug_repeat`, `env_issue`, `other` |
| `friction.severity` | `1` (low), `2` (med), `3` (high) |

- Goコード側で string constants として定義
- フロントは API レスポンスを正として扱う（enumリストAPIは Phase 1では作らない）

## Migration命名

`goose` を使用。命名規則:

```
backend/db/migrations/00001_create_users.sql
backend/db/migrations/00002_create_tasks.sql
backend/db/migrations/00003_create_work_slices.sql
backend/db/migrations/00004_create_frictions.sql
backend/db/migrations/00005_create_activity_events.sql
backend/db/migrations/00006_seed_default_user.sql
```

各ファイルは `-- +goose Up` / `-- +goose Down` を必ず両方書く。

## DBレベルの不変条件

- `work_slices.duration_sec` は ended_at セット時に **アプリ側** で計算して INSERT/UPDATE
  - Phase 1は trigger を使わずシンプルに保つ
- `tasks.started_at` は最初の work_slice 作成時にアプリ側で set
- ソフト削除は `tasks` のみ。`work_slices` `frictions` `activity_events` は物理削除（Phase 1は管理APIなし）

## UUID生成

- Goアプリ側で UUIDv7 を生成（例: `github.com/google/uuid` の v7サポート）
- DB側のデフォルト関数には依存しない（移植性のため）

## タイムゾーン

- DB保存: `timestamptz` で UTC
- API入出力: ISO 8601 / RFC 3339（タイムゾーン情報付き）
- 表示: クライアントで `Intl.DateTimeFormat` を使ってローカル変換
