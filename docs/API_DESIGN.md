# Orbit API Design

> **整合注記**: 本書は ADR 004 時点の定義。[ADR 005](./ADR/005-craft-time-model.md) により Stage 1
> (`feat/craft-time-model`) で更新予定 — `/v1/insights` 廃止、作業区間 API を状態機械 (開始=前を自動close /
> 計測対象外 type=off / driver) に再設計、Then vs Now 集計を `{category × 時間窓}` グロスに、
> `density`/`severity` 廃止、`pattern_tag` に `waiting_ai` 追加。詳細は ADR 005 / DATA_MODEL.md を正とする。

## Base URL

- Local dev: `http://localhost:8080`
- Production: `https://api.orbit.example.com` (Cloud Run、ドメインは後で確定)

## バージョニング

URLパスで管理: `/v1/...`

## 認証

### Phase 1: APIキー認証 (シングルユーザー)

```
Authorization: Bearer orb_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- キーは `orb_` + ランダム32文字
- DB には **ハッシュのみ** 保存 (sha256 + サーバー固定 salt)
- `cmd/keygen -email <email>` でユーザー作成 + APIキー生成、生キーは stdout に1度だけ表示
- APIキー紛失時は `keygen` で再生成

認証ミドルウェアの動き:

1. `Authorization` ヘッダから Bearer トークン取得
2. プレフィックス (12文字) で users テーブル検索
3. ヒットすれば定数時間比較で hash 検証 → コンテキストに `user_id` 注入

### Phase 2以降

GitHub OAuth を予定 ([ROADMAP.md](./ROADMAP.md) 参照)

## レスポンスフォーマット

すべてのレスポンスは共通エンベロープ:

### 成功

```json
{ "data": { ... }, "error": null, "meta": null }
```

### リスト (ページネーション付き)

```json
{
  "data": [ ... ],
  "error": null,
  "meta": { "total": 123, "limit": 50, "offset": 0 }
}
```

### エラー

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "title is required",
    "details": { "field": "title" }
  },
  "meta": null
}
```

### エラーコード (Phase 1)

| Code | HTTP | 意味 |
|---|---|---|
| `UNAUTHENTICATED` | 401 | APIキー不在/不正 |
| `FORBIDDEN` | 403 | 他ユーザーのリソース |
| `NOT_FOUND` | 404 | リソースなし |
| `VALIDATION_FAILED` | 400 | 入力バリデーション失敗 |
| `CONFLICT` | 409 | 状態遷移エラー |
| `RATE_LIMITED` | 429 | レート制限 |
| `INTERNAL_ERROR` | 500 | サーバーエラー |

## 共通ヘッダ

| Header | 用途 |
|---|---|
| `Authorization` | APIキー |
| `Content-Type: application/json` | リクエスト body |
| `X-Request-ID` | リクエスト追跡 (任意) |

## エンドポイント一覧 (Phase 1)

### Health

| Method | Path | 認証 | 用途 |
|---|---|---|---|
| GET | `/healthz` | 不要 | Liveness |
| GET | `/readyz` | 不要 | Readiness (DB ping) |

### Me

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/me` | 自分のユーザー情報 |

### Tasks

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/tasks` | 一覧 (filter: `status`, `category`, `q`, `limit`, `offset`) |
| POST | `/v1/tasks` | 作成 (category 必須) |
| GET | `/v1/tasks/{id}` | 取得 |
| PATCH | `/v1/tasks/{id}` | 更新 (category も変更可) |
| DELETE | `/v1/tasks/{id}` | ソフト削除 |

