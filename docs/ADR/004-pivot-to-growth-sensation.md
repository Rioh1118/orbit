# ADR 004: コンセプトを「成長実感装置」に再定義する

## Status

Accepted — 2026-05-30

## Context

Orbit は初期 (ADR 001〜003 と PRODUCT_BRIEF v1) では **開発作業ログアプリ** として設計されていた。
Phase 1 の Walking Skeleton と Tasks CRUD まで実装した時点で、コンセプトのズレが顕在化した:

- **ログを取ること** が目的化していた (記録UIが主役)
- **分析が後回し** だった (Phase 1 では軽い集計のみ)
- **成長の可視化が Phase 4 まで遅延** していた
- 「時間管理ではない」と言いながら start/end の時間ベース管理に依存していた
- Friction が **ただのメモ** で、再発検出や認知パターン分析に使えなかった

しかし本来の起点は、ある日の上司との会話だった:

> 「Rails 初めてだけど、だいたい X 時間で終わるよりだいぶ時間がかかってる?」
> 「変数の追跡と既存コード確認に時間が溶けてます」
> 「じゃあそれ記録して、週次で改善が見えれば成長実感できるんじゃない?」

つまりプロダクトが答えるべき問いは **「同じ作業、前より速くなった?」** ただ1つだった。

## Decision

コンセプトを以下のとおり再定義する:

> **Orbit は、開発者の "前より速く解けるようになった瞬間" を見せる装置である。**

これを実装に反映するため、以下の変更を行う:

### 1. 主役画面を 2つに絞る

- **Today 画面**: 今日の mode 配分 + 進行中 Slice + Insight/Friction count
- **Then vs Now 画面**: `category` を選んで、4週分の mode別時間推移と Friction pattern_tag別 解決時間の推移

旧設計の「日次サマリ」「期間集計」は廃止 (将来統合の方向で deprecated)。

### 2. Task に `category` (単一 enum, 7値) を追加

Then vs Now の比較軸として使う。
`learning / new_feature / bug_fix / refactor / investigation / support / other` の固定 enum。
free-form tag は採用しない (表記揺れ防止)。

### 3. Work Slice の `mode` を実例ベース 11値に置換

旧 9値を、上司会話で出た実例に近い形に置換:

`spec_read / task_breakdown / code_explore / design / implement / verify / debug / ai_review / human_review / consult / other`

`code_explore` (= 既存コード/変数定義の追跡) を主役 mode として位置づける。
Slice終了時に `density` (1〜5) を1キーで入力する。

### 4. Friction に `pattern_tag` (固定 enum, 10値) を追加

`cant_find / unexpected_state / type_mismatch / api_contract / env_setup / flaky_test / unclear_spec / waiting_human / tool_quirk / concept_gap`

詰まりを必ず分類することで「同種の詰まりが減ってきた」を集計可能にする。
既存 `kind` 列は段階的廃止。

### 5. Insight エンティティを新規追加

`before` (分からなかったこと) と `after` (分かったこと) を1行ずつ記録する。
Friction resolve 時、Task done 時に「Insight 化しますか?」と促す。

成長の最小単位。週末に並べて読める。

### 6. Phase 順序の組み直し

- Phase 1: 成長実感 MVP (本ADRが追加するすべて)
- Phase 4: Loop自動検出 (旧 Growth Graph を発展)
- 他の Phase (Activity / AI日報 / Captain's Log) は順序維持

### 7. アーキテクチャ原則を明文化

実装の変更容易性を確保するため、以下を docs に明記する (DATA_MODEL.md 末尾参照):

- Domain 層は外部依存ゼロ
- Repo interface は service 側に定義、実装は repo パッケージ (依存逆転)
- enum は Go の `type Foo string` + 定数 + `Valid()` 統一パターン
- API DTO はドメイン型と分離
- 集計は ReportService に集約 (handler から直接 SQL を書かない)

## Consequences

### Positive

- プロダクトが **1つの問いに答える装置** になり、判断軸が明確になる
- 既存実装 (Tasks CRUD, DBスキーマの大半) はそのまま流用できる
- 分析が Phase 1 から入るので、ユーザー (= 開発者本人) が即座に価値を感じられる
- mode を実例ベースにしたことで、入力時の迷いが減る
- pattern_tag があることで、Friction が「ただのメモ」から「集計可能なシグナル」になる
- アーキテクチャ原則が明示されることで、後の機能追加で破綻しにくくなる

### Negative

- 既存の Tasks UI (status select等) は Today + Then vs Now を主役に降格する必要がある
- DB マイグレーション 5本 (`00006〜00010`) が必要
- 開発者本人が `category` と `pattern_tag` を毎回選ぶ手間がある (1キーで吸収する設計が必須)
- N が少ない初期は分析画面が「データ不足」表示になる時期が続く

## Alternatives Considered

### A. "認知状態" 抽象化 (前段で検討、廃案)

`building / searching / synthesizing / stuck / verifying` のような認知状態 enum で再定義する案。

却下理由: 抽象が一段上すぎて、上司会話の「`code_explore` が長い」のような具体的な改善対象が見えにくくなる。
実例ベースの mode の方が、当面の上司シナリオに直接答えられる。

### B. Activity 収集主体案 (前ADR 003で却下、本ADRで再確認)

ローカルマシンから自動収集して mode 推定する案。

却下理由: 入力 UX が洗練されないまま自動化に逃げると、改善のフィードバックループが機能しない。
まず手動で 1キー記録が成立してから自動化する。

### C. Streak / ランキング導入 (検討、廃案)

連続日数や他者との比較を入れる案。

却下理由: それらは「使うこと自体」を目的化させる。
Orbit は **使った結果、自分の認知が変わったこと** だけを快感の源にする (プロダクト原則 3)。

### D. tags[] 自由形式 (検討、廃案)

`tasks.tags TEXT[]` で自由にラベル付けする案。

却下理由: 表記揺れ (`Rails` vs `rails` vs `RoR`) で集計が分散する。
Phase 1 では固定 `category` enum 1つで割り切る。

## 既存 ADR との関係

| ADR | 関係 |
|---|---|
| ADR 001 (クラウドWeb) | 変更なし。本ADRはアーキ判断に影響しない |
| ADR 002 (Go + Cloud Run + Neon) | 変更なし。技術スタック判断に影響しない |
| ADR 003 (ローカルAgent後回し) | **強化される**。本ADRが「手動入力の UX を完成させてから自動化」を再確認 |

## Notes

- DBマイグレーション順序: [DATA_MODEL.md](../DATA_MODEL.md) を参照
- API変更: [API_DESIGN.md](../API_DESIGN.md) を参照
- Phase の組み直し: [ROADMAP.md](../ROADMAP.md) を参照
- 実装プランは本ADR承認後に別途切る (Walking Skeleton はそのまま流用)
