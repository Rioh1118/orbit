# Orbit Roadmap

## 全体方針

- 各Phaseは **Doneの定義** を必ず持つ
- 次Phaseに進む前に **「自分が毎日使えているか」** を確認する
- 機能追加より **既存機能の継続利用** を優先する

---

## Phase 1: 手動ログ MVP

**ゴール**: 自分が毎日 Task / Work Slice / Friction を記録できる。

**期間目安**: 4-6週間

### スコープ

- DBスキーマ確立（users, tasks, work_slices, frictions, activity_events）
- Backend API (CRUD + 日次レポート)
- Frontend (Task一覧 / Slice start-end / Friction記録 / 日次サマリ画面)
- APIキー認証（シングルユーザー）
- Cloud Run + Neon + CF Pages へのデプロイ

### Done の定義

- [ ] 1日10回以上の slice start/end が3秒以内のUI操作でできる
- [ ] 1週間連続で自分が実際に使えた
- [ ] 日次サマリで「今日の工程別時間配分」が見える
- [ ] 本番デプロイされ、複数端末からアクセス可能

### 入れないもの

- ローカルActivity自動収集
- AI日報
- マルチユーザー
- 通知

---

## Phase 2: ローカルAgent + 自動Activity収集

**ゴール**: 手動入力に加えて、自動収集されたActivityで「実際の作業」を補強する。

**期間目安**: 4-8週間

### スコープ

- Go CLI Agent (macOS優先)
  - active app name
  - window title (フィルタ済み)
  - git branch / repo path
- Agent ↔ API のbulk ingest
- activity_events の参照API・集計
- Sliceとactivity_eventsの自動相関（最も関連する slice にひも付け）
- Agent側のプライバシーフィルタ（URLパスや特定アプリ除外）

### Done の定義

- [ ] macOSでバックグラウンド常駐できる
- [ ] 1日のactivity_eventsを slice ごとに紐付けて表示できる
- [ ] フィルタ設定がGUI/CLIから可能
- [ ] 1週間運用してプライバシー上の不安がない

---

## Phase 3: AI日報

**ゴール**: 1日の Slice + Friction + Activity を要約した「日報」をLLMで自動生成。

### スコープ

- 集約サマリ生成（**生イベントは LLM に送らない**）
- 日報テンプレート（やったこと / 詰まったこと / 明日やること）
- 日報の保存・閲覧
- LLMプロバイダ抽象化（Claude / OpenAI 切り替え可能に）

### Done の定義

- [ ] 自分が手動で書いていた日報を置き換えられる
- [ ] 生のwindow titleやURLがLLMに送られないことが確認できる

---

## Phase 4: Growth Graph

**ゴール**: 工程別の習熟度・繰り返しFrictionを可視化。

### スコープ

- 工程別の「同じ種類の作業にかかる時間」推移
- 繰り返し発生するFriction kind の自動検出
- 月次/四半期サマリ
- "得意になった工程" "苦手な工程" の自動ラベリング

### Done の定義

- [ ] 「3ヶ月前と比べてどの工程が速くなったか」が一目で分かる
- [ ] 繰り返している Friction Top 5 が見える

---

## Phase 5: Captain's Log

**ゴール**: 週次/月次のナラティブな振り返り（日報より深い、振り返りエッセイ）

### スコープ

- 週次・月次レポート（LLM生成）
- 自分への問いかけ（"今月、何を学んだ？" "何を諦めるべき？"）
- 過去のCaptain's Log検索
- "成長の物語" を時系列で読める

---

## Phase別の意思決定マイルストーン

| 判断ポイント | Phase遷移 | 判断内容 |
|---|---|---|
| Phase 1完了時 | 1→2 | 手動ログUIで足りているか？ローカル収集の必要性を再確認 |
| Phase 2完了時 | 2→3 | プライバシー設計が固まったか？AI日報に進んで良いか |
| Phase 3完了時 | 3→4 | データが3ヶ月以上溜まったか？Growth Graphに意味があるか |
| Phase 4完了時 | 4→5 | データ量・分析が振り返りエッセイのインプットに十分か |

## Non-Goals (将来も含めて)

- チーム機能 / 上司向けレポート（個人ツールに留める）
- 工数管理 / 請求書出力
- 他社プロダクト（Jira/Linear）の完全リプレース
- リアルタイム共有・通知
- モバイルネイティブアプリ（PWAで対応）
