# Orbit Data Model

## 設計原則

- すべてのテーブルに `id` (UUIDv7) と `created_at` `updated_at` (timestamptz UTC)
- すべての主要テーブルに `user_id` を持つ (Phase 1 シングルユーザーだが将来のため)
- `deleted_at` はソフト削除が必要なテーブルのみ
- 時刻は **UTC で保存**、表示はクライアント側でローカル変換
- 拡張フィールドは `metadata jsonb` で逃がす
- enum は DB レベルでは **text + CHECK 制約** で表現 (追加 migration が楽だから)
- **Domain 層は外部依存ゼロ** (Go struct と enum 定数のみ、pgx を import しない)
- **Repo interface は service 側に定義**、実装は repo パッケージに置く (依存逆転)

## ER (概観)

```
users (1) ──< (N) tasks
users (1) ──< (N) work_slices
users (1) ──< (N) frictions
users (1) ──< (N) insights
users (1) ──< (N) activity_events

tasks (1) ──< (N) work_slices       (work_slice.task_id  は NULL 可)
tasks (1) ──< (N) frictions          (friction.task_id    は NULL 可)
tasks (1) ──< (N) insights           (insight.task_id     は NULL 可)

work_slices (1) ──< (N) frictions    (friction.work_slice_id は NULL 可)
frictions   (1) ──< (N) insights     (insight.friction_id    は NULL 可)
```

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK (UUIDv7) |
| email | text | UNIQUE, NOT NULL |
| display_name | text | |
| api_key_hash | text | NOT NULL, ハッシュのみ保存 |
| api_key_prefix | text | NOT NULL, 例 `orb_xxxx` (識別表示用) |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

Phase 1 は `cmd/keygen -email <email>` で1ユーザー作成、生キーは stdout に1度だけ表示。

### `tasks`

`category` は Then vs Now の主軸。**1 Task = 1 category**。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| title | text | NOT NULL, ≤200 |
| description | text | NULL OK, ≤5000 |
| **category** | **text** | **NOT NULL CHECK (...) — 後述7値** |
| status | text | enum: `open` / `in_progress` / `blocked` / `done` / `archived` |
| external_ref | text | GitHub Issue URL等、NULL OK |
| started_at | timestamptz | 最初の Slice で自動セット |
| completed_at | timestamptz | status=done で自動セット |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |
| deleted_at | timestamptz | NULL OK (ソフト削除) |

**`category` enum** (固定7値、free-form tag は採用しない):

| value | 説明 |
|---|---|
| `learning` | 新技術・新領域の学習 |
| `new_feature` | 新規機能実装 |
| `bug_fix` | バグ修正 |
| `refactor` | リファクタリング |
| `investigation` | 調査・スパイク |
| `support` | サポート・運用作業 |
| `other` | その他 |

**インデックス**:
- `(user_id, category, created_at DESC)` — Then vs Now の主クエリ
- `(user_id, status)` — ステータス別取得
- `(user_id) WHERE deleted_at IS NULL` 部分インデックス

### `work_slices`

作業セッション。**mode は実例ベース 11値**。終了時に `density` を1キーで入力。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK |
| **mode** | **text** | **NOT NULL CHECK (...) — 後述11値** |
| started_at | timestamptz | NOT NULL |
| ended_at | timestamptz | NULL = 進行中 |
| duration_sec | int | ended_at セット時にアプリ側で計算 |
| **density** | **int** | **NULL OK, CHECK (density BETWEEN 1 AND 5)** Slice終了時1キー入力 |
| note | text | NULL OK, ≤1000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**`mode` enum** (固定11値):

| value | 説明 | 1キー |
|---|---|---|
| `spec_read` | 仕様書・要件確認 | S |
| `task_breakdown` | やること整理・段取り | B |
| `code_explore` | 既存コード/変数定義の追跡 | E |
| `design` | 設計 | G |
| `implement` | コーディング | I |
| `verify` | 手動動作確認・テスト実行 | V |
| `debug` | バグ調査 | D |
| `ai_review` | AI レビュー | A |
| `human_review` | 人レビュー (する/される) | R |
| `consult` | 相談・質問 | C |
| `other` | その他 | O |

