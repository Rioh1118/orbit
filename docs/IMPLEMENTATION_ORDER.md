# Orbit 実装順序

> **整合注記**: [ADR 005](./ADR/005-craft-time-model.md) により、次の実装は Stage 1 `feat/craft-time-model`
> (migration張り直し + 状態機械 backend + category×時間窓グロス集計 + 最小本物UIで配線 → 1〜2週ドッグフード) →
> Stage 2 `feat/ui-simplify`。詳細プランは ADR 005 承認後に planner/tdd-guide で別途。

> Phase 1 = 成長実感 MVP。
> 詳細スコープと Done 条件は [ROADMAP.md](./ROADMAP.md) / [ADR/004-pivot-to-growth-sensation.md](./ADR/004-pivot-to-growth-sensation.md) を参照。

## 原則

- **動くものを毎週増やす**（Walking Skeleton アプローチ）
- DB から垂直に1機能ずつ通す（Task → Slice → Friction → Insight → Then vs Now の順）
- フロントとバックは **同じエンティティ単位で並行に進める**
- デプロイは早めに通す（Phase 1 の早い段階で本番に出す）
- **Phase 1 のゴールは「自分が Then vs Now を見て成長を1回でも観測すること」**。
  実装順序もこのゴールから逆算する。

## なぜこの順序か

1. **Task が最も独立性が高い** ので最初に通す。`category` も最初から入れる
2. **Work Slice** は Orbit の中核。`mode` (11値) と `density` を最初から固定 enum で入れる
3. **Friction** は Slice と関連付くので3番目。`pattern_tag` (10値) を最初から
4. **Insight** は Friction resolve や Task done を起点にする副次エンティティ
5. **Then vs Now** は他全部が揃ってから (集計の正しさは元データ次第)

## Week 単位の推奨順序

### Week 1: 土台 + Walking Skeleton + Tasks (`category` 付き)

1. **リポジトリ初期化**
   - `backend/`, `frontend/` のスケルトン
   - `docker-compose.yml` で Postgres 起動
   - Makefile 整備
   - `.env.example` 配置

2. **DB 基盤**
   - goose 導入、`users` + `tasks` (+ `category` 列) のマイグレーション
   - sqlc 設定 + tasks の最小 query
   - `cmd/keygen` で初回ユーザー作成 + 生キー stdout

3. **Backend Walking Skeleton**
   - chi + pgxpool で `GET /healthz` `GET /v1/tasks` `POST /v1/tasks` だけ動く
   - APIキー認証ミドルウェア（簡易版）
   - エンベロープラッパ
   - `category` を必須項目として受ける

4. **Frontend Walking Skeleton**
   - Vite + React + TS 起動 + DESIGN_CONCEPT のカラートークン適用
   - `/tasks` で一覧と作成 (`category` セレクト) が動く
   - TanStack Query 経由で API 呼び出し

5. **初回デプロイ**
   - Cloud Run / Cloudflare Pages / Neon を接続
   - 本番 URL で Task CRUD が動くところまで

→ **Week 1 の終わり: 「Task を `category` 付きで作って一覧で見える」が本番で動く**

### Week 2: Work Slice (`mode` 11値 + `density`)

1. `work_slices` マイグレーション (新 `mode` CHECK 11値 + `density` 列)
   - 既に旧 9値で作っている場合は `00007` と `00010` で置換
2. sqlc query + WorkSliceService (start / end / list / active / 日次集計)
3. Handlers (`/v1/work-slices/...` 6 endpoints)
4. **Today 画面 v1**
   - 進行中 Slice (ActiveSliceBanner)
   - 工程選択 = 11 mode (10 + `other`) を **1キー** で打てる UI
   - 終了時に `density` 数字キー (1〜5) で入力
   - 今日の mode 配分バー (ModeBar)

→ **Week 2 の終わり: Slice start/end が 1キー 3秒で本番で打てる**

### Week 3: Friction (`pattern_tag` 10値)

1. `frictions` マイグレーション (`pattern_tag` 追加、旧 `kind` は段階的廃止)
2. sqlc query + FrictionService + Handlers (4 endpoints)
3. Frictions モーダル + 未解決リスト
   - 1行記録 + `pattern_tag` 数字キー
   - Slice との任意リンク
4. Today 画面に未解決 Friction 数 (StatTile)

→ **Week 3 の終わり: Friction を `pattern_tag` 付きで 3秒記録できる**

### Week 4: Insight + Then vs Now の API/集計

