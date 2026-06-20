# Phase 1 MVP TODO

> **整合注記**: [ADR 005](./ADR/005-craft-time-model.md) で再設計済み。Insight/density/severity 削除、
> mode 11値(study追加・review統合)×driver、category 6値、状態機械、計測対象外、停滞は件数主。
> 実装は Stage 1 (`feat/craft-time-model`) → Stage 2 (`feat/ui-simplify`) の2段。

> Phase 1 のゴール: **「同じ作業、前より速くなった?」** に Then vs Now 画面で答えられる状態。
> 詳細は [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) / [ROADMAP.md](./ROADMAP.md) / [ADR/004-pivot-to-growth-sensation.md](./ADR/004-pivot-to-growth-sensation.md) を参照。

## 0. プロジェクト準備

- [x] `backend/` ディレクトリに Go モジュール初期化 (`go mod init`)
- [x] `frontend/` ディレクトリに Vite + React + TS プロジェクト作成
- [x] ルートに `.gitignore` 整備（Go, Node, .env, .DS_Store）
- [x] ルートに `Makefile` (db-up, db-down, migrate, run-api, run-web, fmt, test)
- [x] `docker-compose.yml` (ローカル PostgreSQL 16)
- [x] `.env.example` を backend / frontend それぞれに用意
- [ ] Neon プロジェクト作成 + dev / main ブランチ

## 1. DB / マイグレーション

### 既存 (Walking Skeleton)

- [x] goose 導入
- [x] migration: `00001_create_users.sql`
- [x] migration: `00002_create_tasks.sql`
- [x] migration: `00003_create_work_slices.sql`
- [x] migration: `00004_create_frictions.sql`
- [x] migration: `00005_create_activity_events.sql`

### ADR 004 追加分 (成長実感 MVP へのピボット)

- [ ] migration: `00006_tasks_add_category.sql` (`category` text NOT NULL + CHECK)
- [ ] migration: `00007_work_slices_mode_redefine.sql` (旧9値→新11値の CHECK 置換 + 旧値マッピング)
- [ ] migration: `00008_frictions_add_pattern_tag.sql` (`pattern_tag` 追加 + `kind`→`pattern_tag` 変換)
- [ ] migration: `00009_create_insights.sql` (新規エンティティ)
- [ ] migration: `00010_work_slices_add_density.sql` (`density int` 1〜5)

### sqlc

- [x] sqlc 設定 (`sqlc.yaml`)
- [x] sqlc queries: users, tasks
- [ ] sqlc queries: work_slices, frictions, insights, activity_events

### キー生成 CLI

- [x] `cmd/keygen` で1ユーザー作成 + 生キーを stdout に1度だけ表示

## 2. Backend (Go)

### 基盤

- [x] `cmd/api/main.go` 起動エントリ
- [x] chi router + middleware (request_id / logger / recoverer / auth / cors)
- [x] 設定読み込み（envconfig or 自前）
- [x] DB接続プール (pgxpool)
- [x] 共通エラーレスポンス + エンベロープラッパ
- [x] APIキー認証ミドルウェア
- [ ] レート制限ミドルウェア（メモリ内 token bucket）

### ドメイン層 (`internal/domain/*`、外部依存ゼロ)

- [ ] `domain/task` — entity + `category` / `status` enum + `Valid()` + 状態遷移ルール
- [ ] `domain/workslice` — entity + `mode` enum (11値) + `density` 範囲チェック + start/end ロジック
- [ ] `domain/friction` — entity + `pattern_tag` enum (10値) + `severity` + resolve ロジック
- [ ] `domain/insight` — entity + before/after の長さチェック (新規)
- [ ] `domain/activityevent` — entity (Phase 1 は ingest のみ)

### リポジトリ層 (`internal/repo/*`、interface は service 側に定義)

- [ ] sqlc 生成コードを `internal/repo/` でラップ
- [ ] 各エンティティの Repository 実装 (Tasks/WorkSlices/Frictions/Insights/ActivityEvents/Users)

### サービス層 / Usecase (`internal/service/*`)

- [ ] TaskService — CRUD + `category` + 状態遷移 + `started_at` 自動セット
- [ ] WorkSliceService — start / end (`density` 受領) / list / active / 日次集計
- [ ] FrictionService — CRUD + `pattern_tag` + resolve (`resolved_at` 自動セット)
- [ ] InsightService — CRUD (`after_text` 必須、before は任意) (新規)
- [ ] ActivityEventService — bulk ingest 雛形のみ
- [ ] ReportService — `today` + `then-vs-now` (handler から直接 SQL を書かない)

### HTTPハンドラ (`internal/httpapi/handlers/*`、DTO は domain と分離)

- [ ] Health (`/healthz` / `/readyz`)
- [ ] Me (`/v1/me`)
- [x] Tasks (5 endpoints) — `category` フィルタ/作成/更新対応
- [ ] WorkSlices (6 endpoints) — start/end/active 含む、`density` 受領
- [ ] Frictions (4 endpoints) — `pattern_tag` 必須、resolve
- [ ] **Insights (4 endpoints)** — 新規
- [ ] Reports (2 endpoints) — `today` / `then-vs-now`
- [ ] ActivityEvents (1 endpoint) — bulk ingest