### Work Slices

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/work-slices` | 一覧 (filter: `task_id`, `mode`, `from`, `to`, `limit`, `offset`) |
| GET | `/v1/work-slices/active` | 開区間一覧 (高々1件) |
| GET | `/v1/work-slices/current` | 現在の開区間 or null |
| POST | `/v1/work-slices/start` | WORK開始 (body: `mode`, `driver?`, `task_id?`, `note?`)。開いていた区間は自動close。二重起動は **409** |
| POST | `/v1/work-slices/start-off` | 計測対象外開始 (body: `reason` = break/meeting/other) |
| POST | `/v1/work-slices/stop` | 現在の区間を閉じる (新規は開かない) |
| POST | `/v1/work-slices/{id}/end` | 指定区間を終了 (body なし) |
| PATCH | `/v1/work-slices/{id}` | 編集 (`mode` / `driver` / `note` / `started_at` / `ended_at`) |
| DELETE | `/v1/work-slices/{id}` | 削除 |

### Frictions

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/frictions` | 一覧 (filter: `task_id`, `work_slice_id`, `pattern_tag`, `resolved`, `from`, `to`) |
| POST | `/v1/frictions` | 作成 (`pattern_tag` 必須) |
| PATCH | `/v1/frictions/{id}` | 更新 (resolve含む) |
| DELETE | `/v1/frictions/{id}` | 削除 |

### Insights (新規)

| Method | Path | 用途 |
|---|---|---|
| — | ~~`/v1/insights*`~~ | **廃止 (ADR 005 で Insight を defer)** — 未実装 |

### Reports / Analytics (再設計)

| Method | Path | 用途 |
|---|---|---|
| — | ~~`/v1/reports/today`~~ | **未実装** — Today は client 側で `/v1/work-slices?from&to` から集計 |
| GET | `/v1/reports/then-vs-now?category=new_feature&weeks=4&tz=Asia/Tokyo` | Then vs Now (category×週グロス)。`category` は6値、不正は400 |

**deprecated** (Phase 1.x で削除):
- `GET /v1/reports/daily` — `today` に統合の方向
- `GET /v1/reports/range` — `then-vs-now` に統合の方向

### Activity Events (Phase 1 は雛形のみ、UI には出さない)

| Method | Path | 用途 |
|---|---|---|
| POST | `/v1/activity-events` | bulk ingest (将来の CLI Agent 用) |

## リクエスト例

### POST /v1/tasks

```json
{
  "title": "Rails: Devise の current_user スコープ理解",
  "description": "別の app_id が混入する原因を追う",
  "category": "learning",
  "status": "in_progress",
  "external_ref": "https://github.com/example/issues/42"
}
```

レスポンス:

```json
{
  "data": {
    "id": "018f3a...",
    "title": "Rails: Devise の current_user スコープ理解",
    "category": "learning",
    "status": "in_progress",
    "description": "...",
    "external_ref": "...",
    "started_at": null,
    "completed_at": null,
    "created_at": "2026-05-30T10:11:12Z",
    "updated_at": "2026-05-30T10:11:12Z"
  },
  "error": null,
  "meta": null
}
```

### POST /v1/work-slices/start

```json
{
  "mode": "code_explore",
  "task_id": "018f3a...",
  "note": "current_user の定義を追跡"
}
```

```json
{
  "data": {
    "id": "018f3b...",
    "task_id": "018f3a...",
    "mode": "code_explore",
    "started_at": "2026-05-30T10:00:00Z",
    "ended_at": null,
    "duration_sec": null,
    "density": null,
    "note": "current_user の定義を追跡"
  }
}
```

### POST /v1/work-slices/{id}/end

```json
{ "density": 4 }
```

```json
{
  "data": {
    "id": "018f3b...",
    "started_at": "2026-05-30T10:00:00Z",
    "ended_at": "2026-05-30T10:45:00Z",
    "duration_sec": 2700,
    "density": 4
  }
}
```

### POST /v1/frictions

```json
{
  "task_id": "018f3a...",
  "work_slice_id": "018f3b...",
  "pattern_tag": "cant_find",
  "severity": 2,
  "description": "Devise の current_user がどこで定義されているか分からない"
}
```

### PATCH /v1/frictions/{id} (resolve)

```json
{
  "resolution_note": "Devise::Controllers::Helpers#current_user で gem 内で定義されていた"
}
```

サーバー側で `resolved_at = now()` を自動セット。

### POST /v1/insights

```json
{
  "task_id": "018f3a...",
  "friction_id": "018f3c...",
  "before_text": "Rails の helper メソッドは app/helpers にしかないと思っていた",
  "after_text": "gem も helper を提供する。Devise::Controllers::Helpers が include されて current_user が生える"
}
```

### GET /v1/reports/today?tz=Asia/Tokyo