1. `insights` マイグレーション + sqlc query + InsightService + Handlers (4 endpoints)
2. Insight モーダル (Friction resolve / Task done で促す)
3. **ReportService**
   - `GET /v1/reports/today` — 進行中 Slice + 今日の mode 配分 + count 群
   - `GET /v1/reports/then-vs-now?category=...&weeks=4&tz=...` —
     - 4週分の mode 別時間 (分)
     - `pattern_tag` 別の解決時間トレンド (last_7d_avg / prev_23d_avg / n_30d / trend)
     - 今週の Insight リスト
     - `n_30d < 3` の pattern は `insufficient_data_patterns` に逃がす (プロダクト原則 4)
4. handler から直接 SQL を書かない (集計は ReportService に集約)

→ **Week 4 の終わり: 集計 API が揃い、Then vs Now を描く土台ができる**

### Week 5: Then vs Now 画面 + UX 仕上げ

1. **Then vs Now 画面** (Phase 1 のもう一つの主役)
   - CategoryTabs で `category` 切替
   - 4週推移の Stacked Area (ThenVsNowChart)
   - `pattern_tag` 別 解決時間カード
   - 今週の Insight リスト
   - データ不足は「あと N件で表示」
2. `activity_events` マイグレーション + `POST /v1/activity-events` (bulk 受信のみ、UI には出さない)
3. レート制限ミドルウェア (メモリ内 token bucket)
4. Settings 画面 (APIキー再表示)
5. UX 最終調整
   - 1キーショートカット網羅 (mode / pattern_tag / friction)
   - 最頻 mode の記憶
   - 最近使った Task の優先表示

→ **Week 5 の終わり: Phase 1 の機能はすべて入り、Then vs Now が描ける**

### Week 6: 自分で使う + バグ取り + 成長観測

1. 1週間連続で自分で使う (実タスクを `learning` カテゴリで投入)
2. 出たバグ・UX 問題を修正
3. **Done 条件の絶対基準を確認**:
   `code_explore` 時間が同 `category` で連続2週で減少する瞬間を観測する
4. README 整備
5. Phase 2 Issue メモを起こす

## 縦割り vs 横割り

**縦割りで実装する**:

各エンティティで **migration → sqlc → service → handler → frontend** をワンサイクルで通す。

「全テーブル作ってから全 API 作って...」は **やらない**。
動かない期間が長くなり、設計の歪みに気付けない。

```
[OK] Week2:   slices migration → sqlc → service → handler → UI → 動く
[NG] Week2:   全部の migration → 全部の sqlc → 全部の service → ...
```

## デプロイは早く

- Week 1 の最後で本番 URL が動くこと
- 「ローカルで動いたら本番で動く」は信用しない
- Cloud Run / Neon / CF Pages の結合は早めにバグを出す

## テストの順序

- ドメイン層 unit test (enum `Valid()` / 状態遷移 / density 範囲) は実装と同時に書く
- Repository integration test は API 実装の直前に書く
- E2E テストは Week 4 以降で OK (早すぎると壊れすぎる)
- 主要フロー:
  - Slice start → end → Today 画面の mode 配分更新
  - Friction 記録 → resolve → Insight 化プロンプト
  - Then vs Now で category 切替 → 4週推移描画

## 危険な後回し NG 項目

以下は **最初から守る**。後で導入は地獄。

- ❌ `user_id` 列を後から追加 → 最初から入れる
- ❌ `tasks.category` を後から追加 → Week 1 で入れる (Then vs Now の主軸)
- ❌ `work_slices.mode` / `frictions.pattern_tag` を free-form tag で始める → 最初から固定 enum
- ❌ ロギング基盤 (request_id 伝搬) を後付け → 最初から入れる
- ❌ マイグレーション管理を「あとで」 → Week 1 で goose 必須
- ❌ エラーレスポンス形式を後で統一 → エンベロープを最初に決める
- ❌ 環境変数管理 → `.env.example` を最初の commit に入れる
- ❌ CORS / Auth / Logging のミドルウェアを後で追加 → Week 1 で入れる
- ❌ Migration の Down を書かない → 必ず両方書く
- ❌ アーキ依存方向 (domain → repo → service → handler) を曖昧にする → 最初から enforce
- ❌ 集計 SQL を handler に書く → ReportService に集約

## 進捗の見える化

- 各 Week 終わりに **「自分が本番 URL で実際に使えたか」** を YES/NO で記録
- Week 6 の Done 条件は **「`code_explore` 連続2週減少を観測できたか」**
- NO が続いたら、設計を疑う前に **UX を疑う**（3秒で記録できているか / `pattern_tag` 選択で迷っていないか）
