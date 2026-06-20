# Stage 2 — UI/UX 簡素化 方針ブリーフ

**Status**: ドラフト (方針と WHY のみ。詳細設計は別セッションで詰める)
**Branch**: `feat/ui-simplify`
**関連**: [ADR 005](./ADR/005-craft-time-model.md) §10 / [DESIGN_CONCEPT.md](./DESIGN_CONCEPT.md) / [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md)

> このドキュメントは「なぜ Stage 2 をやるのか」と「どの方向に簡素化するか」を固定するためのもの。
> 具体のコンポーネント設計・トークン調整は別セッションで Open Questions を詰めてから実装する。

---

## 1. なぜ Stage 2 が要るのか (WHY)

### 1.1 起点の不満
現UIは "Observatory" コンセプトで作り込まれている (夜空ダーク + 羊皮紙 + 3書体 + radial gradient + glow + 計器メタファ)。
本人の言葉:

> 「結構デザイン凝ってるけど、普通に使いやすくしたい。今のカラーテーマは気に入ってはいるけど、
> Claude さんの得意なシンプルで使いやすい UI/UX の方が良さそう」

つまり **装飾の作り込み** と **日常的な使いやすさ** がトレードオフになっており、後者を選ぶ。

### 1.2 プロダクト原則との衝突 (本質的な WHY)
簡素化は趣味の問題ではなく、ADR/原則と構造的に衝突しているから必要:

1. **原則2「記録は1キー・3秒」** — glow / gradient / 計器メタファは視覚的な儀式性を生み、
   「3秒で1行」の軽さと逆行する。毎日何度も触る道具に儀式性は摩擦。
2. **状態機械の「誤解ゼロ」要件** (ADR 005 §2) — 「今止まってるはず」の誤解を防ぐ唯一の手は、
   *現在ただ1つの状態* が一目で・大きく・明快に出ること。装飾はこの一点の明快さを薄める。
3. **「ストレスのない UI/UX」** — 観測室の暗さ・低彩度・静謐さは "観測装置" の世界観には合うが、
   操作快適性とは別軸。世界観のために操作性を犠牲にしない。

→ Stage 2 は Observatory の世界観を壊すのではなく、**毎日触る道具として摩擦と誤解を減らす**簡素化。

### 1.3 なぜ「今」(Stage 1 の後) なのか
grill で決めた原則 **「検証してから設計」**。Stage 1 で情報構造 (状態機械・`category×週` グロス) を
**実データで検証済み**にした。Stage 2 はその *検証済みの構造の見せ方* を磨く段階。
偽データのモックに凝った UI を作り込むのは「検証前にデザインに逃げる」罠 (ADR 004/005 が戒めた) で、
今はその罠を抜けている。だから今やるのが正しい順序。

---

## 2. 方針 (direction)

### 2.1 維持するもの
- **カラートークン** (DESIGN_CONCEPT の canvas / surface / instrument / mist / parchment / growth / friction)。
  本人が気に入っている。**色は変えない。**
- プロダクト原則 (過去の自分とだけ比較 / Streak・ランキング無し / N不足は非表示 / 時間管理ではない)。

### 2.2 削る・和らげるもの (候補・詳細は次セッション)
- 過剰装飾: radial gradient 背景、glow、影。
- 3書体 (Inter / JetBrains Mono / Source Serif 4) → Serif は Insight 廃止で出番減。**2書体程度**に整理を検討。
- 計器メタファの作り込み (uppercase + `tracking-instrument` の多用、KeyCap の物理キー表現の重さ 等) を
  日常操作向けに軽量化。

### 2.3 主役に据えるもの
- **状態機械の現在状態**: 常に1つだけ・大きく・誤解なく (WORK の `mode×driver` / 計測対象外 / 作業していない)。
- **復帰時確認** (ActiveSliceCard の 8h 閾値「閉じ忘れ?」) の磨き込み。
- **1キー記録の導線**を最短・最軽に。

---

## 3. スコープ分割 (厳守)
- **今 (Stage 2 視覚層)**: テーマ簡素化・装飾削減・状態機械 UX の明快化。**frontend のみ。ドメイン/API は不変。**
- **やらない (dogfood 後)**: 情報構造・指標の変更 (何を見せるか / 閾値 / タイル構成)。
  `completionSeries` の閾値等は 1〜2週の実使用データを見てから決める。

## 4. Non-goals
- ドメインモデル / API / DB の変更 (Stage 1 の契約)。
- 新機能追加 (Insight 復活など)。
- カラーパレットの刷新。

---

## 5. 次セッションで詰める Open Questions
- 書体は2つに絞るか。どれを残し、Serif をどうするか。
- 計器メタファをどこまで残すか (世界観 vs 操作性のバランス点)。
- 背景: gradient 完全廃止か、ごく薄く残すか。
- 狭幅 / モバイルレイアウトの扱い。
- 既存コンポーネント (Card / Button / Badge / KeyCap / Divider / ModeBar / StatTile / ThenVsNowChart /
  CategoryTabs / ActiveSliceBanner) のどれを簡素化 / 統合するか。
- レビュー follow-up (report index NEW-1/2 / API_DESIGN 例示の scrub / 軽微4点 / tooltip 目視) は
  別PR (`fix/review-followups`) だが、Stage 2 と同時に着手するか別にするか。

## 6. 進め方
別セッションで §5 を詰めてから実装。検証は `tsc -b` + `vite build` + アプリ起動の実画面目視。完了後 PR。
（環境注意: node 不調時は `brew reinstall node`。go/pnpm は login shell 経由で PATH。）