### テスト

- [ ] ドメイン層 unit test (enum `Valid()` / 状態遷移 / density 範囲)
- [ ] Repository層 integration test (Docker postgres)
- [ ] Handler層 e2e test (httptest + 実DB)
- [ ] カバレッジ 80% 以上

## 3. Frontend (React)

### 基盤

- [x] Vite + TypeScript + React 18+
- [x] Tailwind CSS 導入 + DESIGN_CONCEPT のカラートークン
- [x] TanStack Query セットアップ
- [x] APIクライアント (fetch wrapper + APIキー注入 + エラーエンベロープ展開)
- [x] ルーティング
- [ ] エラーバウンダリ + Toast
- [x] DESIGN_CONCEPT に沿ったテーマ (canvas / surface / instrument / parchment ほか)

### 共通コンポーネント

- [x] `components/ui/Card` `Button` `Badge` `KeyCap` `Divider`
- [x] `components/orbit/ActiveSliceBanner` `ModeBar` `StatTile` `FrictionItem` `InsightItem` `ThenVsNowChart` `CategoryTabs`
- [x] `lib/chartTheme.ts` (Recharts のテーマ共通化)

### 画面 (主役は Today + Then vs Now)

- [x] **Today画面** (デフォルト、主役)
  - 進行中 Slice (ActiveSliceBanner)
  - 今日の mode 配分 (ModeBar)
  - StatTile: 今日の Insight 数 / 未解決 Friction 数 / 総時間
- [ ] **Then vs Now画面** (主役) — UI 雛形あり、API 接続待ち
  - CategoryTabs で `category` 選択 (`learning` ほか)
  - 4週分の mode 別時間推移 (ThenVsNowChart, stacked area)
  - Friction `pattern_tag` 別 解決時間の推移 (last_7d_avg vs prev_23d_avg)
  - 今週の Insight リスト
  - データ不足 pattern は「あと N件で表示」(プロダクト原則 4)
- [x] **Tasks画面** (副) — `category` 入力対応の一覧/作成/編集
- [ ] **Frictions モーダル** — 1行記録 + `pattern_tag` 数字キー、未解決リスト + resolve
- [ ] **Insights モーダル** — Friction resolve / Task done 時に促す before/after 1行
- [ ] **Settings画面** — User情報 / APIキー再表示 (マスク + コピー)

### UX 最重要要件 (プロダクト原則 2: 記録は 1キー / 3秒以内)

- [ ] Slice start が **1キーで 3秒以内** (mode 1文字キー: S/B/E/G/I/V/D/A/R/C/O)
- [ ] Slice end が **1キー** + `density` 数字キー (1〜5)
- [ ] Friction 記録が **1キー (例: `f`)** + `pattern_tag` 数字キー
- [ ] Insight 記録が Friction resolve / Task done 時に **自動で促される**
- [ ] Task 選択は最近使った Task 優先

### テスト

- [ ] コンポーネント unit test (vitest + RTL)
- [ ] 主要フローの E2E (Playwright)
  - start → end → Today 画面の mode 配分更新
  - friction 記録 → 未解決リスト → resolve → Insight 化プロンプト
  - Then vs Now で category 切替 → 4週推移描画

## 4. デプロイ / インフラ

- [x] Dockerfile (backend) — multi-stage build, distroless
- [ ] Cloud Run 用 GitHub Actions（main push で自動デプロイ）
- [ ] Cloudflare Pages 設定（frontend、PR preview 有効）
- [ ] Neon プロジェクト + マイグレーション実行ジョブ
- [ ] 環境変数 / Secret Manager 設定
  - `DATABASE_URL`
  - `API_KEY_SALT`
  - `CORS_ORIGIN`
- [ ] 本番ドメイン設定（後回し可、Cloud Run のデフォルト URL でも OK）

## 5. 仕上げ

- [ ] README (起動方法 + APIキー取得方法)
- [ ] 1週間自分で使ってフィードバック
- [ ] バグ修正 / UI 微調整
- [ ] Phase 2 への Issue としてのメモ整理

## Done 条件 (Phase 1 完了の絶対条件)

> 自分が Phase 1 を1週間以上使い続けて、ある `category` (例: `learning`) の Task で、
> `code_explore` 時間が **連続2週で減少** を Then vs Now 画面で観測できた。

- [ ] Slice start/end が 1キーで 3秒以内に打てる
- [ ] Friction 記録が 3秒以内 (1行 + `pattern_tag` 数字キー)
- [ ] Insight 記録が促されるタイミングで自然に出る
- [ ] Then vs Now で `code_explore` の週次推移が見える
- [ ] Then vs Now で `pattern_tag` 別 解決時間の推移が見える
- [ ] 上記の "成長観測" が1回でも発生した
- [ ] 本番デプロイ済み、複数端末からアクセス可能
- [ ] backend カバレッジ 80%+
