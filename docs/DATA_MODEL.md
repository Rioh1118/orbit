# Orbit Data Model

> **整合状態**: 本書は [ADR 005](./ADR/005-craft-time-model.md) に整合済み。
> ADR 004 由来の旧定義 (category 7値 / mode に ai_review·human_review / density / severity / Insight /
> 複数オープン区間) は ADR 005 で上書きされている。

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
users (1) ──< (N) work_slices        (作業区間 Segment。type=work / off の直交2層)
users (1) ──< (N) frictions          (停滞)
users (1) ──< (N) activity_events

tasks (1) ──< (N) work_slices       (work_slice.task_id  は NULL 可)
tasks (1) ──< (N) frictions          (friction.task_id    は NULL 可)

work_slices (1) ──< (N) frictions    (friction.work_slice_id は NULL 可)
```

> `insights` は ADR 005 で削除 (defer)。Insight / density / severity / friction.kind は持たない。

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

`category` は Then vs Now の **facet 軸**。**1 Task = 1 category**。
比較単位は `{category × 時間窓}` のグロス (ADR 005)。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| title | text | NOT NULL, ≤200 |
| description | text | NULL OK, ≤5000 |
| **category** | **text** | **NOT NULL CHECK (...) — 後述6値** |
| status | text | enum: `open` / `in_progress` / `blocked` / `done` / `archived` |
| external_ref | text | GitHub Issue URL等、NULL OK |
| started_at | timestamptz | 最初の Slice で自動セット |
| completed_at | timestamptz | status=done で自動セット |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |
| deleted_at | timestamptz | NULL OK (ソフト削除) |

**`category` enum** (固定6値、free-form tag は採用しない):

| value | 説明 |
|---|---|
| `new_feature` | 新規機能実装 |
| `bug_fix` | バグ修正 |
| `refactor` | リファクタリング |
| `investigation` | 調査・スパイク |
| `support` | サポート・運用作業 |
| `other` | その他 |

> `learning` は産出物の種類ではなく「不慣れか否か」の別軸のため category から削除 (ADR 005)。
> 学習は mode signature (`study`+`code_explore` の割合が厚い) として観測する。

**インデックス**:
- `(user_id, category, created_at DESC)` — Then vs Now (category facet グロス) の主クエリ
- `(user_id, category, completed_at DESC) WHERE completed_at IS NOT NULL` — 完了タスク時間 report (00014, H3)
- `(user_id, status)` — ステータス別取得
- `(user_id) WHERE deleted_at IS NULL` 部分インデックス

### `work_slices` (= 作業区間 Segment)

タイムラインの一区間。**WORK / 計測対象外 の直交2層**を `type` で表す (ADR 005)。
WORK 区間のみ `mode`×`driver` を持ち成長集計に入る。density は廃止。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK (WORK のみ) |
| **type** | **text** | **NOT NULL CHECK (type IN ('work','off'))** |
| **mode** | **text** | **NULL OK (type='work' の時 NOT NULL) CHECK (...) — 後述11値** |
| **driver** | **text** | **NULL OK (type='work' の時 NOT NULL) CHECK (driver IN ('solo','ai','human')) DEFAULT 'solo'** |
| **off_reason** | **text** | **NULL OK (type='off' の時 NOT NULL) CHECK (off_reason IN ('break','meeting','other'))** |
| started_at | timestamptz | NOT NULL |
| ended_at | timestamptz | NULL = 進行中 (高々1つ。下記不変条件) |
| duration_sec | int | ended_at セット時にアプリ側で計算 |
| note | text | NULL OK, ≤1000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

**`mode` enum** (固定11値、`type='work'` の時のみ):

| value | 説明 | 1キー |
|---|---|---|
| `spec_read` | タスクの仕様・要件の理解 | S |
| `task_breakdown` | やること整理・段取り | B |
| `study` | 外部ドキュメント/RFC/新技術の習得 | Y |
| `code_explore` | 既存コード/変数定義の追跡 | E |
| `design` | 設計 | G |
| `implement` | コード産出 | I |
| `review` | レビュー (driver で自/AI/人を区別) | R |
| `verify` | 手動動作確認・テスト実行 | V |
| `debug` | バグ調査 | D |
| `consult` | 相談・問い合わせ | C |
| `other` | その他 | O |

> ADR 005 変更点: `study` 追加 / `ai_review`+`human_review` → `review` に統合 (driver で区別)。

**`driver` enum** (固定3値、`type='work'` の時のみ、既定 `solo`):

| value | 意味 | 例 |
|---|---|---|
| `solo` | 自分の手 | `implement × solo` = 手書き / `review × solo` = セルフレビュー |
| `ai` | AIが駆動、自分は舵取り/レビュー | `implement × ai` / `review × ai` = AI出力レビュー / `study × ai` |
| `human` | 他者と | `review × human` = 人とのコードレビュー / `implement × human` = ペア |

**`off_reason` enum** (固定3値、`type='off'` の時のみ。**成長集計から除外・分析しない**):

| value | 意味 |
|---|---|
| `break` | 休憩・離席 |
| `meeting` | 儀礼的/coordination 会議 (craft の頭を使う協働は WORK の `× human` で記録) |
| `other` | その他の計測対象外時間 |

**制約・不変条件** (ADR 005 状態機械):
- `CHECK (ended_at IS NULL OR ended_at >= started_at)`
- **ユーザーあたり `ended_at IS NULL` の区間は高々1つ** (単一現在活動)。
  新しい区間を開く時、アプリ側で前の開区間を自動 close する。
- `type='work'` ⇒ `mode`/`driver` NOT NULL、`off_reason` NULL。
  `type='off'` ⇒ `off_reason` NOT NULL、`mode`/`driver`/`task_id` NULL。
- 旧データ移行は行わない (ADR 005、dev データのみ)。

**インデックス**:
- `(user_id, started_at DESC)`
- `(task_id, started_at DESC)` 部分インデックス (task_id IS NOT NULL)
- `(user_id) WHERE ended_at IS NULL` **UNIQUE** (`work_slices_user_open_uniq`) — 単一現在活動の DB backstop (C1)
- `(user_id, mode, started_at DESC) WHERE type = 'work'` — Today/グロス集計の主クエリ
- `(user_id, task_id, started_at DESC) WHERE type = 'work' AND ended_at IS NOT NULL` — report JOIN (00014, H3)

### `frictions` (= 停滞)

進行が止まったイベント。`pattern_tag` で分類。**件数が主シグナル**、解決ラグは任意の副シグナル。
**時間として mode と合算しない** (区間タイムラインに重なる別レンズ。二重計上を禁止 — ADR 005)。

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK users.id, NOT NULL |
| task_id | uuid | FK tasks.id, NULL OK |
| work_slice_id | uuid | FK work_slices.id, NULL OK |
| **pattern_tag** | **text** | **NOT NULL CHECK (...) — 後述11値** |
| description | text | NOT NULL, ≤2000 |
| resolved_at | timestamptz | NULL = 未解決 (任意。強制しない) |
| resolution_note | text | NULL OK, ≤2000 |
| metadata | jsonb | DEFAULT '{}' |
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |

> ADR 005 変更点: `severity` 削除 / 旧 `kind` 列削除 / `waiting_ai` 追加。

**`pattern_tag` enum** (固定11値):

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
| `waiting_ai` | AIの実行待ちでブロック |
| `tool_quirk` | ツールの挙動が謎 |
| `concept_gap` | 概念がそもそも分かっていない |

**インデックス**:
- `(user_id, created_at DESC)`
- `(user_id, pattern_tag, created_at DESC)` — pattern別グロス件数の主クエリ
- `(user_id) WHERE resolved_at IS NULL` — 未解決一覧

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
| `task.category` | `new_feature`, `bug_fix`, `refactor`, `investigation`, `support`, `other` (6) |
| `task.status` | `open`, `in_progress`, `blocked`, `done`, `archived` (5) |
| `work_slice.type` | `work`, `off` (2) |
| `work_slice.mode` | `spec_read`, `task_breakdown`, `study`, `code_explore`, `design`, `implement`, `review`, `verify`, `debug`, `consult`, `other` (11) |
| `work_slice.driver` | `solo`, `ai`, `human` (3) |
| `work_slice.off_reason` | `break`, `meeting`, `other` (3) |
| `friction.pattern_tag` | `cant_find`, `unexpected_state`, `type_mismatch`, `api_contract`, `env_setup`, `flaky_test`, `unclear_spec`, `waiting_human`, `waiting_ai`, `tool_quirk`, `concept_gap` (11) |

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
├── 00006_tasks_add_category.sql        (ADR 004)
├── 00007_work_slices_mode_redefine.sql (ADR 004)
├── 00008_work_slices_add_density.sql   (ADR 004 — 実在順)
├── 00009_frictions_add_pattern_tag.sql (ADR 004 — 実在順)
└── 00010+ ...                          (ADR 005 — 下記)
```