**旧 mode 値からのマッピング** (migration 00007 で使用):

| 旧 (9値) | 新 (11値) |
|---|---|
| `spec` | `spec_read` |
| `explore` | `code_explore` |
| `design` | `design` |
| `implement` | `implement` |
| `test` | `verify` |
| `debug` | `debug` |
| `review` | `human_review` |
| `consult` | `consult` |
| `other` | `other` |

**制約**:
- `CHECK (ended_at IS NULL OR ended_at >= started_at)`
- 同時に複数のオープン Slice 可 (手動 stop 忘れはアプリ側で warn)

**インデックス**:
- `(user_id, started_at DESC)`
- `(task_id, started_at DESC)` 部分インデックス (task_id IS NOT NULL)
- `(user_id) WHERE ended_at IS NULL` — 進行中検索
- `(user_id, mode, started_at DESC)` — Then vs Now の主クエリ

### `frictions`

詰まりの記録。**`pattern_tag` を追加**。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK |
| work_slice_id | uuid | FK work_slices.id, NULL OK |
| ~~kind~~ | ~~text~~ | **deprecated**: pattern_tag に統合、Phase 1.x で DROP COLUMN |
| **pattern_tag** | **text** | **NOT NULL CHECK (...) — 後述10値** |
| severity | int | CHECK (severity BETWEEN 1 AND 3), DEFAULT 1 |
| description | text | NOT NULL, ≤2000 |
| resolved_at | timestamptz | NULL = 未解決 |
| resolution_note | text | NULL OK, ≤2000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**`pattern_tag` enum** (固定10値):

| value | 例 |
|---|---|
| `cant_find` | どこに定義があるか分からない |
| `unexpected_state` | null が来るはずないのに来た / 予期せぬ状態 |
| `type_mismatch` | 型が合わない |
| `api_contract` | API が思った通り動かない |
| `env_setup` | ローカルで動かない / 環境問題 |
| `flaky_test` | テストが不安定 |
| `unclear_spec` | 仕様が曖昧 |
| `waiting_human` | 人待ち |
| `tool_quirk` | ツールの挙動が謎 |
| `concept_gap` | 概念がそもそも分かっていない |

**旧 kind 値からのマッピング** (migration 00008 で使用):

| 旧 kind | 新 pattern_tag |
|---|---|
| `spec_unclear` | `unclear_spec` |
| `code_not_found` | `cant_find` |
| `tool_failure` | `tool_quirk` |
| `waiting_review` | `waiting_human` |
| `waiting_answer` | `waiting_human` |
| `bug_repeat` | `unexpected_state` |
| `env_issue` | `env_setup` |
| `other` | `tool_quirk` (fallback) |

**インデックス**:
- `(user_id, created_at DESC)`
- `(user_id, pattern_tag, created_at DESC)` — pattern別集計の主クエリ
- `(user_id) WHERE resolved_at IS NULL` — 未解決一覧

### `insights` (新規)

「分からなかったこと」と「分かったこと」を before/after で記録する。**成長の最小単位**。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK |
| friction_id | uuid | FK frictions.id, NULL OK |
| before_text | text | NULL OK, ≤1000 — 分からなかったこと |
| after_text | text | NOT NULL, ≤1000 — 分かったこと |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**インデックス**:
- `(user_id, created_at DESC)` — 一覧 + density 集計
- `(task_id)` 部分インデックス (task_id IS NOT NULL)
- `(friction_id)` 部分インデックス (friction_id IS NOT NULL)

### `activity_events`

将来のローカル Agent 用。**Phase 1 では雛形のみ、UI には出さない**。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| occurred_at | timestamptz | NOT NULL (クライアント時刻) |
| received_at | timestamptz | NOT NULL DEFAULT now() (サーバー時刻) |
| source | text | NOT NULL (例: `local-agent-mac/0.1.0`) |
| event_type | text | NOT NULL (例: `app.focus`, `git.branch_switch`) |
| payload | jsonb | NOT NULL DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |

