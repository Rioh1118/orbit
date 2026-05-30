# Orbit Roadmap

## 全体方針

- 各 Phase は **Done の定義** を必ず持つ
- 次 Phase に進む前に **「自分が毎日使えているか」 + 「成長を実感できているか」** を確認する
- 機能追加より **既存機能の継続利用** を優先する

---

## Phase 1: 成長実感 MVP

**ゴール**: 自分が毎日使い、**Then vs Now で "前より速くなった" を観測できる**。

**期間目安**: 4-6週間

### スコープ

- DBスキーマ: users / tasks (`category` 付) / work_slices (新 `mode` + `density`) / frictions (`pattern_tag`) / insights / activity_events
- Backend API:
  - Task CRUD + `category`
  - WorkSlice start/end + `mode` + `density`
  - Friction CRUD + `pattern_tag`
  - **Insight CRUD (新規)**
  - **Reports: `today` + `then-vs-now`**
- Frontend:
  - **Today 画面** (主役): 進行中 Slice + 今日の mode 配分 + count
  - **Then vs Now 画面** (主役): category 別、4週推移、pattern_tag 別解決時間
  - Tasks 画面 (副): `category` 入力
  - Frictions / Insights モーダル
  - **アプリ内 1キーショートカット**
- 認証: APIキー (シングルユーザー)
- 本番デプロイ: Cloud Run + CF Pages + Neon

### Done の定義 (Phase 1 完了の絶対条件)

> 自分が Phase 1 を1週間以上使い続けて、
> ある `category` (例: `learning`) の Task で、
> `code_explore` 時間が **連続2週で減少** を Then vs Now 画面で観測できた。

これが言えるなら Phase 1 は成功。
言えないなら、画面 UI か `mode` 定義か `pattern_tag` リストのどれかがズレている。

チェックリスト:

- [ ] Slice start/end が 1キーで 3秒以内に打てる
- [ ] Friction 記録が 3秒以内 (1行 + `pattern_tag` 数字キー)
- [ ] Insight 記録が促されるタイミングで自然に出る
- [ ] Then vs Now で `code_explore` の週次推移が見える
- [ ] Then vs Now で `pattern_tag` 別 解決時間の推移が見える
- [ ] 上記の "成長観測" が1回でも発生した

### 入れないもの

- ローカル Activity 自動収集 (Phase 2)
- AI日報 (Phase 3)
- Loop自動検出 (Phase 4)
- マルチユーザー
- 通知
- **Streak / ランキング** (恒久的に入れない、プロダクト原則 3)

---

## Phase 2: ローカル Agent + 自動 Activity 収集

**ゴール**: 手動入力に加えて、自動収集された Activity で「実際の作業」を補強する。

**期間目安**: 4-8週間

### スコープ

- Go CLI Agent (macOS 優先)
  - active app name
  - window title (フィルタ済み)
  - git branch / repo path
- Agent ↔ API の bulk ingest
- `activity_events` の参照 API・集計
- Slice と `activity_events` の自動相関 (最も関連する Slice にひも付け)
- **mode の自動推定候補表示** (ユーザーが確定する)
- Agent 側のプライバシーフィルタ

### Done の定義

- [ ] macOS でバックグラウンド常駐できる
- [ ] 1日の `activity_events` を Slice ごとに紐付けて表示できる
- [ ] mode 推定で「ユーザーが手動修正する回数 < 50%」を達成
- [ ] フィルタ設定が GUI/CLI から可能
- [ ] 1週間運用してプライバシー上の不安がない

---

## Phase 3: AI日報

**ゴール**: 1日の Slice + Friction + Insight + `activity_events` を要約した「日報」を LLM で自動生成。

### スコープ

- 集約サマリ生成 (**生イベントは LLM に送らない**)
- 日報テンプレート (やったこと / 詰まったこと / 明日やること / 今日の Insight)
- 日報の保存・閲覧
- LLM プロバイダ抽象化 (Claude / OpenAI 切替可)

### Done の定義

- [ ] 自分が手動で書いていた日報を置き換えられる
- [ ] 生の window title や URL が LLM に送られないことが確認できる

---

## Phase 4: Loop 自動検出 + 高度 Growth 分析

**ゴール**: `pattern_tag` の再発を自動クラスタリングし、長期成長グラフを可視化。

### スコープ

- Friction `description` の embedding 化 (text-embedding-3-small)
- 同 `pattern_tag` 内のサブクラスタリング (コサイン類似度 ≥ 0.85)
- 3回以上再発した pattern (Loop) の自動検出
- **Loop Cleared 通知** (30日間 再発しなかったら "卒業")
- 月次/四半期サマリ
- "得意になった mode" "苦手な mode" の自動ラベリング

### Done の定義

- [ ] 「3ヶ月前と比べて改善した mode」が一目で分かる
- [ ] 繰り返している Friction Top 5 が見える
- [ ] Loop Cleared が1回でも発火した

---

## Phase 5: Captain's Log

**ゴール**: 週次/月次のナラティブな振り返り (日報より深い、振り返りエッセイ)

### スコープ

- 週次・月次レポート (LLM 生成)
- 自分への問いかけ ("今月、何を学んだ?" "何を諦めるべき?")
- 過去の Captain's Log 検索
- "成長の物語" を時系列で読める

---

## Phase 別の意思決定マイルストーン

| 判断ポイント | Phase 遷移 | 判断内容 |
|---|---|---|
| Phase 1 完了時 | 1→2 | 手動ログ UI で足りているか? "成長観測" が複数回発生したか |
| Phase 2 完了時 | 2→3 | プライバシー設計が固まったか? AI日報に進んで良いか |
| Phase 3 完了時 | 3→4 | データが3ヶ月以上溜まったか? Loop 検出に意味があるか |
| Phase 4 完了時 | 4→5 | データ量・分析が振り返りエッセイのインプットに十分か |

## Non-Goals (将来も含めて)

- チーム機能 / 上司向けレポート (個人ツールに留める)
- 工数管理 / 請求書出力
- 他社プロダクト (Jira/Linear) の完全リプレース
- リアルタイム共有・通知
- モバイルネイティブアプリ (PWA で対応)
- **Streak / 連続日数 / ランキング** (恒久的に入れない、プロダクト原則 3)
