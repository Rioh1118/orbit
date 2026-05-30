# Orbit 実装順序

## 原則

- **動くものを毎週増やす**（Walking Skeletonアプローチ）
- DBから垂直に1機能ずつ通す（Task → Slice → Friction → Report の順）
- フロントとバックは **同じエンティティ単位で並行に進める**
- デプロイは早めに通す（Phase 1 の早い段階で本番に出す）

## なぜこの順序か

1. **Task が最も独立性が高い** ので最初に通す
2. **Work Slice** は Orbit の中核機能。Task が動いてから着手
3. **Friction** は Slice と関連付くので3番目
4. **Reports** は他全部が動いてから

## Week 単位の推奨順序

### Week 1: 土台 + Walking Skeleton

1. **リポジトリ初期化**
   - `backend/`, `frontend/` のスケルトン
   - `docker-compose.yml` でPostgres起動
   - Makefile 整備
   - `.env.example` 配置

2. **DB基盤**
   - goose 導入、`users` + `tasks` のmigration
   - sqlc 設定 + tasks の最小query

3. **Backend Walking Skeleton**
   - chi + pgxpool で `GET /healthz` `GET /v1/tasks` `POST /v1/tasks` だけ動く
   - APIキー認証ミドルウェア（簡易版）
   - エンベロープラッパ

4. **Frontend Walking Skeleton**
   - Vite + React + TS 起動
   - `/tasks` ページで一覧と作成だけ動く
   - TanStack Query 経由でAPI呼び出し

5. **初回デプロイ**
   - Cloud Run / Cloudflare Pages / Neon を接続
   - 本番URLで Task CRUD が動くところまで

→ **Week 1の終わりで「タスク作成と一覧」だけが本番で動く状態**

### Week 2: Work Slice

1. `work_slices` テーブル + sqlc query
2. WorkSliceService (start / end / list / active)
3. Handlers (`/v1/work-slices/...`)
4. Today画面（現在進行中slice + start/endボタン）
5. 工程選択UI（プリセット8工程 + `other`）

→ **Week 2の終わりで「Slice start/end」が本番で打てる**

### Week 3: Friction

1. `frictions` テーブル + sqlc
2. FrictionService + Handlers
3. Frictions画面 + 記録モーダル + 未解決リスト
4. Friction ↔ Slice の任意リンク
5. Today画面に未解決Friction表示

→ **Week 3の終わりで「3エンティティ全部CRUDできる」**

### Week 4: Reports

1. ReportService (daily / range集計)
2. `/v1/reports/daily` `/v1/reports/range`
3. Reports画面 (Recharts で by_mode 円グラフ、taskごとの内訳)
4. Today画面の集計表示も整える

→ **Week 4の終わりで「日次サマリが見える」**

### Week 5: Activity Event 雛形 + 仕上げ

1. `activity_events` テーブル
2. `POST /v1/activity-events` (bulk受信のみ、参照APIなし)
3. レート制限ミドルウェア
4. Settings画面（APIキー再表示）
5. UX最終調整（ホットキー、最頻mode記憶など）

→ **Week 5の終わりで「Phase 1の機能はすべて入った状態」**

### Week 6: 自分で使う + バグ取り

1. 1週間連続で自分で使う
2. 出たバグ・UX問題を修正
3. README整備
4. Phase 2 Issueメモを起こす

## 縦割り vs 横割り

**縦割りで実装する**:

各エンティティで **migration → sqlc → service → handler → frontend** をワンサイクルで通す。

「全テーブル作ってから全API作って...」は **やらない**。
動かない期間が長くなり、設計の歪みに気付けない。

```
[OK] Week2:   slices migration → sqlc → service → handler → UI → 動く
[NG] Week2:   全部のmigration → 全部のsqlc → 全部のservice → ...
```

## デプロイは早く

- Week 1の最後で本番URLが動くこと
- 「ローカルで動いたら本番で動く」は信用しない
- Cloud Run / Neon / CF Pages の結合は早めにバグを出す

## テストの順序

- ドメイン層 unit test は実装と同時に書く
- Repository integration test は API実装の直前に書く
- E2Eテストは Week 4 以降でOK（早すぎると壊れすぎる）

## 危険な後回しNG項目

以下は **最初から守る**。後で導入は地獄。

- ❌ `user_id` 列を後から追加 → 最初から入れる
- ❌ ロギング基盤 (request_id伝搬) を後付け → 最初から入れる
- ❌ マイグレーション管理を「あとで」 → 最初の Week 1 で goose 必須
- ❌ エラーレスポンス形式を後で統一 → エンベロープを最初に決める
- ❌ 環境変数管理 → `.env.example` を最初の commit に入れる
- ❌ CORS / Auth / Logging のミドルウェアを後で追加 → Week 1 で入れる
- ❌ Migration の Down を書かない → 必ず両方書く

## 進捗の見える化

- 各 Week 終わりに **「自分が本番URLで実際に使えたか」** を YES/NO で記録
- NO が続いたら、設計を疑う前に **UX を疑う**（3秒で記録できているか）
