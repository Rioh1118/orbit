# Orbit Directory Structure

Phase 1 (成長実感 MVP) のディレクトリ構成。
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
├── DESIGN_CONCEPT.md           # Observatory ビジュアル言語
├── ADR/
│   ├── 001-cloud-architecture.md
│   ├── 002-go-cloud-run-neon.md
│   ├── 003-local-agent-later.md
│   └── 004-pivot-to-growth-sensation.md
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
│   ├── api/
│   │   └── main.go            # エントリポイント（chi router 起動）
│   └── keygen/
│       └── main.go            # APIキー生成 CLI (1度だけ stdout に表示)
│
├── internal/
│   ├── config/                # 設定読み込み（envconfig）
│   ├── auth/                  # APIキー検証 (hash, lookup)
│   ├── domain/                # ドメイン層 (entity + enum + 不変条件、外部依存ゼロ)
│   │   ├── user/
│   │   ├── task/              # category / status enum
│   │   ├── workslice/         # mode enum (11値) + density
│   │   ├── friction/          # pattern_tag enum (10値) + severity
│   │   ├── insight/           # before / after (新規)
│   │   └── activityevent/
│   ├── service/               # usecase 層 + Repo interface 定義
│   │   ├── task/
│   │   ├── workslice/
│   │   ├── friction/
│   │   ├── insight/
│   │   ├── activityevent/
│   │   └── report/            # today / then-vs-now 集計に集約
│   ├── repo/                  # sqlc 生成コードをラップした Repository 実装
│   ├── httpapi/
│   │   ├── handlers/          # HTTPハンドラ (tasks, slices, frictions, insights, reports, activity)
│   │   │                      # DTO ⇔ domain 変換はここに閉じる
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
    │   ├── 00006_tasks_add_category.sql              # ADR 004
    │   ├── 00007_work_slices_mode_redefine.sql       # ADR 004
    │   ├── 00008_frictions_add_pattern_tag.sql       # ADR 004
    │   ├── 00009_create_insights.sql                 # ADR 004
    │   └── 00010_work_slices_add_density.sql         # ADR 004
    └── queries/               # sqlc 入力（.sql）
        ├── users.sql
        ├── tasks.sql
        ├── work_slices.sql
        ├── frictions.sql
        ├── insights.sql
        └── activity_events.sql
```

### backend のレイヤー責務 (依存方向)

| Layer | 責務 | 依存方向 |
|---|---|---|
| `httpapi/handlers` | DTO ⇔ domain 変換、HTTP I/O | → service |
| `httpapi/middleware` | 認証 / CORS / RequestID | → repo, domain |
| `service` | ユースケース、Repo interface 定義、トランザクション境界 | → domain, repo interface |
| `repo` | DB I/O（sqlc 生成コードを薄くラップ） | → platform/db, domain |
| `domain` | エンティティ、enum、状態遷移、Validate | 依存なし（uuid 等汎用ライブラリ除く） |
| `platform/*` | インフラ（DB接続、ロガー） | 依存なし |

**禁止**: handler が repo を直接呼ぶ / service が DTO を知る / domain が pgx を import する。
集計 (`/v1/reports/*`) は **ReportService に集約**、handler から直接 SQL を書かない。

## frontend/

```
frontend/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts        # DESIGN_CONCEPT のカラートークン / typography
├── postcss.config.js
├── index.html
├── .env.example
│
├── public/                   # 静的アセット
│
└── src/
    ├── main.tsx              # エントリポイント
    ├── App.tsx               # ルーター + Providers
    │
    ├── api/                  # APIクライアント
    │   ├── client.ts         # fetch wrapper + 認証ヘッダ注入
    │   ├── envelope.ts       # レスポンスエンベロープ展開
    │   ├── tasks.ts
    │   ├── slices.ts
    │   ├── frictions.ts
    │   ├── insights.ts
    │   └── reports.ts        # today / then-vs-now
    │
    ├── components/
    │   ├── ui/               # 汎用プリミティブ (DESIGN_CONCEPT 準拠)
    │   │   ├── Card.tsx
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── KeyCap.tsx
    │   │   └── Divider.tsx
    │   └── orbit/            # Orbit 固有のドメイン UI
    │       ├── ActiveSliceBanner.tsx
    │       ├── ModeBar.tsx
    │       ├── StatTile.tsx
    │       ├── FrictionItem.tsx
    │       ├── InsightItem.tsx
    │       ├── ThenVsNowChart.tsx
    │       └── CategoryTabs.tsx
    │
    ├── features/             # 機能単位（縦割り）
    │   ├── tasks/            # category 入力 (副画面)
    │   ├── slices/           # 1キー mode 選択 + density 入力
    │   ├── frictions/        # pattern_tag 数字キー + 未解決リスト + resolve
    │   ├── insights/         # before / after 1行 (Friction resolve / Task done で促す)
    │   ├── today/            # Today 画面ロジック
    │   ├── then-vs-now/      # category 切替 + 4週推移
    │   └── settings/
    │
    ├── hooks/                # 共通カスタムフック
    │
    ├── lib/                  # 純粋ユーティリティ
    │   └── chartTheme.ts     # Recharts のテーマ (DESIGN_CONCEPT 整合)
    │
    ├── pages/                # ルートに対応するページ (薄く保つ)
    │   ├── TodayPage.tsx           # 主役
    │   ├── ThenVsNowPage.tsx       # 主役
    │   ├── TasksPage.tsx           # 副
    │   └── SettingsPage.tsx
    │
    └── styles/
        └── globals.css       # Tailwind directives + DESIGN_CONCEPT トークン
```

### frontend のディレクトリ方針

- `pages/` は **Today / Then vs Now が主役、Tasks / Settings は副**
- Frictions / Insights は独立ページではなく **モーダル**として `features/frictions` `features/insights` に閉じる
- `features/` は **エンティティ + 画面単位の縦割り**（タイプ別ではない）
- `components/ui/` は機能横断の汎用プリミティブだけ (DESIGN_CONCEPT の "Primitives")
- `components/orbit/` は Orbit 固有のドメイン UI (DESIGN_CONCEPT の "Orbit固有")
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
- TS コンポーネント: `PascalCase.tsx`、その他: `camelCase.ts`
- SQL マイグレーション: `00000_snake_case.sql`

## このリポジトリでまだ作らないもの

Phase 1 では以下は作らない:

- `agent/` — Phase 2 のローカル CLI Agent 用ディレクトリ
- `infra/terraform/` — IaC は Cloud Run / Neon コンソール手動で十分（Phase 2 以降）
- `e2e/` — Playwright テストは frontend 内に置く
- AI日報用の prompt / プロバイダ抽象化 — Phase 3
- Loop 検出用の embedding パイプライン — Phase 4
