# Orbit API Design

## Base URL

- Local dev: `http://localhost:8080`
- Production: `https://api.orbit.example.com` (Cloud Run, ドメインは後で確定)

## バージョニング

URLパスでバージョン管理: `/v1/...`

## 認証

### Phase 1: APIキー認証（シングルユーザー）

```
Authorization: Bearer orb_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- キーは `orb_` + ランダム32文字
- DBには **ハッシュのみ** 保存（sha256 + サーバー固定salt or argon2id）
- 起動時にユーザーを seed し、APIキーは初回マイグレーション時に1度だけstdoutに表示
- APIキー紛失時は再生成スクリプトを Phase 1 では CLI として用意

認証ミドルウェアの動き:

1. `Authorization` ヘッダから Bearer トークン取得
2. プレフィックス + ハッシュで users テーブル検索
3. ヒットすればコンテキストに `user_id` を注入

### Phase 2以降

GitHub OAuth を予定（[ROADMAP.md](./ROADMAP.md) 参照）

## レスポンスフォーマット

すべてのレスポンスは共通エンベロープ:

### 成功

```json
{
  "data": { ... },
  "error": null,
  "meta": null
}
```

### リスト（ページネーション付き）

```json
{
  "data": [ ... ],
  "error": null,
  "meta": {
    "total": 123,
    "limit": 50,
    "offset": 0
  }
}
```

### エラー

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "title is required",
    "details": {
      "field": "title"
    }
  },
  "meta": null
}
```

### エラーコード（Phase 1）

| Code | HTTP | 意味 |
|---|---|---|
| `UNAUTHENTICATED` | 401 | APIキー不在/不正 |
| `FORBIDDEN` | 403 | 他ユーザーのリソース |
| `NOT_FOUND` | 404 | リソースなし |
| `VALIDATION_FAILED` | 400 | 入力バリデーション失敗 |
| `CONFLICT` | 409 | 状態遷移エラー（例: 既に終了したsliceをend） |
| `RATE_LIMITED` | 429 | レート制限 |
| `INTERNAL_ERROR` | 500 | サーバーエラー |

## 共通ヘッダ

| Header | 用途 |
|---|---|
| `Authorization` | APIキー |
| `Content-Type: application/json` | リクエストbody |
| `X-Request-ID` | リクエスト追跡用（オプション、未指定ならサーバー生成） |

## エンドポイント一覧 (Phase 1)

### Health

| Method | Path | 認証 | 用途 |
|---|---|---|---|
| GET | `/healthz` | 不要 | Liveness |
| GET | `/readyz` | 不要 | Readiness (DB接続確認) |

### Me

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/me` | 自分のユーザー情報 |

### Tasks

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/tasks` | 一覧 (filter: status, q, limit, offset) |
| POST | `/v1/tasks` | 作成 |
| GET | `/v1/tasks/{id}` | 取得 |
| PATCH | `/v1/tasks/{id}` | 更新 |
| DELETE | `/v1/tasks/{id}` | ソフト削除 |

### Work Slices

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/work-slices` | 一覧 (filter: task_id, mode, from, to, limit, offset) |
| GET | `/v1/work-slices/active` | 現在進行中の slice 一覧 |
| POST | `/v1/work-slices/start` | 開始 (body: mode, task_id?, note?) |
| POST | `/v1/work-slices/{id}/end` | 終了 |
| PATCH | `/v1/work-slices/{id}` | 編集 (mode / note / started_at / ended_at) |
| DELETE | `/v1/work-slices/{id}` | 削除 |

### Frictions

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/frictions` | 一覧 (filter: task_id, work_slice_id, resolved, kind, from, to) |
| POST | `/v1/frictions` | 作成 |
| PATCH | `/v1/frictions/{id}` | 更新（resolve含む） |
| DELETE | `/v1/frictions/{id}` | 削除 |

### Activity Events (Phase 1は雛形のみ)

| Method | Path | 用途 |
|---|---|---|
| POST | `/v1/activity-events` | bulk ingest (将来CLI Agentから送信) |

参照API（list/aggregate）は Phase 2 で追加。

### Reports / Analytics

