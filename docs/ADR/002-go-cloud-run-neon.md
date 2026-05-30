# ADR 002: Backend stack — Go + Cloud Run + Neon PostgreSQL

## Status

Accepted — 2026-05-30

## Context

[ADR 001](./001-cloud-architecture.md) でクラウドWeb構成を決定した。
具体的な技術スタックを確定する必要がある。

要件:

- 個人開発でも保守できる小さなBackend
- Phase 2の Activity Event 大量受信に耐える
- SQLを直接書きたい（ORMマジック禁止）
- DBスキーマ変更を追跡可能にする
- 無料/低コストで運用したい

## Decision

### Backend言語: Go

- ライブラリ: **chi** (HTTPルーター)
- DB driver: **pgx**
- クエリ生成: **sqlc**
- マイグレーション: **goose**

### ランタイム: Google Cloud Run

- コンテナデプロイ
- min-instances=0 で完全従量課金
- リージョン: `asia-northeast1` (Tokyo)

### DB: Neon PostgreSQL

- マネージドPostgres（Serverless）
- branch機能で開発DBを安全に切れる
- リージョン: 可能なら Tokyo、なければ近い US

### Frontend: React + Vite + Cloudflare Pages

- TypeScript
- Tailwind CSS
- TanStack Query (サーバー状態)
- Recharts (チャート)

## Rationale

### なぜ Go か

- 単一バイナリで配布がシンプル
- Cold Start が速い（Cloud Run min=0 と相性が良い）
- 並行処理が標準で書ける（Activity Event の大量ingestを見越して）
- 個人プロジェクトでも長期メンテしやすい型システム

### なぜ chi + pgx + sqlc + goose か

- **chi**: 標準 net/http に薄く、ミドルウェア合成しやすい
- **pgx**: PostgreSQLネイティブ機能（JSONB / UUID）を素直に扱える
- **sqlc**: SQLを書いてGoコードを生成。ORMの不透明さがない
- **goose**: マイグレーションがSQL直書きでレビュー可能

### なぜ Cloud Run か

- リクエスト数が少ない時間帯は完全に停止 → コストゼロ
- HTTPS / オートスケール / Blue-Green デプロイが自動
- Goコンテナと相性が良い（cold startが短い）

### なぜ Neon か

- Serverless Postgres（使った分だけ）
- ブランチ機能で「開発DB / 本番DB」を瞬時に分けられる
- PostgreSQL互換（移行リスクが小さい）

### なぜ Cloudflare Pages か

- 無料枠で十分
- Edge配信で高速
- Vite/Reactと相性が良い

## Consequences

### Positive

- 完全従量課金で個人プロジェクト向けコストが小さい
- SQLが完全に可視（sqlc + goose）
- 将来チーム化してもスケールできる構成

### Negative

- Cloud Run cold start が初回数百msある
- Neon ↔ Cloud Run のリージョン差がレイテンシに影響する場合がある
- sqlcの学習コストが発生する

## Alternatives Considered

| 候補 | 却下理由 |
|---|---|
| Node.js + Express | I/O bound には強いが、Activity Event大量ingestを見越すと Go が安全 |
| Rust + Axum | 学習/保守コストが個人MVPには過大 |
| Fly.io | 良い選択肢だが、Cloud Run無料枠とGCPエコシステムを優先 |
| Supabase | Auth/DB込みで便利だが、Go Backendを置きたかったので不採用 |
| Cloudflare D1 | SQLiteベース、PostgreSQL機能（JSONB等）が使えないので不採用（方針通り） |
| ORM (GORM / Ent) | SQL不透明、複雑なクエリで詰まりやすい |

## Notes

- ローカル開発DBは **Docker PostgreSQL** で立てる（Neonと同一バージョン）
- 環境変数は `.env` (開発) + Cloud Run Secret Manager (本番)
- マイグレーション順序は goose の version番号で厳守
