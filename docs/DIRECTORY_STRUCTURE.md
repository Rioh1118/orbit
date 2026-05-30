# Orbit Directory Structure

Phase 1 開始時点の推奨ディレクトリ構成。
実装が進むにつれて細部は変わるが、トップレベルは固定。

## ルート

```
orbit/
├── README.md                  # プロジェクト概要 + 起動方法
├── Makefile                   # db-up / migrate / run-api / run-web / test
├── docker-compose.yml         # ローカル PostgreSQL
├── .env.example               # ルートに置く（共通変数の見本）
├── .gitignore
├── docs/                      # ← この計画ドキュメント群
├── backend/                   # Go API (Cloud Run)
└── frontend/                  # React (Cloudflare Pages)
```

## docs/

```
docs/
├── PRODUCT_BRIEF.md
├── ADR/
│   ├── 001-cloud-architecture.md
│   ├── 002-go-cloud-run-neon.md
│   └── 003-local-agent-later.md
├── DATA_MODEL.md
├── API_DESIGN.md
├── ROADMAP.md
├── MVP_TODO.md
├── IMPLEMENTATION_ORDER.md
└── DIRECTORY_STRUCTURE.md     # このファイル
```

## backend/

```
backend/
├── README.md
├── go.mod                     # `go mod init github.com/riohatta/orbit/backend` で生成
├── go.sum
├── Dockerfile                 # multi-stage build (distroless ベース)
├── sqlc.yaml                  # sqlc 設定
├── .env.example
│
├── cmd/
│   └── api/
│       └── main.go            # エントリポイント（chi router 起動）
│
├── internal/
│   ├── config/                # 設定読み込み（envconfig）
│   ├── auth/                  # APIキー検証 (hash, lookup)
│   ├── domain/                # ドメイン層 (entity + 不変条件)
│   │   ├── user/
│   │   ├── task/
│   │   ├── workslice/
│   │   ├── friction/
│   │   └── activityevent/
│   ├── service/               # usecase層 (TaskService, WorkSliceService, ...)
│   ├── repo/                  # sqlc生成コードをラップしたRepository
│   ├── httpapi/
│   │   ├── handlers/          # HTTPハンドラ (tasks, slices, frictions, reports)
│   │   ├── middleware/        # auth, request_id, logger, recoverer, cors, ratelimit
│   │   └── response/          # 共通エンベロープ・エラーレスポンス
│   └── platform/
│       ├── db/                # pgxpool 初期化
│       └── log/               # ロガー（slog）
│
└── db/
    ├── migrations/            # goose .sql ファイル
    │   ├── 00001_create_users.sql
    │   ├── 00002_create_tasks.sql
    │   ├── 00003_create_work_slices.sql
    │   ├── 00004_create_frictions.sql
    │   ├── 00005_create_activity_events.sql
    │   └── 00006_seed_default_user.sql
    └── queries/               # sqlc 入力（.sql）
        ├── users.sql
        ├── tasks.sql
        ├── work_slices.sql
        ├── frictions.sql
        └── activity_events.sql
```

### backend のレイヤー責務

| Layer | 責務 | 依存方向 |
|---|---|---|
| `httpapi/handlers` | HTTPリクエストの解釈、レスポンス整形 | → service |
| `service` | ユースケース（複数repoを束ねる、トランザクション境界） | → repo, domain |
| `repo` | DB I/O（sqlc生成コードを薄くラップ） | → platform/db, domain |
| `domain` | エンティティ、不変条件、状態遷移 | 依存なし（pure） |
| `platform/*` | インフラ（DB接続、ロガー） | 依存なし |

ハンドラはドメインに直接触らず、必ず service を介す。

## frontend/

```
frontend/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .env.example
│
├── public/                    # 静的アセット
│
└── src/
    ├── main.tsx               # エントリポイント
    ├── App.tsx                # ルーター + Providers
    │
    ├── api/                   # APIクライアント
    │   ├── client.ts          # fetch wrapper + 認証ヘッダ注入
    │   ├── envelope.ts        # レスポンスエンベロープ展開
    │   ├── tasks.ts
    │   ├── slices.ts
    │   ├── frictions.ts
    │   └── reports.ts
    │
    ├── components/            # 汎用UI（Button, Modal, Toast, ...）
    │
    ├── features/              # 機能単位（縦割り）
    │   ├── tasks/
    │   │   ├── TaskList.tsx
    │   │   ├── TaskForm.tsx
    │   │   └── hooks.ts
    │   ├── slices/
    │   │   ├── ActiveSlice.tsx
    │   │   ├── ModeSelector.tsx
    │   │   └── hooks.ts
    │   ├── frictions/
    │   ├── reports/
    │   └── settings/
    │
    ├── hooks/                 # 共通カスタムフック
    │
    ├── lib/                   # 純粋ユーティリティ（date, format, ...）
    │
    ├── pages/                 # ルートに対応するページコンポーネント
    │   ├── TodayPage.tsx
    │   ├── TasksPage.tsx
    │   ├── FrictionsPage.tsx
    │   ├── ReportsPage.tsx
    │   └── SettingsPage.tsx
    │
    └── styles/
        └── globals.css        # Tailwind directives
```

### frontend のディレクトリ方針

- `features/` は **エンティティ単位の縦割り**（タイプ別ではない）
- `components/` は機能横断の汎用UIだけ
- `pages/` は薄く、ロジックは `features/` に置く
- グローバル状態管理ライブラリは入れない（TanStack Query + React state で足りるはず）

## ルートに置く設定ファイル（Phase 1 で揃える）

| ファイル | 目的 |
|---|---|
| `Makefile` | 開発コマンドの統一エントリ |
| `docker-compose.yml` | ローカル PostgreSQL 起動 |
| `.env.example` | 必須環境変数の見本 |
| `.gitignore` | Go / Node / .env / .DS_Store |
| `README.md` | プロジェクト概要 + クイックスタート |

## 命名規則

- ディレクトリ: `kebab-case` または `lowercase`
- Go パッケージ: `lowercase`（1単語）
- Go ファイル: `snake_case.go`
- TS ファイル: `PascalCase.tsx`（コンポーネント）, `camelCase.ts`（その他）
- SQL マイグレーション: `00000_snake_case.sql`

## このリポジトリでまだ作らないもの

Phase 1 では以下は作らない:

- `agent/` — Phase 2 のローカル CLI Agent 用ディレクトリ
- `infra/terraform/` — IaC は Cloud Run / Neon コンソール手動で十分（Phase 2以降）
- `e2e/` — Playwright テストは frontend 内に置く
