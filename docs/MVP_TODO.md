# Phase 1 MVP TODO

## 0. プロジェクト準備

- [ ] `backend/` ディレクトリに Go モジュール初期化 (`go mod init`)
- [ ] `frontend/` ディレクトリに Vite + React + TS プロジェクト作成
- [ ] ルートに `.gitignore` 整備（Go, Node, .env, .DS_Store）
- [ ] ルートに `Makefile` (db-up, db-down, migrate, run-api, run-web, fmt, test)
- [ ] `docker-compose.yml` (ローカル PostgreSQL 16)
- [ ] `.env.example` を backend / frontend それぞれに用意
- [ ] Neon プロジェクト作成 + dev / main ブランチ

## 1. DB / マイグレーション

- [ ] goose 導入
- [ ] migration: `00001_create_users.sql`
- [ ] migration: `00002_create_tasks.sql`
- [ ] migration: `00003_create_work_slices.sql`
- [ ] migration: `00004_create_frictions.sql`
- [ ] migration: `00005_create_activity_events.sql`
- [ ] migration: `00006_seed_default_user.sql`（APIキー生成 + stdout表示）
- [ ] sqlc設定 (`sqlc.yaml`)
- [ ] sqlc queries: users, tasks, work_slices, frictions, activity_events

## 2. Backend (Go)

### 基盤

- [ ] `cmd/api/main.go` 起動エントリ
- [ ] chi router + middleware (request_id / logger / recoverer / auth / cors)
- [ ] 設定読み込み（envconfig or 自前）
- [ ] DB接続プール (pgxpool)
- [ ] 共通エラーレスポンス + エンベロープラッパ
- [ ] APIキー認証ミドルウェア
- [ ] レート制限ミドルウェア（メモリ内token bucket）

### ドメイン層

- [ ] `internal/domain/task` (Task entity + 状態遷移ルール)
- [ ] `internal/domain/workslice` (Slice entity + start/end ロジック)
- [ ] `internal/domain/friction`
- [ ] `internal/domain/activityevent`

### リポジトリ層

- [ ] sqlc 生成コードを `internal/repo/` でラップ
- [ ] 各エンティティの Repository interface + 実装

### サービス層 / Usecase

- [ ] TaskService (CRUD + 状態遷移)
- [ ] WorkSliceService (start, end, list, daily aggregate)
- [ ] FrictionService (CRUD + resolve)
- [ ] ActivityEventService (bulk ingest 雛形)
- [ ] ReportService (daily / range集計)

### HTTPハンドラ

- [ ] Health (healthz / readyz)
- [ ] Me handler
- [ ] Tasks handler (5 endpoints)
- [ ] WorkSlices handler (6 endpoints)
- [ ] Frictions handler (4 endpoints)
- [ ] ActivityEvents handler (1 endpoint)
- [ ] Reports handler (2 endpoints)

### テスト

- [ ] ドメイン層 unit test (状態遷移)
- [ ] Repository層 integration test (Docker postgres)
- [ ] Handler層 e2e test (httptest + 実DB)
- [ ] カバレッジ 80%以上

## 3. Frontend (React)

### 基盤

- [ ] Vite + TypeScript + React 18+
- [ ] Tailwind CSS導入
- [ ] TanStack Query セットアップ
- [ ] APIクライアント (fetch wrapper + APIキー注入 + エラーエンベロープ展開)
- [ ] ルーティング (TanStack Router or React Router)
- [ ] エラーバウンダリ + Toast
- [ ] ダークモード対応（最低限）

### 画面

- [ ] **Today画面** (デフォルト)
  - 進行中のSlice表示
  - 工程選択 + start ボタン
  - end ボタン
  - 本日のSlice一覧 + 工程別集計
- [ ] **Tasks画面**
  - 一覧 (status filter)
  - 新規作成モーダル
  - 編集モーダル
- [ ] **Frictions画面**
  - 未解決リスト（強調表示）
  - 履歴一覧
  - 新規記録モーダル + resolve操作
- [ ] **Reports画面**
  - 日付ピッカー
  - by_mode 円グラフ (recharts)
  - tasks内訳テーブル
  - 期間レポート（週次）
- [ ] **Settings画面**
  - User情報
  - APIキーの再表示（マスク + コピー）

### UX最重要要件

- [ ] Slice start が「**1クリック**」で打てる（最頻 mode を覚える）
- [ ] Slice end も「**1クリック**」
- [ ] Friction記録のホットキー（例: `f`）
- [ ] Task選択は最近使ったTask優先

### テスト

- [ ] コンポーネント unit test (vitest + RTL)
- [ ] 主要フローのE2E (Playwright)
  - start → end → daily report の表示
  - friction 記録 → 未解決 → resolve

## 4. デプロイ / インフラ

- [ ] Dockerfile (backend) — multi-stage build, distroless
- [ ] Cloud Run 用 GitHub Actions（main push で自動デプロイ）
- [ ] Cloudflare Pages 設定（frontend、PR preview有効）
- [ ] Neon プロジェクト + マイグレーション実行ジョブ
- [ ] 環境変数 / Secret Manager 設定
  - `DATABASE_URL`
  - `API_KEY_SALT`
  - `CORS_ORIGIN`
- [ ] 本番ドメイン設定（後回し可、Cloud Run のデフォルトURLでもOK）

## 5. 仕上げ

- [ ] README (起動方法 + APIキー取得方法)
- [ ] 1週間自分で使ってフィードバック
- [ ] バグ修正 / UI微調整
- [ ] Phase 2 への Issue としてのメモ整理

## Done条件（再掲）

- [ ] 1日10+回のslice start/endが3秒以内で打てる
- [ ] 1週間連続使用に耐えた
- [ ] 日次サマリで工程配分が見える
- [ ] 本番デプロイ済み、複数端末からアクセス可能
- [ ] backend カバレッジ 80%+
