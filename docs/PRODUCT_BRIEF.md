# Orbit - Product Brief

## 1. プロダクト概要

Orbit は、開発者の **「前より速く解けるようになった瞬間」を見せる装置**。

時間管理ツールでも、作業ログでもない。
記録は手段であり、出力は **過去の自分との差分** だけ。

主役は **Then vs Now** ― 同じ種類の作業 (例: Rails のコードベース理解) に、
今週どれくらい時間がかかったかを、3週前と並べて見せる。

## 2. なぜ作るのか

このアプリの起点は、ある日の上司との会話:

> 「初めて Rails 触ったんですが、だいたいこのくらいで終わる、よりだいぶ時間がかかってる?」
> 「はい、変数を見にいったり既存コードを確認している時間が圧倒的に長いことに気づきました」
> 「じゃあそれ記録するアプリ作れば? 一週間単位とかで成長実感できるかもよ?」

つまり Orbit が答えるべき問いは1つ:

> **「同じ作業、前より速く解けるようになった?」**

人間は記憶で「上手くなった」を感じられない (基準が動くから)。
だから装置で機械的に差分を見せる。

詰まり (Friction) も同じ。「同じパターンに、前は1時間、今は10分で抜け出せた」が見える。

## 3. ターゲットユーザー

- **Phase 1**: 自分 (個人開発者・シングルユーザー)。特に **新しい技術を学んでいる時期** に最大価値が出る
- **Phase 2以降**: 個人開発者、小規模チームのエンジニア

## 4. コアエンティティ

| エンティティ | 役割 |
|---|---|
| **Task** | 1つの作業 item。`category` で種類を分類する (Then vs Now の比較軸) |
| **Work Slice** | Task内の作業セッション。`mode` で「どの種類の作業をしていたか」を記録 |
| **Friction** | 詰まり・停滞。`pattern_tag` で「どの種類の詰まりか」を分類 |
| **Insight** | 「分かった瞬間」の記録。成長の最小単位 |
| **Activity Event** | 将来のローカル Agent 用 (Phase 1 は雛形のみ、UIには出さない) |

### 4.1 Task の `category` (固定 enum, 7値)

`category` は1つだけ選ぶ。**Then vs Now の主軸**として使う。

| value | 説明 |
|---|---|
| `learning` | 新技術・新領域の学習 (Rails初学のような状況) |
| `new_feature` | 新規機能実装 |
| `bug_fix` | バグ修正 |
| `refactor` | リファクタリング |
| `investigation` | 調査・スパイク |
| `support` | サポート・運用作業 |
| `other` | その他 |

### 4.2 Work Slice の `mode` (固定 enum, 11値)

「**今何の種類の作業をしているか**」を1キーで記録する。
時間配分の推移を Then vs Now で見せることで、同 category の Task で
「`code_explore` が短くなった」を観測できる。

| mode | 説明 | 1キー |
|---|---|---|
| `spec_read` | 仕様書・要件確認 | S |
| `task_breakdown` | やること整理・段取り | B |
| `code_explore` | 既存コード/変数定義の追跡 | E |
| `design` | 設計 | G |
| `implement` | コーディング | I |
| `verify` | 手動動作確認・テスト実行 | V |
| `debug` | バグ調査 | D |
| `ai_review` | AI レビュー (Copilot/Claude/ChatGPT) | A |
| `human_review` | 人レビュー (する/される) | R |
| `consult` | 相談・質問 | C |
| `other` | その他 | O |

`code_explore` は注目すべき mode。Rails初学のような状況で、
「他人/過去のコードを読む時間」が時間の大半を占めることが多い。

### 4.3 Friction の `pattern_tag` (固定 enum, 10値)

詰まりの種類を分類する。集計で **同種の詰まりが減ってきた** を可視化できる。