**ADR 005 で追加する migration (00010 以降、データ移行なし)**:
- `tasks` category CHECK を 6 値に張り直し (`learning` 削除)
- `work_slices` に `type` / `driver` / `off_reason` 列追加、`mode` CHECK を 11値 (`study` 追加・review 統合) に張り直し、`density` 列 DROP
- `frictions` `pattern_tag` CHECK を 11値 (`waiting_ai` 追加) に張り直し、`severity`・`kind` 列 DROP
- `user_settings` (idle検知 有無+閾値 / 最大区間長 有無+閾値) の追加 — 状態機械の opt-in ガード用
  (**Phase 1 では migration のみ・Go 未配線 = deferred**。常時ONの復帰確認は client 側 `ActiveSliceCard` に実装)
- `00014_report_indexes` (review H3): `tasks (user_id, category, completed_at DESC) WHERE completed_at IS NOT NULL` /
  `work_slices (user_id, task_id, started_at DESC) WHERE type='work' AND ended_at IS NOT NULL`

> ADR 004 の docs では 00009=insights / 00010=density を予定していたが、実在の migration は
> 00008=density / 00009=pattern_tag で、insights は作られなかった。本書は実在順に整合済み。

各ファイルは `-- +goose Up` / `-- +goose Down` を必ず両方書く。

## DBレベルの不変条件

- `work_slices.duration_sec` は ended_at セット時にアプリ側で計算して INSERT/UPDATE
- **ユーザーあたり `ended_at IS NULL` の work_slice は高々1つ** (単一現在活動)。新区間を開く時に
  前の開区間をアプリ側で自動 close する。復帰時に異常に長い開区間があれば確認 (常時ON)。
- `tasks.started_at` は最初の work_slice (type='work') 作成時にアプリ側で set
- ソフト削除は `tasks` のみ
- `frictions` は時間として集計しない (件数が主シグナル)。mode 時間との二重計上を禁止する

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
