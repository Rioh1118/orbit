# Orbit - Product Brief

> **整合状態**: コアエンティティ (§4) と Phase 1 スコープ (§5) は [ADR 005](./ADR/005-craft-time-model.md)
> に整合済み。比較単位は `{category × 時間窓}` のグロス、Work Slice は状態機械の「作業区間」、
> Insight は Phase 1 から defer。

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
| **Task** | 1つの作業 item。`category` で種類を分類する (Then vs Now の facet 軸) |
| **作業区間 (Work Slice / `Segment`)** | 連続した能動 craft 時間帯。`mode`×`driver` で「何の作業を誰/何と」を記録。状態機械の「現在ただ1つ」。`type=off` で休憩/会議も同じタイムラインに乗る (計測対象外) |
| **停滞 (Friction)** | 進行が止まったイベント。`pattern_tag` で分類。**件数が主シグナル** (時間として合算しない) |
| **Activity Event** | 将来のローカル Agent 用 (Phase 1 は雛形のみ、UIには出さない) |

> Insight / density / severity は ADR 005 で削除 (defer)。

### 4.1 Task の `category` (固定 enum, 6値)

`category` は1つだけ選ぶ。**Then vs Now の facet 軸**。比較単位は `{category × 時間窓}` のグロス。

| value | 説明 |
|---|---|
| `new_feature` | 新規機能実装 |
| `bug_fix` | バグ修正 |
| `refactor` | リファクタリング |
| `investigation` | 調査・スパイク |
| `support` | サポート・運用作業 |
| `other` | その他 |

> `learning` は「産出物の種類」ではなく「不慣れか否か」の別軸のため削除 (ADR 005)。
> Rails初学のような状況は、`study`+`code_explore` の割合が厚い **mode signature** として
> 自己申告なしに観測する。「同じ category の作業で study/explore の割合が痩せた = 習熟した」。

### 4.2 作業区間の `mode` (11値) × `driver` (3値)

「**今何の craft を、誰/何と**」を1キーで記録する。同 category のグロスで時間配分の推移を見せ、
「`study`+`code_explore` が痩せた」「手実装→AI舵取りへシフトした」を観測する。

**`mode` (11値)** — 何の craft か:

| mode | 説明 | 1キー |
|---|---|---|
| `spec_read` | タスクの仕様・要件の理解 | S |
| `task_breakdown` | やること整理・段取り | B |
| `study` | 外部ドキュメント/RFC/新技術の習得 | Y |
| `code_explore` | 既存コード/変数定義の追跡 | E |
| `design` | 設計 | G |
| `implement` | コード産出 | I |
| `review` | レビュー (driver で自/AI/人を区別) | R |
| `verify` | 手動動作確認・テスト実行 | V |
| `debug` | バグ調査 | D |
| `consult` | 相談・問い合わせ | C |
| `other` | その他 | O |

**`driver` (3値、既定 `solo`)** — 誰/何が駆動したか:

| driver | 例 |
|---|---|
| `solo` | `implement × solo`=手書き / `review × solo`=セルフレビュー |
| `ai` | `implement × ai`=AIに実装させる / `review × ai`=AI出力レビュー / `study × ai` |
| `human` | `review × human`=人とのレビュー / `implement × human`=ペア |

**計測対象外 (`type=off`)**: reason ∈ {`break`, `meeting`, `other`}。
休憩・儀礼的会議など craft でない時間。状態機械の穴を塞ぐためだけに記録し、**分析はしない** (原則6)。
craft の頭を使う協働 (設計議論・ペア・レビュー) は会議扱いせず `mode × driver=human` の作業区間にする。

### 4.3 停滞 (Friction) の `pattern_tag` (固定 enum, 11値)

進行が止まった種類を分類する。グロスで **同種の停滞が減ってきた** を可視化する (件数が主)。

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
| `waiting_ai` | AIの実行待ちでブロック |
| `tool_quirk` | ツールの挙動が謎 |
| `concept_gap` | 概念がそもそも分かっていない |

## 5. Phase 1 スコープ

### 入れるもの (機能4つだけ)

| # | 機能 | 目的 |
|---|---|---|
| 1 | Task CRUD + `category` (6値) | 文脈の単位・比較の facet |
| 2 | 作業区間の状態機械 (単一現在活動) + `mode`×`driver` (1キー記録) + `type=off` (休憩/会議) | 時間内訳・誰と |
| 3 | 停滞 (Friction) 1行記録 + `pattern_tag` (11値) | 停滞のカウント |
| 4 | **Today 画面** + **Then vs Now 画面** (`{category × 時間窓}` グロス) | 即時フィードバック + 成長実感 |

> Insight は ADR 005 で Phase 1 から defer。定量ループが効くと分かってから後付けする。

### 主役: Today 画面

- 現在の作業区間 (どの Task の何の mode × driver か) — **常に1つだけ大きく表示**
- 今日の mode 配分 (バー)
- 未解決 Friction 数

### 主役: Then vs Now 画面

- `category` を選ぶ (例: `new_feature`)
- 4週分の mode 別時間推移のグロス (`study`+`code_explore` が連続2週で減少していれば 🟢)
- 完了タスクあたりの自分時間の推移 (本人の言う「完了時間が下がってていいね」)
- Friction `pattern_tag` 別の件数の推移

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
| Phase 1 | **成長実感 MVP** | Today + Then vs Now (category×時間窓グロス) + Friction pattern + mode×driver 配分 |
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

> 自分が Phase 1 を使い始めて、ある同じ `category` (例: `new_feature`) の Task 群で、
> `study`+`code_explore` の割合が **連続2週で減少** を Then vs Now 画面 (グロス) で観測できた。

これが言えるなら Phase 1 は成功。
言えないなら、画面 UI か mode/driver 定義か pattern_tag リストのどれかがズレている。