| pattern_tag | 例 |
|---|---|
| `cant_find` | どこに定義があるか分からない |
| `unexpected_state` | null が来るはずないのに来た / 予期せぬ状態 |
| `type_mismatch` | 型が合わない |
| `api_contract` | API が思った通り動かない |
| `env_setup` | ローカルで動かない / 環境問題 |
| `flaky_test` | テストが不安定 |
| `unclear_spec` | 仕様が曖昧 |
| `waiting_human` | 人待ち |
| `tool_quirk` | ツールの挙動が謎 |
| `concept_gap` | 概念がそもそも分かっていない |

### 4.4 Insight (新規)

「分からなかったこと → 分かったこと」を before/after で1行ずつ記録する。
Friction が resolve した瞬間や、Task が done になった瞬間に「Insight 化しますか?」と促される。

これが **成長の最小単位**。週末に並べて読むと、自分の理解が進んだ軌跡が見える。

## 5. Phase 1 スコープ

### 入れるもの (機能5つだけ)

| # | 機能 | 目的 |
|---|---|---|
| 1 | Task CRUD + `category` | 文脈の単位 |
| 2 | Slice start/end + `mode` + `density` (1キー記録) | 時間内訳 |
| 3 | Friction 1行記録 + `pattern_tag` | 詰まりのカウント |
| 4 | Insight 1行記録 (before / after) | 成長の最小単位 |
| 5 | **Today 画面** + **Then vs Now 画面** | 即時フィードバック + 成長実感 |

### 主役: Today 画面

- 進行中 Slice (どの Task の何の mode か)
- 今日の mode 配分 (バー)
- 今日の Insight 数
- 未解決 Friction 数

### 主役: Then vs Now 画面

- `category` を選ぶ (例: `learning`)
- 4週分の mode 別時間推移 (`code_explore` が連続2週で減少していれば 🟢)
- Friction `pattern_tag` 別の解決時間の推移
- 今週の Insight リスト

### 入れないもの (Non-goals)

- マルチユーザー / チーム機能
- ローカル Activity 自動収集 (Phase 2)
- AI日報の自動生成 (Phase 3)
- Loop自動検出・クラスタリング (Phase 4)
- リアルタイム通知
- 外部サービス連携
- **Streak (連続日数) / ランキング** (恒久的に入れない、プロダクト原則3)

## 6. 将来像

| Phase | テーマ | 主要機能 |
|---|---|---|
| Phase 1 | **成長実感 MVP** | Today + Then vs Now + Insight + Friction pattern + Slice mode配分 |
| Phase 2 | ローカル収集 | Go CLI Agent で git branch / app / window を収集、mode 自動推定 |
| Phase 3 | AI日報 | 1日の Slice + Friction + Insight を LLM で要約 |
| Phase 4 | Loop自動検出 + 高度Growth分析 | 詰まりパターンの自動クラスタリング、長期成長グラフ |
| Phase 5 | Captain's Log | 週次/月次のナラティブな振り返り |

## 7. プロダクト原則

1. **過去の自分とだけ比較する**
   他人とのランキングや平均値は出さない。自分の歴史だけが意味を持つ。

2. **記録は1キー**
   入力コストがゼロに近くなければ続かない。3秒で記録できなければ機能を切る。

3. **Streak / 連続日数 / ランキングは入れない**
   それらは「使うこと自体」を目的化させる。
   Orbit は **使った結果、自分の認知が変わったこと** だけを快感の源にする。

4. **N が少ない時は数値を出さない**
   サンプル数が足りないグラフは「あと N件で表示」と表示する。
   ノイズで気持ちよくなることを避ける。

5. **プライバシー第一**
   Activity Event は将来も「ユーザー自身のもの」。AI に送る場合は集約後のサマリのみ。

6. **時間管理ではない**
   工数を計るためのものではない。請求書も出さない。

## 8. Done の定義 (Phase 1)

> 自分が Phase 1 を使い始めて、ある同じ `category` (例: `learning`) の Task で、
> `code_explore` 時間が **連続2週で減少** を Then vs Now 画面で観測できた。

これが言えるなら Phase 1 は成功。
言えないなら、画面 UI か mode 定義か pattern_tag リストのどれかがズレている。