Phase 2 でパーティショニング (月次) を検討。

## Enum 一覧 (Single Source of Truth)

| Enum | 値 (個数) |
|---|---|
| `task.category` | `learning`, `new_feature`, `bug_fix`, `refactor`, `investigation`, `support`, `other` (7) |
| `task.status` | `open`, `in_progress`, `blocked`, `done`, `archived` (5) |
| `work_slice.mode` | `spec_read`, `task_breakdown`, `code_explore`, `design`, `implement`, `verify`, `debug`, `ai_review`, `human_review`, `consult`, `other` (11) |
| `friction.pattern_tag` | `cant_find`, `unexpected_state`, `type_mismatch`, `api_contract`, `env_setup`, `flaky_test`, `unclear_spec`, `waiting_human`, `tool_quirk`, `concept_gap` (10) |
| `friction.severity` | `1` (low), `2` (med), `3` (high) |

- Go コード側で `type Foo string` + 定数 + `Valid()` メソッドの統一パターン
- フロントは API レスポンスを正として扱う (enum一覧 API は Phase 1 では作らない)

## Migration 命名

`goose` を使用。命名規則:

```
backend/db/migrations/
├── 00001_create_users.sql              (既存)
├── 00002_create_tasks.sql              (既存)
├── 00003_create_work_slices.sql        (既存)
├── 00004_create_frictions.sql          (既存)
├── 00005_create_activity_events.sql    (既存)
├── 00006_tasks_add_category.sql        (ADR 004で追加)
├── 00007_work_slices_mode_redefine.sql (ADR 004 — CHECK 制約置換 + 旧値マッピング)
├── 00008_frictions_add_pattern_tag.sql (ADR 004 — pattern_tag追加 + kind→pattern_tag変換)
├── 00009_create_insights.sql           (ADR 004 — 新規)
└── 00010_work_slices_add_density.sql   (ADR 004 — density列追加)
```

各ファイルは `-- +goose Up` / `-- +goose Down` を必ず両方書く。

## DBレベルの不変条件

- `work_slices.duration_sec` は ended_at セット時にアプリ側で計算して INSERT/UPDATE
- `tasks.started_at` は最初の work_slice 作成時にアプリ側で set
- ソフト削除は `tasks` のみ
- `frictions.kind` 列は migration 00008 以降 deprecated。Go/sqlcから参照を消し、Phase 1.x で DROP COLUMN する

## アーキテクチャ原則 (実装で守るべき依存方向)

| Layer | 責務 | 依存方向 |
|---|---|---|
| `domain/*` | エンティティ、enum、状態遷移、Validate | 依存なし (uuid 等汎用ライブラリ除く) |
| `repo/*` (実装) | DB I/O (sqlcgen ラップ) | → domain |
| `service/*` (interface定義含む) | ユースケース | → domain, repo interface |
| `httpapi/handlers/*` | DTO ⇔ domain 変換、HTTP I/O | → service |
| `httpapi/middleware/*` | 認証 / CORS / RequestID | → repo, domain |

**禁止**: handler が repo を直接呼ぶ。service が DTO を知る。domain が pgx を import する。

**Repo interface の置き場所**:
service パッケージに `type TaskRepo interface { ... }` を定義し、
repo パッケージで `*RepoImpl` がそれを実装する。
これにより service の単体テストが mock で完結する。

集計クエリ (`/v1/reports/...`) は **ReportService に集約**。handler から直接 SQL を書かない。

## UUID 生成

- Go アプリ側で UUIDv7 を生成 (`github.com/google/uuid` v1.6+ の `NewV7()`)
- DB 側のデフォルト関数には依存しない (移植性のため)

## タイムゾーン

- DB保存: `timestamptz` で UTC
- API 入出力: ISO 8601 / RFC 3339 (タイムゾーン情報付き)
- 表示: クライアントで `Intl.DateTimeFormat` を使ってローカル変換
- Then vs Now の "週" 境界はクライアントのタイムゾーンで切る (`tz` クエリパラメタを受ける)