```json
{
  "data": {
    "date": "2026-05-30",
    "tz": "Asia/Tokyo",
    "total_seconds": 18000,
    "active_slice": {
      "id": "018f3b...",
      "task_id": "018f3a...",
      "task_title": "Rails: Devise の current_user スコープ理解",
      "mode": "code_explore",
      "started_at": "2026-05-30T10:00:00Z"
    },
    "by_mode": {
      "code_explore": 7200,
      "implement":    4500,
      "spec_read":    1800,
      "debug":        2700,
      "ai_review":    1800
    },
    "slice_count": 12,
    "friction_count": 4,
    "unresolved_friction_count": 2,
    "insight_count": 3
  }
}
```

### GET /v1/reports/then-vs-now?category=learning&weeks=4&tz=Asia/Tokyo

```json
{
  "data": {
    "category": "learning",
    "tz": "Asia/Tokyo",
    "weeks": ["2026-W18", "2026-W19", "2026-W20", "2026-W21"],
    "mode_minutes": {
      "code_explore": [180, 150, 90,  45],
      "spec_read":    [ 45,  30, 25,  20],
      "implement":    [ 60,  75, 80,  90],
      "ai_review":    [ 10,  15, 20,  25],
      "debug":        [ 30,  20, 15,  10]
    },
    "pattern_resolution_minutes": {
      "cant_find":        { "last_7d_avg": 12, "prev_23d_avg": 38, "n_30d": 8, "trend": "improving" },
      "unexpected_state": { "last_7d_avg": 18, "prev_23d_avg": 22, "n_30d": 5, "trend": "flat" },
      "type_mismatch":    { "last_7d_avg":  8, "prev_23d_avg": 18, "n_30d": 6, "trend": "improving" }
    },
    "insights_this_week": [
      {
        "id": "018f3d...",
        "after_text": "Rails の concerns は ActiveSupport::Concern を使えば mixin として使える",
        "created_at": "2026-05-29T14:30:00Z"
      }
    ],
    "insufficient_data_patterns": ["api_contract", "flaky_test"]
  }
}
```

`insufficient_data_patterns` は `n_30d < 3` のため数値を出さなかった pattern_tag リスト。
UI は「あと N件で表示」と出す根拠にする (プロダクト原則 4: N が少ない時は数値を出さない)。

### POST /v1/activity-events (Phase 1 は ingest 雛形のみ)

```json
{
  "events": [
    {
      "occurred_at": "2026-05-30T10:00:00Z",
      "source": "local-agent-mac/0.1.0",
      "event_type": "app.focus",
      "payload": { "app_name": "VSCode", "window_title": "main.go" }
    }
  ]
}
```

## レート制限 (Phase 1)

| Endpoint | 制限 |
|---|---|
| `POST /v1/activity-events` | 1000 req/min per user |
| その他 | 300 req/min per user |

超過時: `429` + `Retry-After` ヘッダ

実装方針: Phase 1 はメモリ内 token bucket。Phase 2 で Redis に移行。

## CORS

- 許可 Origin: `https://app.orbit.example.com` (本番), `http://localhost:5173` (Vite dev)
- 許可 Headers: `Authorization`, `Content-Type`, `X-Request-ID`
- 許可 Methods: `GET, POST, PATCH, DELETE, OPTIONS`

## バリデーション原則

- 文字列長の上限は必ず設定 (DATA_MODEL.md のカラム制約に従う)
- enum 値はサーバー側で厳格チェック (許可リスト外は `VALIDATION_FAILED`)
- 不明フィールドは無視 (厳格 reject しない)
- 日時は ISO 8601 / RFC 3339 形式のみ受け付ける
- ページネーション: `limit` デフォルト 50、最大 200

## DTO 設計原則

- ドメイン型 (`internal/domain/task.Task`) と HTTP DTO (`internal/httpapi/handlers/taskDTO`) は別物
- DB 変更 (列追加など) が API 互換を即破壊しないように DTO 層で吸収する
- DTO ⇔ Domain 変換は handler 内に閉じる (service は domain しか知らない)
- 集計クエリは **ReportService に集約**、handler から直接 SQL を書かない
