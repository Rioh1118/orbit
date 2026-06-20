# Stage 2 — UI/UX 簡素化 方針ブリーフ

**Status**: 実装済み (`feat/ui-simplify`)。§5 の Open Questions は本セッションで解決済み (下記)。
**Branch**: `feat/ui-simplify`
**関連**: [ADR 005](./ADR/005-craft-time-model.md) §10 / [DESIGN_CONCEPT.md](./DESIGN_CONCEPT.md) / [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md)

> このドキュメントは「なぜ Stage 2 をやるのか」と「どの方向に簡素化するか」を固定するためのもの。
> §5 で当初の Open Questions と、その解決 (本セッションの実装方針) を記録する。

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

### 2.2 削る・和らげるもの
- 過剰装飾: radial gradient 背景、glow、影 (inset 1px ハイライトのみ残す)。
- 3書体 (Inter / JetBrains Mono / Source Serif 4) → **2書体** (Serif 撤去)。mono はデータ専用。
- 計器メタファの作り込み (uppercase + tracking の多用) → Inter sentence case に統一。KeyCap は残すが軽量化。

### 2.3 主役に据えるもの
- **状態機械の現在状態**: 常に1つだけ・大きく・誤解なく (`StatusHero`: WORK の `mode×driver` / 計測対象外 /
  作業していない / 確認が必要 を等価重みで)。
- **復帰時確認** (8h 閾値「閉じ忘れ?」) を `StatusHero` の "確認が必要" 状態として磨き込み。
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

## 5. Open Questions (本セッションで解決)
- **書体**: 2書体に確定。Source Serif 4 撤去、Inter + JetBrains Mono。mono はデータ専用、ラベルは Inter。
- **計器メタファ**: uppercase + tracking のラベル装飾をやめ Inter sentence case に。KeyCap は残すが軽量化
  (1キー・3秒の導線として温存、影/濃い面を除去)。
- **背景**: radial gradient は廃止 (単色 canvas)。glow も除去。inset 1px ハイライトのみ残す。
- **狭幅/モバイル**: 専用レイアウトは作らない。WCAG 1.4.10 Reflow を満たす範囲で stat タイル縦積み・
  ヘッダー折返しのみ。
- **既存コンポーネント**: 統合はせず視覚層のみ簡素化。例外として `ActiveSliceBanner` → `StatusHero`
  (全状態を等価重みで提示) に置換。`Button` は未使用のためコントラスト修正のみ。
- **レビュー follow-up**: 別PR (`fix/review-followups`)。本PRは frontend 視覚層のみに限定。tooltip は
  本PRの検証対象に含め、コントラスト改善 (tooltip itemStyle = parchment) も実施。
- **追加方針 (本セッションで合意)**: WCAG 2.2 AA + WAI-ARIA APG を着手コンポーネントに適用
  (focus-visible・`aria-live` ステータス・ネイティブ `<dialog>`・`ErrorText` `role=alert`・コントラスト再検証・
  skip link・1.4.10 Reflow)。

## 6. 進め方 / 検証結果
実装済み。検証:
- `tsc -b` ✓ / `vite build` ✓
- 除去項目の compiled CSS 確認 (Source Serif・radial-gradient・glow = 0、`:focus-visible` outline = 有) ✓
- コントラスト計算 (AA) ✓
- 実ブラウザの目視・axe・キーボード操作は本環境では Playwright ブリッジ不在のため**未実施** — 手元ブラウザでの確認が必要。

（環境注意: node 不調時は `brew reinstall node`。go/pnpm は login shell 経由で PATH。
`pnpm build` は esbuild の build script 未承認で失敗するため
`./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build` で実行する。）