| Method | Path | 用途 |
|---|---|---|
| GET | `/v1/reports/daily?date=YYYY-MM-DD&tz=Asia/Tokyo` | 日次サマリ |
| GET | `/v1/reports/range?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day\|week&tz=Asia/Tokyo` | 期間集計 |

`tz` を省略した場合は `UTC` で日境界を切る。

## リクエスト例

### POST /v1/tasks

リクエスト:

```json
{
  "title": "Orbit API skeleton",
  "description": "chi + pgx setup",
  "status": "in_progress",
  "external_ref": "https://github.com/riohatta/orbit/issues/1"
}
```

レスポンス:

```json
{
  "data": {
    "id": "018f3a...",
    "title": "Orbit API skeleton",
    "description": "chi + pgx setup",
    "status": "in_progress",
    "external_ref": "https://github.com/riohatta/orbit/issues/1",
    "created_at": "2026-05-30T10:11:12Z",
    "updated_at": "2026-05-30T10:11:12Z"
  },
  "error": null,
  "meta": null
}
```

### POST /v1/work-slices/start

リクエスト:

```json
{
  "mode": "implement",
  "task_id": "018f3a...",
  "note": "API skeleton implementation"
}
```

レスポンス:

```json
{
  "data": {
    "id": "018f3b...",
    "task_id": "018f3a...",
    "mode": "implement",
    "started_at": "2026-05-30T10:00:00Z",
    "ended_at": null,
    "duration_sec": null,
    "note": "API skeleton implementation"
  }
}
```

### POST /v1/work-slices/{id}/end

リクエストbody不要。

レスポンス:

```json
{
  "data": {
    "id": "018f3b...",
    "started_at": "2026-05-30T10:00:00Z",
    "ended_at": "2026-05-30T10:45:00Z",
    "duration_sec": 2700
  }
}
```

エラー例（既に終了している場合）:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "work slice already ended"
  }
}
```

### POST /v1/frictions

リクエスト:

```json
{
  "task_id": "018f3a...",
  "work_slice_id": "018f3b...",
  "kind": "spec_unclear",
  "severity": 2,
  "description": "認証方式の選定で1時間悩んだ"
}
```

### GET /v1/reports/daily?date=2026-05-30&tz=Asia/Tokyo

```json
{
  "data": {
    "date": "2026-05-30",
    "tz": "Asia/Tokyo",
    "total_seconds": 18000,
    "by_mode": {
      "implement": 7200,
      "explore": 3600,
      "spec": 1800,
      "debug": 5400
    },
    "slice_count": 12,
    "friction_count": 4,
    "unresolved_friction_count": 2,
    "tasks": [
      {"id": "018f3a...", "title": "Orbit API skeleton", "seconds": 12600}
    ]
  }
}
```

### POST /v1/activity-events

リクエスト（bulk）:

```json
{
  "events": [
    {
      "occurred_at": "2026-05-30T10:00:00Z",
      "source": "local-agent-mac/0.1.0",
      "event_type": "app.focus",
      "payload": {"app_name": "VSCode", "window_title": "main.go"}
    }
  ]
}
```

レスポンス:

```json
{
  "data": {
    "accepted": 1,
    "rejected": 0
  }
}
```

## レート制限 (Phase 1)

| Endpoint | 制限 |
|---|---|
| `POST /v1/activity-events` | 1000 req/min per user (Phase 2準備) |
| その他 | 300 req/min per user |

超過時: `429` + `Retry-After` ヘッダ

実装方針: Phase 1はメモリ内 token bucket でも可。Phase 2でRedis等に移行。

## CORS

- 許可Origin: `https://app.orbit.example.com` (本番), `http://localhost:5173` (Vite dev)
- 許可Headers: `Authorization`, `Content-Type`, `X-Request-ID`
- 許可Methods: `GET, POST, PATCH, DELETE, OPTIONS`

## バリデーション原則

- 文字列の長さ上限を必ず設定（[DATA_MODEL.md](./DATA_MODEL.md) のカラム制約に従う）
- enum値はサーバー側で厳格チェック
- 不明フィールドは無視（厳格rejectしない）
- 日時は ISO 8601 / RFC 3339 形式のみ受け付ける
- ページネーション: `limit` デフォルト 50, 最大 200
