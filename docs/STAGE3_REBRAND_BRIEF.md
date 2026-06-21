# Stage 3 — Frontend Rebrand 方針ブリーフ

**Status**: 計画中 / レビュー反映済 (`feat/rebrand-front-design`) — 実装は §10 のスタック PR 戦略で進める
**Branch**: `feat/rebrand-front-design`
**関連**: [DESIGN_CONCEPT.md](./DESIGN_CONCEPT.md) / [STAGE2_UI_BRIEF.md](./STAGE2_UI_BRIEF.md) / `sample/` (Natours 教材)

> このドキュメントは「なぜ Stage 3 をやるのか」「どのデザイン方向に振り直すか」を固定するためのもの。
> Stage 2 で構造を簡素化し WCAG AA を担保した上で、Stage 3 は **見た目とインタラクションの質感**を刷新する。
> Stage 3 の本丸 (PR A, §10.2) は **機能追加ゼロ**の純ビジュアル / マイクロインタラクション差替。
> ただし §7.12 (Tasks) / §7.9 (ThenVsNow) の構造再設計は**挙動変更を含む**ため、純ビジュアル PR とは
> 別の feat PR (PR B / PR C, §10.3-10.4) に分離する。「機能追加ゼロ」は PR A の性格であって Stage 3 全体の
> 性格ではない — この区別を曖昧にしない。

---

## 1. なぜ Stage 3 が要るのか (WHY)

### 1.1 起点

Cloud Pages で運用開始済みの Orbit を実使用していて、次の二点が引っかかっている:

1. **ダーク "Observatory" の世界観は美しいが、銀行アプリのような「業務道具としての信頼感」と相性が弱い**。
   毎日業務時間に開く道具としては、もう一段クリーンで明るく、計器より「白い帳簿」の温度が欲しい。
2. **UI のマイクロインタラクション (ボタン押下感、ラジオ選択、フォーム入力フィードバック、初期描画) が
   実装簡素なまま止まっており、所有感が弱い**。`sample/` (Natours 教材) の純 CSS で組まれた hover lift、
   radio reveal、`moveInBottom` 等の質感を Orbit に持ち込みたい。

### 1.2 方向

| 軸 | Stage 2 まで | Stage 3 で目指す |
|---|---|---|
| 基調 | ダーク (`#213448` canvas) | **ライト** — 白〜オフホワイト基調 (りそな銀行ライクなクリーン) |
| 主要色 | 計器ネイビー + 羊皮紙 | **深いネイビー + クリーングリーン**のアクセント |
| 質感 | フラット / 静的 | **CSS keyframes + ::after グロー + translateY lift** で触ったときに動く |
| 装飾 | 抑制 (Stage 2 で削減済) | **抑制を維持** しつつ動きの質を上げる |
| 静謐さ | 観測室の暗さで担保 | **白の余白と弱い影**で担保 (彩度はむしろさらに抑える) |

### 1.3 Stage 2 原則との関係

Stage 2 で固めた次は **撤回しない**:

- WCAG 2.2 AA (4.5:1 通常 / 3:1 大型・UI border / focus 3:1)
- WAI-ARIA APG (focus-visible、ネイティブ `<dialog>`、`aria-live`)
- 状態機械の現在状態が単一・等価重み・大きく出る
- 装飾削減 (radial gradient なし、glow なし、3 書体目なし、mono uppercase 計器ラベルなし)

Stage 3 で **追加で守る**:

- 「3 秒で 1 行」の手触り — アニメは 200〜500ms 内に収束、入力導線を絶対に遅延させない
- アニメは"情報"を持つ場合のみ (状態変化、初期描画、フォーカス) — 純装飾アニメは入れない
- `prefers-reduced-motion: reduce` で keyframe アニメは無効化、transition は短縮

> 装飾の質を上げるが、装飾**量**は増やさない。Stage 2 の規律と矛盾しない。

### 1.4 なぜ「今」やるのか

- Stage 2 で構造 / アクセシビリティ / 状態機械の見え方が**安定済み** → 視覚層だけを単独で差し替えて
  回帰が起こる範囲が限定される
- 機能 (Tasks / Slices / Friction) の API 形が固まっており、機能追加と競合しない
- 運用開始済みなので、本人が毎日触って「この温度感は違う」と感じている今のうちに揃える方が、
  半年後にデザイン負債として戻ってくるより安い

---

## 2. デザインコンセプト — "Clean Ledger" (清浄な帳簿)

Observatory コンセプトを差し替えるのではなく、**もう一つの視座**として並べる:

- 観測室 (Observatory) = 一日を振り返るときの世界観 (ダーク・計器・羊皮紙)
- 帳簿 (Ledger) = 業務時間中に書き込むときの世界観 (ライト・余白・薄い罫線)

Stage 3 は後者へ視座を寄せる。両立 (テーマ切替) は今回スコープ外。**Ledger のみ**。

### 2.1 Mood

| 軸 | 意味 |
|---|---|
| 白の余白 | 主役は記録、UI は引く |
| 静かな信頼 | 銀行帳票のような落ち着き — ネイビー + 控えめなグリーン |
| 触ると動く | 押下・選択・初期描画で「触れた手応え」が返る (sample 流儀) |
| 数値の精度 | 等幅は維持 (JetBrains Mono) — 数字の桁揃えは Ledger の生命線 |
| 規律 | 罫線・余白・整列が世界観を担う。色数とアニメ量は最小 |

### 2.2 Observatory との対比

| | Observatory (Stage 2) | Ledger (Stage 3) |
|---|---|---|
| 場 | 観測室 | 執務机 |
| 主役 | 計器盤 | 紙とペン |
| 主色 | 夜空ネイビー (背景) | 真夜中ネイビー (前景・CTA) |
| 副色 | 羊皮紙 (本文) | 銀行グリーン (進捗・成長) |
| 余白 | 暗さで作る | 白さで作る |
| 動き | ほぼ静止 | 触ると返事する |

両者は補完的で、観測室の規律 (低彩度、装飾抑制、状態機械主役) はそのまま帳簿にも継承される。

---

## 3. Color System

### 3.1 Tokens (CSS Variables)

`globals.css` の `:root` を全置換する。命名は意味ベース (用途を変えずに値だけ差し替えれば後でテーマ
切替に拡張可能)。

| Token | Hex (案) | Role | コントラスト目標 |
|---|---|---|---|
| `--color-canvas` | `#f5f7fa` | ページ最背面 (薄いブルーグレー) | `ink` で 14:1+ |
| `--color-surface` | `#ffffff` | カード / パネル前面 | `ink` で 16:1+ |
| `--color-elevated` | `#ffffff` + `shadow-md` | モーダル / hover 浮き | — |
| `--color-border` | `#e3e8ef` | **純装飾の罫のみ** (背景の薄い区切り。canvas 上で 1.12:1 = 情報を持たない罫線専用、UI コンポーネント境界には使わない) | — (装飾罫は 1.4.11 対象外) |
| `--color-border-strong` | `#c9d2dc` | **情報を持つ境界すべて**: フォーム入力枠 / KeyCap / カードや行の機能的な輪郭 / focus-visible outline (**3:1 floor 必須箇所**) | 3:1 floor (canvas 上で要実測) |
| `--color-ink` | `#0b1d35` | 主要テキスト・見出し (深いネイビー) | canvas で 13:1+ |
| `--color-ink-muted` | `#5a6b80` | 副次テキスト・ラベル・hint | canvas で 4.5:1+ |
| `--color-primary` | `#0d3b66` | 主要 CTA / NavLink active | white text で 10:1+ |
| `--color-primary-hover` | `#0a2d4f` | hover/active | — |
| `--color-accent` | `#00a368` | growth / 成長 / 進捗 (Resona グリーン寄り)。**グラフィック / 非テキスト UI 専用** (Donut スライス・進捗バー・✓ glyph の fill)。**文字色には使わない** | 白文字で **3.26:1 = 4.5:1 不合格** → テキスト用途禁止。非テキスト UI として 3:1 (1.4.11) は満たす |
| `--color-friction` | `#d4791a` | 詰まりタグ / 警告未満 | — |
| `--color-danger` | `#c0392b` | エラー | — |
| `--shadow-sm` | `0 1px 2px rgba(11,29,53,.06)` | カード基本 | — |
| `--shadow-md` | `0 8px 24px rgba(11,29,53,.08)` | hover / elevated | — |
| `--shadow-lg` | `0 16px 40px rgba(11,29,53,.12)` | モーダル | — |

### 3.2 設計意図

- **canvas は純白を避ける** (`#f5f7fa`)。純白は CRT 残像のような疲労を生むため、わずかに青みを落とした
  オフホワイト。surface (カード) は純白にして「紙が机に乗っている」コントラストを 1 段作る。
- **ink は黒ではなくネイビー** (`#0b1d35`)。Resona をはじめとした金融系の慣習で、黒文字より読み疲れが
  少なく、primary との色相連続性で世界観が締まる。
- **accent は Resona グリーン寄り** (`#00a368`)。Stage 2 の `--color-growth: #7fb28e` (滅多に使わない) と
  違い、Stage 3 では「進捗 / 成長」の能動的なシグナルとしてもう少し前に出す。
- **friction は琥珀の温度を維持**。Stage 2 の `#d4a574` から若干彩度を上げて (`#d4791a`)、ライト基調で
  埋もれないようにする。
- **danger はほぼ使わない**方針も維持。エラー文言のみ。

### 3.3 用途ルール (色の階層) — **規約**

| ルール | 内容 | 理由 |
|---|---|---|
| **CTA = primary only** | ボタン CTA は `primary` (ネイビー) 一択。`accent` を CTA に使わない | 二重体系は長期で必ず崩れる (用途規約を覚えていない人が CTA に accent を当てる)。Resona / 三井住友の UI 観察でも CTA = ネイビーで一貫している |
| **accent = 成長/振り返り示唆専用 + 非テキストのみ** | `accent` (グリーン) は **(a)** Donut の Now スライス fill、 **(b)** 改善バッジの**背景塗り or アイコン** (文字は ink)、 **(c)** 完了チェック ✓ の fill — の 3 用途のみ。**accent を文字色に使わない** (白文字 3.26:1 不合格, §3.1)。バッジは「accent 背景 + 白/ink 文字 (要実測)」か「accent 12% 背景 + ink 文字」 | 「リスロン」のサインを画面に強く出すための保留色。CTA で消費しない。WCAG 上テキストにできないため非テキストへ用途確定 |
| **Logo = ink only** | App ヘッダーの `orbit` wordmark および `◯` シンボルは `ink` 単色ベタ。グラデも accent ドットもなし | 主役 (ActiveSliceCard / StatusHero) と視線競合させない。世界観をストイックに保つ |
| **friction / danger は単独** | バッジ / `ErrorText` でしか使わない | Stage 2 の規律を継承 |

### 3.4 旧トークンとの対応

| 旧 (Stage 2) | 新 (Stage 3) | 備考 |
|---|---|---|
| `canvas` `#213448` | `canvas` `#f5f7fa` | 値だけ差替、名前は維持 |
| `surface` `#283e54` | `surface` `#ffffff` | 同上 |
| `elevated` `#2f4760` | `elevated` `#ffffff` + shadow | shadow で elevation 表現 |
| `instrument` `#547792` | `border-strong` `#c9d2dc` | 「計器フレーム」→「強い罫」へ役割翻訳 |
| `mist` `#94b4c1` | `ink-muted` `#5a6b80` | 副次テキスト用途を継承 |
| `parchment` `#eae0cf` | `ink` `#0b1d35` | 本文用途を継承 (色相は反転) |
| `parchment-muted` `#c9c0ad` | `border` `#e3e8ef` | 弱い区切り線用途を継承 |
| `growth` `#7fb28e` | `accent` `#00a368` | 用途継承、前に出す |
| `friction` `#d4a574` | `friction` `#d4791a` | 名前維持・微調整 |
| `danger` `#b66b6b` | `danger` `#c0392b` | 名前維持・微調整 |

旧名 `instrument` / `mist` / `parchment` は **撤廃**。後方互換の alias は置かない (Stage 2 の規律: 死んだ
道具を温存しない)。

---

## 4. Typography

### 4.1 書体構成

| 軸 | 採用 | 意図 |
|---|---|---|
| 本文サンセリフ | Inter (維持) | Stage 2 と同じ。等幅と相性 |
| 等幅 | JetBrains Mono (維持) | **数値全般** に使用 (§4.3 参照) |
| 第三書体 | **入れない** (維持) | Stage 2 の規律を継承 |
| 見出し装飾 | **uppercase / letter-spacing 過剰は使わない** (維持) | 計器ラベル風は撤去済 |
| カラー | `ink` (本文) / `ink-muted` (副次) | 黒ベタは使わない |

### 4.2 Weight 規約 — **規約**

Stage 2 の `400/500/600` から **`300〜600`** に幅を広げる。字重コントラストで優美さを出す方針。

> **訂正 (レビュー反映)**: 当初「`sample/sass/base/_typography.scss` の優美さ = 字重コントラスト」を根拠に
> したが、実ソースの `_typography.scss` は **400/700 の二択**で weight 300 は存在しない (300 は
> `_navigation.scss` / `_card.scss` にのみ局所使用)。よって「sample 由来」ではなく **Orbit 独自の Ledger
> 判断**として weight 300 見出しを採る。**実装前提**: `globals.css` の Inter `@import` は現状
> `wght@400;500;600` のみで 300 を読み込まないため、**`wght@300;400;500;600` へ拡張必須** (§10.2 Task A1)。
> 拡張しない場合 h1 は fallback 400 に落ち、300↔600 コントラストが消える。300 を採らない代替案は
> 「h1 = 400 + `tracking-tight`」。

| 用途 | weight | size 例 | 補足 |
|---|---|---|---|
| ページ見出し (h1) | **300** | `text-3xl` (40px) | 軽い大型見出し、`tracking-tight` 弱 (-0.005em) |
| セクション見出し (h2) | **400** | `text-xl` (20px) | やや控えめ |
| 小見出し (h3 / Divider ラベル) | **500** | `text-sm` (12px) | 補助、`text-ink-muted` |
| 本文 | **400** | `text-base` (14px) | line-height 1.65 (§4.4) |
| 強調 (`<strong>` / Badge) | **500** | inherit | bold までは行かない |
| CTA / 主要ボタン | **600** | `text-sm` (14px) | ここだけ semibold で押し感 |
| 数値 (StatTile / タイマー) | **400 mono** | `text-3xl` (40px) | JetBrains Mono、軽い字重で帳票感 |

### 4.3 数値の等幅規約 — **規約**

「数値は原則 JetBrains Mono」をリポ全底で適用する。Ledger 世界観の生命線は**桁揃え**。

- **対象**: StatTile 値 / タイマー / Friction 件数 / Slice 数 / Then-vs-Now 差分% / リストカウント /
  日時 / 任意のメトリック表示
- **適用方法**: テキスト中の数字部分だけは `<span class="font-mono">` でラップ、または
  数値専用コンポーネント (例: `<Metric>` ) を新設して内側で `font-mono` 固定
- **例外**: 「本日 / 今週」などのラベル中の漢数字 (ある場合)、`KeyCap` 内のキー文字 (Mono 既定なので継承で OK)

### 4.4 長文可読性 — **規約**

Task メモ / Friction 説明 / Slice notes など長文ブロックには次を適用:

- `line-height: 1.65` (Inter 400 の字面に対し最も読みやすいレンジ)
- `max-width: 65ch` (Tailwind の `max-w-prose` 相当)、行長 60〜75ch
- `letter-spacing: 0`
- 段落間 margin: `0.75em` (空行 1 行分)

実装は共通クラス `.prose-ledger` (globals.css) に集約し、長文表示する全コンポーネントで適用する。

---

## 5. Layout / Spacing

### 5.1 構造

レイアウト構造そのものは Stage 2 から変えない。最大幅 (`max-w-3xl`) や Today ページのセクション順序は
不変。次だけ調整:

- **罫線で区切る箇所を増やす** — 影だけに頼らず `border-border` を細く入れて「帳簿の罫」感を作る。
- **NavLink active を下線で示す** — Stage 2 は色のみ。下線スライドインで「今ここ」を強化。

### 5.2 Spacing Scale — **規約**

Ledger 世界観の「白い余白」を担保しつつ業務 UI のスクロール量を抑える**中庸スケール**を採用。

| 階層 | 値 (Tailwind) | 旧 (Stage 2) | 用途 |
|---|---|---|---|
| ページ上下 padding | `py-12` (48px) | `py-10` | `<main>` のトップ余白 |
| Page 内セクション間 | `space-y-12` (48px) | `space-y-10` | Today ページの `<section>` 間 |
| Card 内 padding | `p-7` (28px) | `p-5`〜`p-6` | カード本体 |
| Card 間 gap (grid) | `gap-4` (16px) | `gap-3` | StatTile グリッド等 |
| 小要素間 gap | `gap-2`〜`gap-3` (8〜12px) | 同等 | ボタン群、KeyCap + ラベル |
| inline 要素間 | `gap-1.5` (6px) | 同等 | アイコン + テキスト |

### 5.3 sample (rem 62.5%) → Tailwind (px) マッピング表

`sample/sass/base/_base.scss:9-24` は `html { font-size: 62.5% }` で 1rem = 10px (加えて breakpoint で
56.25%/50%/75% に再スケール — これは Tailwind 固定 px には持ち込まず、全 rem を事前解決して落とす)。

> **訂正 (レビュー反映)**: 旧文の「**70% 圧縮が原則**」は誤り。下表の実比率は 67/50/67/60/80% とバラバラで
> 単一比率ではない。これは「sample 値を Ledger 中庸スケールへ**目分量でマッピングした結果表**」であって導出
> ルールではない。**表に無い rem 値を「70%」で機械的に導出しないこと** (表を唯一の正とする)。
> **モーション距離にも同方針を適用**: `translateY(3rem)`=30px → 20px (§6.1)。

| sample | sample 実 px | Orbit 採用 px | Tailwind | 実比率 |
|---|---|---|---|---|
| `1.5rem 4rem` (btn padding) | 15 / 40 | 10 / 20 | `py-2.5 px-5` | 67/50% |
| `3rem` (gap) | 30 | 20 | `gap-5` | 67% |
| `6rem` (gutter-vertical) | 60 | 40 | `py-10` | 67% |
| `8rem` (gutter-vertical 大) | 80 | 48 | `py-12` | 60% |
| `2rem` (margin-bottom 小) | 20 | 16 | `mb-4` | 80% |

> 注: btn padding は **§5.3 のこの行 (`py-2.5`) を唯一の正**とする。旧 §11 が同値を `py-3` と記していた矛盾は
> §11 側を修正済。

---

## 6. Motion — Sample 流儀の移植

`sample/` (Natours) の純 CSS アニメの「触り心地」を、装飾過剰にならない範囲で Orbit に移植する。

### 6.1 採用するアニメ語彙

> **レビュー反映**: (1) keyframe の起点 (`_animations.scss`) は**距離**だけを定義し、timing/delay は
> `_button.scss:67-70` 側にある。sample は root 62.5% (1rem=10px) 前提なので、Orbit (Tailwind 1rem=16px) では
> **px を明示固定**しないと `translateY(3rem)` が 48px になり手触りが変わる。下表に px を明記する。
> (2) **CTA への delay は撤廃** — 旧案の 750ms delay は §1.3「入力導線を絶対に遅延させない」に違反 (§6.3-2 参照)。
> moveInBottom の delay は**非操作要素 (見出し等) のみ**に許可。

| 名前 | 距離の起点 | 用途 | 持続 / 距離 |
|---|---|---|---|
| `moveInBottom` | `_animations.scss:36` (`translateY(3rem)`=30px) | StatTile / Hero の初期描画 (**CTA には付けない**) | 500ms / `ease-out` / **distance `translateY(20px)`** (30→20px 圧縮) / 非操作要素のみ delay 可 / `backwards` |
| `moveInLeft` / `moveInRight` | `:1-31` (`translateX(±10rem)`=100px + overshoot `±1rem`=10px) | ページ見出し用 (控えめに) | 500ms / **distance `translateX(40px)` + ~10% overshoot** |
| `fadeIn` | (新規追加) | モーダル背景のみ (リスト要素には**使わない**、§6.3) | 200ms |
| `scaleIn` | (新規追加) | バッジ初期描画のみ | 150ms |
| Button hover lift + ::after グロー | `_button.scss:19-27, 54-65` | 全ボタン共通 | transition 200ms / hover `translateY(-2px)` / glow `::after` を **`scaleX(1.4) scaleY(1.6)` + opacity 0** へ 400ms |
| Button active sink | `_button.scss:29-34` | クリック瞬間の `translateY(-1px)` | 200ms (focus では transform しない, §9.2) |
| Radio reveal | `_form.scss:65-104` | ModeSelector / FrictionModal | opacity 200ms |
| Input label lift | `_form.scss:39-52` | フォームのラベル浮上 | 300ms / distance `translate-y-7`(28px) (§7.8) |
| NavLink underline slide | (新規) | ヘッダーナビの active 表現 | 250ms / `::after width 0→100%` |
| (CTA 初期演出の `--animated`) | `_button.scss:67-70` (`moveInBottom .5s ease-out .75s backwards`) | **採用しない** (delay が入力導線を遅延, §6.3) | — |

### 6.2 採用しないもの

- カード裏面回転 (`_card.scss` の `rotateY(180deg)`) — 情報密度が落ちる、Stage 2 の「単一・等価重み」と
  衝突
- グラデーション塗り (sample の primary-light → primary-dark) — 帳簿世界観に合わない
- パララックスや背景ビデオ
- リスト要素のスタガード fade-in (リスト操作時に遅延が積まれて摩擦になる)

### 6.3 設計原則

1. **アニメは情報を持つときのみ**。状態が変わった (選択された / フォーカスした / ロードされた) ときに
   だけ動かす。常時微振動するエフェクトは入れない。
2. **入力導線を遅延させない**。フォーム送信・タイマー開始・Friction 起票などのクリック→反応の間に
   アニメで意図的な間を挟まない。**操作可能要素 (CTA / インライン作成フィールド / 確定後の再フォーカス
   先) は初期描画 delay をゼロとする規約**。delay 付き `moveInBottom` は見出し等の非操作要素に限定
   (旧案が CTA に付けていた 750ms delay は撤廃, §6.1/§7.1)。
3. **`prefers-reduced-motion: reduce` 完全対応**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
4. **GPU プロパティのみ**。`transform` / `opacity` だけ。`width` / `height` / `top` / `left` の
   トランジションは原則禁止 (ModeBar のバー幅だけ例外的に許可)。
5. **動かすのは「初期描画 1 回」だけ**。リストへの行追加・タブ切替・モーダル内ステップ遷移などで
   `fadeIn` を反復発火させない (Decision Log: 状態変化アニメは StatusHero 帯色のような **既要素の属性遷移
   (transition)** で表現、新規要素の演出 (animation) は初回描画のみ)。例外: `dialog::backdrop` の open 時
   `fadeIn` 200ms は許可 (モーダル開閉は明確な状態遷移であり、ユーザーが起点)。

### 6.4 タイミングカーブ

| 用途 | カーブ | 理由 |
|---|---|---|
| 初期描画 | `ease-out` | 入ってきて落ち着く |
| Hover | `ease-out` 200ms / Out 150ms | 触ったときが速く、離れたときがそれより速く |
| Active 押下 | linear 100ms | 機械的な押下感 |
| Modal open | `cubic-bezier(.16,1,.3,1)` 300ms | 余韻のあるカスタムイージング |

---

## 7. Component-by-Component Redesign

各コンポーネントの「現状 → 新仕様 → 意図」を一覧化する。実装ガイドとしてそのまま参照可。

### 7.0 スタイル配置の3層 — **規約**

「Tailwind だと表現力不足では」という議論への結論。全面 SCSS 化はしない (トークン規律喪失・二重体系・§12
「bundle 増加ゼロ」違反のため)。層で役割を分ける:

- **Tier 1 Tailwind utilities (既定)**: レイアウト・余白・トークン配色・単純な状態。95%。
- **Tier 2 globals.css 素 CSS**: keyframes / `prefers-reduced-motion` / `::backdrop` / `@supports` /
  `.prose-ledger` / `::selection` — Tailwind で書けない物はすべてここ。
- **Tier 3 co-located CSS Modules (opt-in / 例外)**: pseudo-element 振付が utilities だと読めない少数の
  プリミティブ (現実候補は Button グロー・Radio reveal) のみ。**SCSS ではなく素の `*.module.css`** (Vite
  ネイティブ・新依存ゼロ) で、内部も `var(--color-*)` トークンを使う。**PR A で実装して utilities が辛いと
  判明したときだけ導入** (YAGNI、先に作らない)。整理目的なら `@layer components` / `cva` で足りる。

### 7.1 `Button` (`components/ui/Button.tsx`)

**現状**: フラットな border + bg。hover で border 色だけ変わる。
**新仕様** (レビュー反映):
- variants: `primary` (ネイビー fill / white text) / `subtle` (white bg / border-strong / ink text) /
  `ghost` (text のみ) / `danger` (削除確認用, §7.12.3)。
  **`accent` variant は作らない** — §3.3 で accent を CTA 禁止 + 文字色禁止としたため、accent ボタンは
  「存在するが押せない罠」になる。型 (variant union) から除外し、規約違反を実装不能にする。
- ベース: `rounded-md`、`px-4 py-2`、`transition-all duration-200`、`relative isolate`
- hover: `translate-y-[-2px]`、`shadow-md`、`::after` (同色拡大グロー `scaleX(1.4) scaleY(1.6)` / opacity 0 / 400ms)
- active: `translate-y-[-1px]`、`shadow-sm`
- focus-visible: outline `primary` 2px / offset 2px (**focus で transform しない**, §9.2)
- disabled: `opacity-40 cursor-not-allowed transform-none shadow-none`
- **初期描画 `moveInBottom` は CTA に付けない** (§6.1/§6.3: delay が入力導線を遅延させる)。演出は見出し等の
  非操作要素に限定。

**意図**: sample の「押すと持ち上がってグロウが弾ける」手触りを移植。ただし grow は柔らかく
(opacity 0 まで 400ms)、計器世界観から逸脱しない範囲。**観光 LP の初回 delay 演出は業務道具では毎日の
待ち時間になるため移植しない**。

### 7.2 `Card` (`components/ui/Card.tsx`)

**現状**: surface 背景 + 細 border。
**新仕様**:
- `bg-surface` (純白)、`border border-border`、`rounded-lg`、`shadow-sm`、`p-6`
- インタラクティブな場合のみ hover で `shadow-md` + `translate-y-[-2px]` (200ms)
- `variant="static"` (デフォルト・hover なし) と `variant="interactive"` を分ける

**意図**: 紙のような白カードに薄い影。クリック可能カードは触れたときに浮く。

### 7.3 `Badge` (`components/ui/Badge.tsx`)

**新仕様**: tone = `neutral` / `accent` / `friction` / `danger`。`rounded-full px-2.5 py-0.5 text-xs`。
背景は対応色の 12% alpha、文字は対応色そのまま。`scaleIn` 150ms で初期描画。

**意図**: 帳簿の付箋。塗りベタにすると目立ち過ぎるので半透明背景。

### 7.4 `Divider` (`components/ui/Divider.tsx`)

**新仕様**: 水平罫 `border-border`、ラベル付きの場合は左右に細い罫 + 中央に `ink-muted` 小ラベル
(`text-xs uppercase tracking-wider`)。

**意図**: 帳簿の項目区切り。Stage 2 の `uppercase tracking` 撤廃方針はテキスト本文側のもので、
セクション見出し的なラベルでは可読性向上のため許容。

### 7.5 `ErrorText` (`components/ui/ErrorText.tsx`)

**新仕様**: `text-sm text-danger`、左に小アイコン (`role="alert"` 既存維持)、`fadeIn` 200ms。

### 7.6 `KeyCap` (`components/ui/KeyCap.tsx`)

**新仕様**: `bg-surface` + `border border-border-strong` + `shadow-sm`、`text-ink` 等幅、
`rounded-md px-1.5 py-0.5 text-xs`。押下風の inner shadow は入れない (静的)。

**意図**: ライト基調で「キーボードの白いキー」をそのまま再現。

### 7.7 `Radio` (新規 `components/ui/Radio.tsx`)

**仕様** (レビュー反映で**マークアップ修正済**):
- `peer-checked` は `input:checked ~ .target` という**兄弟**セレクタにコンパイルされる。よって視覚 radio /
  内側ドットを `<label>` の**子孫**に置くと届かない (元案の構造的バグ)。input と視覚要素を**同階層の兄弟**に
  フラット化する:
  ```html
  <input type="radio" id="mode-build" class="peer sr-only" name="mode">
  <label for="mode-build" class="cursor-pointer pl-7 ...">
    <span class="absolute left-0 h-5 w-5 rounded-full border-2 border-primary"></span>
    <span class="absolute left-1 top-1 h-3 w-3 rounded-full bg-primary
                 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"></span>
    ラベル文言
  </label>
  ```
  ドット span は `<input class="peer">` の**後続兄弟**である必要があるので、`<input>` → 視覚 span 群の順に置く
  (上記のように span を label の前に出すか、`peer` を持つ input の直後兄弟として配置)。
- native input は `sr-only` (`display:none` ではない) — sample `_form.scss:66` の `display:none` は a11y 非対応
  なので**意図的にアップグレード**。

**意図**: `sample/sass/components/_form.scss:65-104` の radio reveal の流儀を、Tailwind の兄弟 `peer-checked`
で再現する。SCSS の `~ &__radio-label &__radio-button::after` (`:102`, 兄弟→子孫の2段) は Tailwind 単体で
表現不可なため、上記のフラット兄弟構造に翻訳する。

### 7.8 `Input` (新規 `components/ui/Input.tsx`)

**仕様** (レビュー反映で**マークアップ修正済**):
- floating label も `peer` (兄弟セレクタ) なので **input が label の前の兄弟**である必要がある。label で input を
  ラップしてはいけない (元案の構造的バグ)。正しい形:
  ```html
  <div class="relative">
    <input id="x" class="peer ..." placeholder=" " />   <!-- placeholder は空白1個: :placeholder-shown を空欄時に発火 -->
    <label for="x"
      class="absolute left-0 top-2 text-ink-muted transition-all duration-300
             peer-placeholder-shown:translate-y-7 peer-placeholder-shown:opacity-0
             peer-placeholder-shown:invisible peer-focus:translate-y-0 peer-focus:opacity-100">
      ラベル
    </label>
  </div>
  ```
- **移動量**: sample `_form.scss:51` は `translateY(-4rem)`=40px。元案の `-1rem`(16px) では label が入力欄に重なり
  floating が成立しないため、**`translate-y-7`(≈28px, 70% 圧縮相当) 以上**を採る。
- **`visibility` も切替**: `opacity-0` だけだと空欄時に label が a11y ツリー / タブ順に残るため
  `peer-placeholder-shown:invisible` を併記 (sample `:48` は `opacity:0; visibility:hidden;` 両方)。
- input の border は `border-b-2 border-border-strong`、focus で `border-b-2 border-primary`。focus 時に弱い
  `shadow-md`。invalid (`aria-invalid` / `:focus:invalid`) で border を `danger` に。

**意図**: sample のフォームの「触ったら反応する」手触り。banking 系フォームの定番でもある。

### 7.9 Orbit Components

#### `CategoryTabs`
- タブは text-only、active は下に 2px の `bg-primary` ライン、非 active は `border-transparent`
- active 切替時に `::after` の width を 0→100% に 250ms スライド (`transform-origin: left`)
- カラー: 非 active = `ink-muted`、active = `ink`

#### `FrictionItem`
- 白カード + `border-l-4 border-friction` (左端に琥珀のアクセント帯)
- hover で `shadow-md` + `translate-y-[-2px]`
- 解決済みは `opacity-60` + left border `border-border-strong`

#### `ModeBar`
- セグメントごとに mode キーで色分け (基本 `ink-muted` ベース、active mode 区間だけ `primary` または
  `accent`)
- 各セグメントの `width` トランジション 400ms `ease-out` を許可 (情報的アニメ)

#### `StatTile`
- 白カード、数値は `text-3xl font-mono font-normal` (§4.2 規約、weight 400 軽量)、ラベル `text-xs text-ink-muted`
- 初期描画で `moveInBottom`、3 枚の delay を 0 / 100ms / 200ms とずらして「順に置かれる」演出
  (例外的にスタガード許可 — ロード後の静的表示なので入力遅延と無関係)

#### `StatusHero`
- 現在状態を巨大に出す Stage 2 の役割は維持
- 背景: `bg-surface` + `border border-border`、状態色は左端の 6px 帯 (`border-l-[6px]`) で表現
- **状態色マッピング (規約)**:
  - `working` → `primary` (ネイビー、"今ここ" の主役)
  - `off` (break / meeting) → `ink-muted` (計測非対象は無彩色化)
  - `pause` → `friction` (本人が止めた、琥珀の温度。Friction タグと同色で "気にして" の伝達を一貫)
  - **`accent` (グリーン) は状態色に使わない** (§3.3 と整合、"成長" 用途で保留)
- 状態変化時に `aria-live="polite"` 維持。視覚は左帯色を `transition: border-left-color 200ms ease-out` で
  滑らかに切替 (要素自体は再マウントしない)。本文の `fadeIn` 200ms は要素差替時のみ。

#### `ThenVsNowChart` (Recharts) — **構造再設計**

**コンセプト整合**: DESIGN_CONCEPT の問い「同じ作業、前より速く解けるようになった?」は**比較ナラティブ**
が中心。現連続時系列 (100% stacked area) は「精密だが物語性が弱い」状態。Stage 3 で**比較ナラティブを
主役**にし、連続時系列は副次に降格する。

**研究根拠**:
- Cleveland & McGill (1984): 角度・面積は位置・長さより知覚精度が落ちる → 円グラフはスライス 5 未満に制限
- Tufte / Few: 円グラフは**単一時点スナップショット**には有効、時系列には不向き
- Heer et al. (行動変容研究): "Before vs After" の 2 スナップショット並置は連続時系列より記憶定着が強い

**新構造** (`ThenVsNowPage.tsx` のメインセクション):

```
┌─────────────────────────────────────────────────┐
│ [4w] [8w]✓ [12w] [all]      ← 期間タブ          │
├─────────────────────────────────────────────────┤
│  この 8 週で implement が +18pp、code_explore   │  ← ナラティブ文
│  が -14pp 変化しました。                          │
├──────────────┬──────────────────────────────────┤
│   Then       │   Now                            │
│   ╭───╮      │   ╭───╮                          │  ← Donut 2 枚
│  ╱     ╲     │  ╱     ╲   ──►                   │
│  donut       │  donut                           │
│   ╲     ╱    │   ╲     ╱                        │
│    ╰───╯     │    ╰───╯                         │
├──────────────┴──────────────────────────────────┤
│ code_explore  42% ────────► 28%  ▼14pp          │  ← デルタ表
│ implement     33% ────────► 51%  ▲18pp (accent) │
│ debug         15% ────────► 12%  ▼3pp           │
│ learn         10% ────────►  9%  ▼1pp           │
│ その他          —% ────────►   —%                 │
├─────────────────────────────────────────────────┤
│ ▸ 週次推移を見る (折りたたみ)                     │  ← 旧 100% area chart
└─────────────────────────────────────────────────┘
```

**規約**:

| 項目 | 仕様 |
|---|---|
| Donut | Recharts `<PieChart>` + `<Pie innerRadius="60%">`、`isAnimationActive={false}` |
| Donut 中央 | 期間ラベル (`text-xs text-ink-muted`) + 総時間 (`font-mono`) |
| 期間タブ | `4w` / `8w` / `12w` / `all`、デフォルト `8w`、CategoryTabs と同パターン (§7.9) |
| Then/Now 分割 | 期間を 2 等分。例: 8w → Then=前半 4w、Now=後半 4w |
| スライス上限 | **上位 4 モード + その他** に集約 (Now 期間の比率上位)。「その他」は `ink-muted` 単色 |
| スライス色 | mode 別に `chartTheme.modeColors` を継承、ただし Stage 3 では primary / accent / ink-muted / friction / それ以外は彩度低めのバリエーション |
| デルタ表 | 各行に `mode label` + `Then% → Now%` + `▲/▼ Npp`。**▲▼ は中立色 (`ink-muted`) を既定**とし、accent は「改善方向の有意変化」glyph の fill にのみ使う (§3.3, accent は非テキスト)。「最大変化だから accent」ではない — 退行 (例: debug +18pp) を緑で祝わない |
| ナラティブ文 | **ルールベース生成 + 標本量ゲート**: まず各サイド (Then/Now) の総時間・週数が下限未満なら変化量に関わらず「判断に十分なデータがありません」を出す。下限を満たした上で、絶対値で変化が最大の 1〜2 モードを文章化。閾値 5pp 未満なら「まだ変化が見えていない」文 |
| 連続時系列 (旧) | `<details>` で「週次推移を見る」折りたたみ。中身は現 `AreaChart` (`stackOffset="expand"`) を維持、トークンだけ Stage 3 化 |
| Tooltip / Axis | `ink-muted`、数値 `font-mono` (§4.3) |

**ナラティブ生成ルール** (擬似コード):

```
// 標本量ゲート (レビュー反映): 各サイドが十分なデータを持つか先に検査。
// ※ ThenVsNowPage の MIN_WEEKS は「データのある週数」を数える点に注意 (カレンダー週ではない)。
//    4w 分割で片側が実データ 1 週しかない場合の偽の物語を防ぐ。
const MIN_WEEKS_PER_SIDE = 2;
const MIN_MINUTES_PER_SIDE = SOME_FLOOR; // 例: 各サイド合計が下限未満なら判断不能
if (then.weeksWithData < MIN_WEEKS_PER_SIDE || now.weeksWithData < MIN_WEEKS_PER_SIDE
    || then.totalMin < MIN_MINUTES_PER_SIDE || now.totalMin < MIN_MINUTES_PER_SIDE) {
  return "この期間は判断に十分なデータがありません。";
}

const sorted = modes.sort((a, b) => Math.abs(deltaPp(b)) - Math.abs(deltaPp(a)));
const top1 = sorted[0];
const top2 = sorted[1];

if (Math.abs(deltaPp(top1)) < 5) {
  return "この期間ではモード配分の大きな変化は見えていません。";
}
if (Math.abs(deltaPp(top2)) >= 5) {
  return `この ${window}w で ${label(top1)} が ${sign(top1)}${abs(top1)}pp、${label(top2)} が ${sign(top2)}${abs(top2)}pp 変化しました。`;
}
return `この ${window}w で ${label(top1)} が ${sign(top1)}${abs(top1)}pp 変化しました。`;
```

> **accent glyph 規約**: デルタ表の ▲ を accent (緑) で出すのは `deltaPp > 0` **かつ** それが「改善」と解釈
> できるモード (例: implement 増) のときのみ。符号や「改善向き」の定義は実装時に ADR / DESIGN_CONCEPT と
> 整合させる。`Math.abs` ソートは「文章化する対象の選定」にのみ使い、緑色付与の判定には使わない。

**StatTile (Then→Now 比率 2 枚) は廃止** — デルタ表に統合される。

### 7.10 `App.tsx` (ヘッダー / ナビ)

- ヘッダー: `bg-surface` + `border-b border-border`、`backdrop-blur` は入れない (帳簿は不透明)
- ロゴ: `text-ink font-semibold`、`◯` も同じ `text-ink` 単色 (§3.3 Logo = ink only ルールに従う)
- NavLink: 非 active `text-ink-muted hover:text-ink`、active `text-ink` + 下線スライドイン
- Skip-link: focus 時に `bg-primary text-white` で表示 (3:1 floor 余裕)

### 7.11 Favicon / アプリアイコン

**意図**: ヘッダーロゴ ◯ (§3.3) と完全に連続性を持たせ、タブ・ホーム画面・OS で「同じ Orbit」と認識
させる。装飾を足さず wordmark の ◯ そのまま。

**マスター**: `frontend/public/favicon.svg`
- viewBox: `0 0 32 32`
- 円: `<circle cx="16" cy="16" r="11" fill="none" stroke="#0b1d35" stroke-width="2.5" />`
- 背景: 透明 (タブの白背景にそのまま乗る)
- dark mode 対応: SVG 内に `<style>` で `@media (prefers-color-scheme: dark) { circle { stroke: #f5f7fa } }`

**PNG ラスタ** (`frontend/public/` 配下):
| ファイル | サイズ | 用途 |
|---|---|---|
| `favicon-16.png` | 16×16 | レガシーブラウザ |
| `favicon-32.png` | 32×32 | 標準タブ |
| `favicon-192.png` | 192×192 | Android ホーム |
| `favicon-512.png` | 512×512 | PWA splash |
| `apple-touch-icon.png` | 180×180 | iOS ホーム (背景 `#f5f7fa` ベタ + ◯ ink) |
| `favicon.ico` | 16/32 multi | Edge / IE 互換 |

**`index.html` 追記**:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f5f7fa">
```

**`site.webmanifest`** (PWA 対応の最小版):
```json
{
  "name": "Orbit",
  "short_name": "Orbit",
  "icons": [
    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#f5f7fa",
  "background_color": "#f5f7fa",
  "display": "standalone"
}
```

**生成手順** (実装時):
1. SVG マスターを手書き
2. `npx @resvg/resvg-js` または ImageMagick で SVG → 各サイズ PNG 出力
3. `npx png-to-ico` で `favicon.ico` 生成

---

### 7.12 Tasks ページ — 構造再設計

> **スコープ注記 (レビュー反映, 最重要)**: 本節は**挙動変更を含む**ため Stage 3 の純ビジュアル PR (PR A)
> には入れず、**別 feat PR (PR B, §10.3)** として ADR 005 整合・a11y 仕様・ユニットテスト込みで出荷する。
> PR A では `TaskForm` / `TaskList` の**現 2-select 構造のまま新トークンを当てるだけ**にする (問題 #1
> の生 Tailwind 撲滅は PR A で完了 / 問題 #2-9 の構造改善は PR B)。
> レビュー結論: この再設計は方向は正しいが、**現状の「酷い版」より良くなる確証はまだなく**、select 地獄を
> 「暗黙の状態遷移グラフ + メニュー階層」地獄に付け替えるリスクがある。下記の修正を満たして初めて改善になる。

**Stage 2 までの問題** (`TasksPage.tsx` / `TaskForm.tsx` / `TaskList.tsx` 実コードから):

| # | 問題 | 場所 |
|---|---|---|
| 1 | トークン未適用 (`bg-neutral-900`, `bg-blue-600` 等の生 Tailwind) | TaskForm L26-67, TaskList L31,55,69 |
| 2 | 1 行に編集 select 2 個 + 削除ボタンが同列、視覚的優先順位崩壊 | TaskList L47-85 |
| 3 | カテゴリ・ステータスが `<select>` で全体感がつかめない | 同上 |
| 4 | 削除がテキストリンク扱い、確認なし | TaskList L78-85 |
| 5 | 完了の差別化が line-through のみ | TaskList L36 |
| 6 | フォーム空タイトル時の挙動が無音 (`return` のみ) | TaskForm L15 |
| 7 | 作成後カテゴリリセット、連続作成に摩擦 | TaskForm L21-22 |
| 8 | 状態フィルタなし、done/archived が open を埋める | TaskList |
| 9 | 空状態の onboarding ゼロ | TaskList L28 |

**新設計 (Stage 3 ledger)**:

#### 7.12.1 ページ構造

```
┌─ Tasks ────────────────────────────────────────────┐
│  [Filter: open ▾]  [Category: all ▾]               │  ← フィルタバー (常時)
├────────────────────────────────────────────────────┤
│  ● open   タイトル                  [bug]    ⋯     │  ← 1 行 = バッジ + title + category badge + menu
│  ● open   別タイトル                [feature] ⋯     │
│  ◐ in_progress   進行中タイトル     [refactor] ⋯   │
│  ✓ done    完了タイトル (打ち消し)    [bug]    ⋯     │
│  ─                                                 │
│  + 新しいタスクを追加…                              │  ← インライン作成フィールド
└────────────────────────────────────────────────────┘
```

#### 7.12.2 状態表現 — ステータスバッジ + ワンクリック昇格

行頭にステータスドット + ラベル:

| 状態 | バッジ表現 | クリック動作 |
|---|---|---|
| `open` | `●` `ink-muted` ベタ円 + "open" | → `in_progress` |
| `in_progress` | `◐` `primary` 半円 + "in_progress" | → `done` |
| `blocked` | `▲` `friction` 三角 + "blocked" | メニューから解除のみ (誤クリック保護) |
| `done` | `✓` `accent` チェック + "done" | → `open` (取り消し) |
| `archived` | (一覧非表示、フィルタで表示) | — |

**規約**: 状態の進行 (`open → in_progress → done`) はバッジ click 1 回。逆戻り・blocked 入り・archive
入りは `⋯` メニュー。done の ✓ fill は accent (非テキスト, §3.3)、ラベル文字は ink。

> **PR B 必須要件 (レビュー反映)**:
> - **ADR 005 整合**: バッジ昇格は `started_at` / `completed_at` (types.ts) という副作用フィールドを動かす
>   ドメイン操作。`<select>` で値を入れるより意味的に重い。ワンクリック昇格が各フィールドをどう書くかを
>   ADR 005 の状態機械に照らして定義してから実装する。
> - **a11y**: バッジは glyph (●◐✓) だけの操作要素なので `aria-label`「クリックで in_progress にする」等を必須。
> - **逆走の保護一貫性**: `done → open` は `completed_at` を破棄する破壊的操作。blocked 解除だけ保護して
>   done 取消を無防備にするのは非一貫。保護基準を「破壊的/不可逆な遷移か」で統一し、blocked の解除先
>   (→ open 固定 等) を明記する。

#### 7.12.3 編集 — 行頭バッジ + 「⋯」メニュー

- **inline**: ステータスバッジクリックのみ。category 変更も頻度が低くないため、メニュー奥に押し込まず
  inline の category バッジ click でも変更できる導線を検討 (現 select より深くしない)。
- **「⋯」メニュー** (レビュー反映: `<details>` は role=menu も矢印キーも持たず APG Menu Button 契約を
  満たさない & Stage 2 にこのメニューは無いので「継承」ではない。**`aria-haspopup="menu"` の正式な
  Menu Button か `<dialog>` アクションシートで実装**):
  - カテゴリ変更 (Radio 群、§7.7 新 Radio)
  - 説明編集 (新 Input、§7.8)
  - blocked にする / archive する
  - 削除 (確認ダイアログ — ネイティブ `<dialog>` で `「○○を削除しますか？」` + キャンセル/削除 2 ボタン、削除は `danger` variant)

#### 7.12.4 作成 — 行末インラインフィールド (Linear/Todoist 風)

- リスト末尾に `+ 新しいタスクを追加…` のテキストフィールド
- focus 時に展開 → タイトル入力欄 + カテゴリバッジ (デフォルト直前作成と同じ、変更可)
- `Enter` で確定 → 即リスト追加 + フォーカスが再び空フィールドへ (連続作成可)
- `Esc` で閉じる
- バリデーション: 空文字で確定すると **inline ErrorText** (`text-danger fadeIn`)、ボタン無音化はしない
- カテゴリは**前回作成のカテゴリを保持** (Stage 2 #7 の摩擦解消)

#### 7.12.5 フィルタバー

- ステータスフィルタ: `all / open / in_progress / blocked / done / archived` の 6 タブ (CategoryTabs パターン §7.9)
- カテゴリフィルタ: `<select>` 1 個 (バッジクリックでフィルタ追加するパターンは将来検討、今回は select)
- フィルタ状態は URL クエリで保持 (`?status=open&category=bug`)

> **事故 UX 対策 (レビュー反映)**: デフォルトを `status=open` にすると、open 行をワンクリック昇格した瞬間に
> フィルタから脱落し「操作した行が消える」。`useUpdateTask` が `TASKS_KEY` 全体を invalidate する (hooks.ts)
> ため再フェッチで即座に消える。対策のいずれか: **(a) デフォルトフィルタを `all` か `open+in_progress`**、
> または **(b) 昇格直後は楽観更新で当該行をリストに残す** (フィルタ外でも一定時間 / 次操作まで表示)。
> 「全体感がバッジで一目」という設計目標と衝突させない。
> なお URL クエリフィルタ・削除確認 `<dialog>`・インライン作成のフォーカス管理はいずれも**色置換ではなく
> 挙動 = PR B スコープ**。

#### 7.12.6 空状態

- フィルタゼロ件: `「フィルタ条件のタスクがありません」` + 「フィルタクリア」リンク
- 全体ゼロ件 (初回): `「最初のタスクを作りましょう」` + 行末インラインフィールドにフォーカス自動

#### 7.12.7 視覚規約 (Stage 3 トークン適用)

- 行間: `divide-y divide-border` (旧 `divide-neutral-800` 撤廃)
- 行 hover: `bg-canvas` (薄く沈む)
- 行 padding: `py-3 px-4`
- title: `text-base text-ink`
- category badge: `Badge` (§7.3)、tone は category 別 (将来拡張、今は `neutral` 一律)
- done 行: `opacity-60` + title `line-through text-ink-muted`
- 「⋯」ボタン: `text-ink-muted hover:text-ink`、focus-visible で outline

---

## 8. Features 層の更新方針

`features/{slices,frictions,tasks,reports,settings}/` の各コンポーネントは Tier B (UI プリミティブ) の
新規 `Button` / `Card` / `Input` / `Radio` に置き換えることで、ほぼスタイル変更ゼロでブランディングが
継承される。

特例:

- **`ActiveSliceCard`** — 計測中の主役カード。`primary` 色の左帯 + 大きなタイマー (等幅) を中央に。
  経過秒は数値だけアニメ更新 (要素自体は再マウントしない)。
- **`ModeSelector`** — 新 `Radio` を採用、横並び 2 段 (`grid-cols-2 sm:grid-cols-4`)。
- **`FrictionModal`** — ネイティブ `<dialog>` の Stage 2 構造を維持、内部フォームを新 `Input` に。
  open 時に `dialog::backdrop` を `fadeIn` 200ms、本体を `moveInBottom` 300ms。
  - **backdrop 規約**: `background: rgba(11,29,53, 0.32)` + `backdrop-filter: blur(8px)`。
    `@supports` 非対応環境のフォールバックは `rgba(11,29,53, 0.48)` (blur なし)。
    Ledger 世界観の「ネイビー支配下」と連続性を持たせる。黒ではなく `ink` 色で覆う。

---

## 9. アクセシビリティ (継承 + 検証)

Stage 2 の規約を **新パレットで再検証** する。

### 9.1 必須コントラスト

| 組合せ | 基準 | 検証方法 |
|---|---|---|
| `ink` / `canvas` | 4.5:1 | コントラストツール実測 |
| `ink-muted` / `canvas` | 4.5:1 | 同上 |
| `ink-muted` / `surface` | 4.5:1 | 同上 |
| `white` / `primary` | 4.5:1 | CTA |
| `accent` / `white` (グラフィック) | **3:1** (1.4.11, 非テキスト) | Donut スライス・✓ glyph。**4.5:1 テキスト基準は適用しない** (accent は文字に使わないため, §3.1/§3.3) |
| `border-strong` / `canvas` | 3:1 | 機能的 UI 境界・入力枠 (1.4.11) |
| `border` / `canvas` | (基準なし) | **純装飾罫のみ**。1.12:1 で 3:1 未達だが、情報を持たない罫線は 1.4.11 の対象外 (機能的境界は border-strong を使う, §3.1) |
| focus-visible outline / 背景 | 3:1 | 全インタラクティブ要素で確認 |

**WCAG 実測は実装着手前ゲート (§10.2 Task A2) で行う**。accent を文字に流用した場合のみ未達になるが、§3.3 で
文字用途を禁止したため設計上は発生しない。未達が出たら token 値を調整 (border-strong / ink-muted の値が予備車線)。

### 9.2 モーション

- `prefers-reduced-motion: reduce` で keyframes 無効化
- アニメ要素の `aria-live` は変えない (`StatusHero` は `polite`)
- フォーカス可能な要素のフォーカス時に位置がズレない (transform は hover/active のみ、focus では使わない)

### 9.3 その他

- `<dialog>` のネイティブ `Esc` / `backdrop click` を維持
- Skip-link のフォーカス時可視を新パレットで再確認 (`focus:bg-primary focus:text-white`)
- フォーム invalid 状態は border 色 + `aria-invalid` + ErrorText の三重表現

---

## 10. 実装計画 (スタック PR 戦略 / HEAD = `feat/rebrand-front-design` を統合ベース)

> **改稿 (2026-06-21, レビュー反映)**: 旧 §10 は「1 PR で全置換」だったが、レビュー2本
> (多観点 grill / sample 移植忠実度) の結論として、**「機能追加ゼロの純ビジュアル刷新」と
> 「挙動変更を伴う再設計」を同一 PR に混ぜない**方針へ変更する。§7.12 (Tasks) と §7.9
> (ThenVsNow) は色置換ではなく**新しい挙動の発明**であり、純ビジュアル PR の「回帰範囲 = 視覚層
> のみ」という安全前提 (§1.4) を壊すため、物理的に分離する。

### 10.1 ブランチ戦略 — HEAD へのスタック PR

`feat/rebrand-front-design` (= 本ブリーフを保持する現 HEAD) を**統合ベース**とし、各サブブランチが
**HEAD 向けに PR を出す**。最終的に統合ベースを `main` へ 1 本のマージ PR でまとめる。

```
main
 └─ feat/rebrand-front-design        ← HEAD / 統合ベース (このブリーフ)
     ├─ PR A: feat/rebrand-tokens       → HEAD  (純ビジュアル: トークン+プリミティブ+全画面)
     ├─ PR B: feat/tasks-redesign       → PR A 上にスタック  (挙動変更: §7.12, ADR 005 整合)
     └─ PR C: feat/thenvsnow-redesign   → PR A 上にスタック  (挙動変更: §7.9)
```

- **PR A を最初に HEAD へマージ**してから B/C を積む。これで「旧色と新色の混在 (中間状態) を作らない」
  という旧 §12 の要件を、1 PR でなくマージ順序で満たす。
- B / C は PR A の新 `Button`/`Input`/`Badge` に依存するため PR A の上にスタックする (依存がなければ HEAD 直)。
- B と C は互いに独立 → 並行レビュー可能。どちらも単独で revert/保留できる。
- **B / C は今回の rebrand スコープでは必須でない**。PR A 単独でも「ライト Ledger 化」は完結する
  (Tasks / ThenVsNow は現構造に新トークンを当てた状態で出荷可能)。B / C は別 feat として後追いでよい。

### 10.2 PR A — 純ビジュアル刷新 (機能追加ゼロ / 回帰範囲 = 視覚層のみ)

| Task | 内容 | 見積 |
|---|---|---|
| A0 | 棚卸: 旧 `--color-*` **に加え生 Tailwind パレットクラス** (`bg-neutral-*` / `bg-blue-*` / `text-red-*` / `divide-neutral-*`) も `rg` 全件 (TaskForm/TaskList が該当, §7.12 問題#1) | 0.5h |
| A1 | `globals.css` + `tailwind.config.ts` 刷新。**Inter `@import` に weight 300 追加** (`wght@300;400;500;600`, §4.2)。**keyframe は px 距離を明示**固定 (§6.1) | 1.5h |
| A2 | **WCAG 実測を着手前ゲートに前倒し** (旧 Task7)。accent / border の確定はトークン定義時に行う (§9.1) | 1h |
| A3 | UI プリミティブ書換 (Button/Card/Badge/Divider/ErrorText/KeyCap) + 新規 (Radio/Input)。**Radio/Input は §7.7/§7.8 の修正マークアップで実装** | 3h |
| A4 | Orbit components (CategoryTabs/FrictionItem/ModeBar/StatTile/StatusHero) 更新 | 1.5h |
| A5 | `App.tsx` + 3 ページ + Favicon 一式 (§7.11) | 2.5h |
| A6 | `features/*` の旧トークン置換 + フォーム系を新 Input/Radio へ移行 | 2h |
| A7 | ThenVsNowChart / Tasks は**現構造のまま配色のみ Stage 3 化** (TaskForm/TaskList の 2-select 構造維持、ThenVsNow は現 AreaChart のまま) | 1h |
| A8 | ビルド (`tsc --noEmit` / `pnpm build`) グリーン + 3 ページ手動巡回 + reduced-motion 確認 | 0.5h |

コミット分割 (Conventional Commits, PR A 内):

```
refactor(theme): replace dark tokens with light "Ledger" palette (+ Inter 300)
refactor(ui): rebuild Button/Card/Badge primitives with sample-style motion
feat(ui): add Radio and Input primitives (sample-style, sibling-peer markup)
refactor(orbit): apply new tokens to orbit components
refactor(pages): apply new tokens to App, pages, favicon
refactor(features): migrate feature components to new primitives
refactor(chart,tasks): apply Ledger palette only (no structural change)
chore(a11y): verify WCAG AA on new palette and tune tokens
```

### 10.3 PR B — Tasks 再設計 (§7.12 / 別 feat, 挙動変更)

- **ADR 005 状態機械と整合**: バッジ昇格が `started_at` / `completed_at` (types.ts) の副作用をどう扱うか
  を ADR 005 に照らして定義してから実装する (§7.12.2 注記)。
- a11y: ⋯メニューは APG Menu Button 契約 (role=menu / 矢印キー) を満たす実装 or `<dialog>` アクションシート、
  ステータスバッジに `aria-label`。
- デフォルトフィルタ + 楽観更新の事故 UX 対策 (§7.12.5 注記)。
- testing.md 準拠でユニットテスト (状態遷移グラフ / URL 同期 / 空文字バリデーション)。
- 見積: 実装 4h + テスト 2h。

### 10.4 PR C — ThenVsNow 再設計 (§7.9 / 別 feat, 挙動変更)

- Donut 2 枚 + デルタ表 + 期間タブ + **標本量ゲート付きナラティブ生成** (§7.9 修正版)。
- testing.md 準拠でユニットテスト (ナラティブ生成ルール / 集計 / 標本量ゲート)。
- 見積: 実装 3h + テスト 1.5h。

### 10.5 各 PR 共通ゲート

- 自 PR 単独で `tsc --noEmit` / `pnpm build` がグリーン (スタックでも各層で緑を保つ)。
- 新規ロジックは testing.md (80% / TDD) に従いユニットテストを同梱。
- PR 本文に Before/After スクショ必須。PR A は WCAG 実測値も貼付 (§14)。

---

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| 旧トークン参照漏れで一部画面が破綻 | High | Task 0 の `rg` 棚卸を PR 着手前に完了させる |
| Recharts の hardcoded 色が混在 | Med | Task 6 で個別精査、`stroke/fill` 全件 grep |
| ライト化で `ink-muted` が `surface` 上で 4.5:1 を割る | Med | Task 7 で実測、不足なら `ink-muted` を `#4a5b70` 寄りに |
| 1 PR が巨大化してレビュー困難 | High | 上記のコミット分割、PR に Before/After スクショ必須 |
| `::after` グローと既存 `dialog::backdrop` の z-index / overflow 衝突 | Low | 親に `relative isolate`、`after:absolute after:-z-10` |
| Stage 2 の「装飾削減」規律が緩むという誤読 | Med | 本ドキュメントの §1.3 と §2 で「装飾量は増やさない、質を上げる」を明文化 |
| sample 由来の `rem` (62.5% 前提) と Tailwind の `px` ベースのズレ | Med | sample の `rem` 値は §5.3 の**マッピング表を唯一の正**として翻訳 (btn padding = `py-2.5`。旧文の `py-3` は誤記、修正済)。keyframe 距離も px 明示 (§6.1) |
| 業務時間中のライト基調が夜間使用で眩しい | Low | 本リブランドではテーマ切替を提供しない (将来 Observatory を dark mode として復活する余地は token 設計で残す) |
| `accent` を文字色に流用し WCAG 4.5:1 を割る | High | §3.1/§3.3 で accent を非テキスト専用に確定。Button に accent variant を作らない (§7.1) ことで型レベルで封じる。実測は PR A 着手前ゲート (§10.2 A2) |
| `peer-checked` / floating label のマークアップ誤りで Radio/Input が無反応 | High | §7.7/§7.8 の兄弟フラット構造で実装。実装時に checked/placeholder-shown の双方を手動確認 |
| Inter weight 300 未ロードで h1 字重が出ない | Med | §10.2 A1 で `@import` に 300 追加を必須化 (§4.2) |
| 「洗練されたか」を判定するゲートが無く凡庸に着地 | Med | §14 に「Orbit 識別性 / 凡庸でないか」の主観ゲートを追加 |
| PR B/C の挙動変更が ADR 005 状態機械と齟齬 | High | §10.3/§7.12.2 で ADR 005 整合を実装前提に明記、ユニットテストで遷移を固定 |

---

## 12. Decisions Log

| 日付 | 決定 | 根拠 |
|---|---|---|
| 2026-06-21 | ライト基調へ全面刷新 (ダーク維持しない) | 業務道具としての信頼感を優先、テーマ切替のメンテ負債を回避 |
| 2026-06-21 | アニメは純 CSS (Framer Motion 不採用) | sample 流儀の手触りを直接再現、bundle 増加ゼロ |
| 2026-06-21 | ~~1 PR で全置換 (Phase 分割しない)~~ **→ 撤回 (下記 改 行)** | 中間状態回避が動機だったが、純ビジュアルと挙動変更の同梱リスクが上回ったため §10.1 のスタック PR へ |
| 2026-06-21 | Observatory コンセプトは Stage 2 として保存、Stage 3 は Ledger | コンセプト自体は否定せず視座を切替えた扱い |
| 2026-06-21 | テーマ切替トグルは今回スコープ外 | 設計余地は token 構造で確保 |
| 2026-06-21 | パレットは A 案 (`primary #0d3b66` / `accent #00a368` / `canvas #f5f7fa`) で確定 | 3 案比較を省略し、Task 7 の WCAG 実測で微調整する方針 |
| 2026-06-21 | Accent は CTA に使わない (成長 / 振り返り示唆専用) | 二重 CTA 体系の長期崩壊を回避、accent を「リスロンの記号」として保留 |
| 2026-06-21 | Logo (`orbit` wordmark + `◯`) は `ink` 単色 | 主役 UI との視線競合を避ける |
| 2026-06-21 | StatusHero 状態色: working=primary / off=ink-muted / pause=friction | accent を状態色に使わず "成長" 用途で保留、Friction タグと pause を同色化して伝達一貫性 |
| 2026-06-21 | dialog backdrop = ink 色 32% + blur 8px (フォールバック 48% blur なし) | 黒ではなくネイビーで覆い Ledger 世界観の連続性、視認性 (3:1 floor) も担保 |
| 2026-06-21 | border 2 階層: 3:1 floor 必須箇所 = border-strong、それ以外 = border | 規約を WCAG 1.4.11 チェックポイントと 1:1 対応させ、現場の揺れを根絶 |
| 2026-06-21 | Spacing は中庸スケール (py-12 / space-y-12 / p-7 / gap-4) | sample 準拠だと業務 UI でスクロール量過多、現状維持では Ledger の白余白が出ない |
| 2026-06-21 | Inter weight を 300〜600 に拡張 (見出し 300 / 本文 400 / 強調 500 / CTA 600 / 数値 mono 400) | sample 優美さの正体は装飾ではなく weight contrast。装飾量を増やさず質を上げる |
| 2026-06-21 | 数値は原則 JetBrains Mono を全底適用 (StatTile / タイマー / カウント / %) | Ledger 生命線は桁揃え。ライト基調で羊皮紙色の補強を失う代替 |
| 2026-06-21 | 長文ブロックは line-height 1.65 / max-w-prose (60-75ch) / 段落間 0.75em | Task メモ / Friction 説明など実用文章の可読性確保 |
| 2026-06-21 | アニメは初期描画 1 回のみ。リスト追加・タブ切替で fadeIn 発火しない | 「触ったときだけ動く」原則を厳格化、Stage 2 の摩擦削減と整合 |
| 2026-06-21 | Recharts `isAnimationActive={false}` | グラフのデータ精度感をアニメで揺らさない、Stage 2 思想と整合 |
| 2026-06-21 | ThenVsNowChart Now 線 = accent (Then = ink-muted) | accent 用途規約 (a) と一致、Now を「成長のシグナル」として強く出す |
| 2026-06-21 | Favicon = 純粋な ◯ (ink stroke 2.5px、SVG マスター + PNG 16/32/192/512 + apple-touch 180) | wordmark との完全一致が最強、装飾追加せず |
| 2026-06-21 | Tasks 状態表現 = バッジ + ワンクリック昇格 (open→in_progress→done) | 5 状態の全体感がバッジで一目、進行は 1 クリック、blocked/archive は誤クリック保護でメニュー |
| 2026-06-21 | Tasks 編集 = 行頭バッジ inline + 「⋯」メニュー (8 割 inline / 2 割メニュー) | 危険操作 (削除/blocked/archive) を 1 つ隔てる、リスト視覚を静かに保つ |
| 2026-06-21 | Tasks 作成 = 行末インラインフィールド (Enter 連続) | 棚卸し時の連続打ちが最高速、カテゴリは前回保持で摩擦解消 |
| 2026-06-21 | Tasks 削除は確認ダイアログ必須 (ネイティブ `<dialog>` + danger button) | テキストリンク削除の誤クリック事故を防ぐ |
| 2026-06-21 | Tasks フィルタ状態は URL クエリで保持 (`?status=&category=`) | リロード/共有/戻る対応、Stage 2 アクセシビリティ原則と整合 |
| 2026-06-21 | ThenVsNowChart 主役 = Donut 2 枚 (Then / Now) + デルタ表 + 期間タブ | コンセプト「比較ナラティブ」と整合、Heer et al. の "2 スナップショット" 行動変容研究を根拠、連続時系列は折りたたみに降格 |
| 2026-06-21 | 期間タブ = 4w / 8w / 12w / all、デフォルト 8w、Then/Now は自動 2 分割 | 学習コスト最小、MIN_WEEKS_FOR_SIGNAL=2 と整合 (最小 4w = Then/Now 各 2w) |
| 2026-06-21 | スライス上限 = 上位 4 モード + 「その他」 | Cleveland-McGill の角度限界 (5 未満) と整合、Tooltip で「その他」内訳開示 |
| 2026-06-21 | デルタ最大の 1〜2 モードをルールベースで文章化、5pp 未満は「変化見えず」文 | 「何が変わった?」の読み取りをユーザーに丸投げしない、LLM 不要で実装軽い |
| 2026-06-21 | StatTile (Then→Now 比率 2 枚) は廃止、デルタ表に統合 | 同じ情報を 2 箇所に出さない、視覚優先順位整理 |
| 2026-06-21 (改) | **「1 PR 全置換」を撤回 → HEAD 統合ベースのスタック PR (A=純ビジュアル / B=Tasks / C=ThenVsNow)** | grill 指摘: 純ビジュアルと挙動変更の同梱が「回帰=視覚層のみ」前提 (§1.4) を破壊、revert 単位が分離できない。中間状態回避はマージ順序 (A 先行) で担保 (§10.1) |
| 2026-06-21 (改) | **accent は非テキスト専用に確定、Button に accent variant を作らない** | WCAG 実測で accent 白文字 = 3.26:1 (4.5:1 不合格)。文字に使えないため非テキスト (Donut/✓/glyph) へ用途確定し、押せない CTA variant を型から除外 (§3.1/§3.3/§7.1) |
| 2026-06-21 (改) | **WCAG 実測を実装後 Task7 → 着手前ゲート (A2) に前倒し** | accent/border の値確定が世界観の再決定になり得るため、手戻り最小の位置へ (§9.1/§10.2) |
| 2026-06-21 (改) | **border 2 階層の運用明確化: 機能的境界は border-strong、`border` は純装飾罫のみ** | `border` (#e3e8ef) は canvas 上 1.12:1 で 1.4.11 の 3:1 未達。情報を持つ境界に使うと違反 (§3.1/§9.1) |
| 2026-06-21 (改) | **CTA への moveInBottom delay (750ms) を撤廃、delay は非操作要素のみ** | sample `_button.scss:67-70` の観光 LP 初回演出を業務道具の入力導線に移植すると毎日の待ち時間化、§1.3 の 200-500ms 規律にも違反 (§6.1/§6.3/§7.1) |
| 2026-06-21 (改) | **keyframe は px 距離を明示固定** (moveInBottom `translateY(20px)` 等) | sample は root 62.5% (1rem=10px)、Orbit は 1rem=16px。rem 直写で距離が 1.6 倍になり手触りが変わる (§6.1/§5.3) |
| 2026-06-21 (改) | **Inter `@import` を `wght@300;400;500;600` に拡張** | `_typography.scss` は 400/700 で 300 は sample 由来でない。h1=300 は Orbit 独自判断、import 未拡張だと fallback 400 に落ちる (§4.2) |
| 2026-06-21 (改) | **Radio/Input は兄弟フラット構造で実装** (`<label>` ラップ不可) | Tailwind `peer-checked`/`peer-placeholder-shown` は兄弟セレクタ。視覚要素を label 子孫に置くと届かず無反応 (§7.7/§7.8) |
| 2026-06-21 (改) | **ThenVsNow ナラティブに標本量ゲート追加 + accent は改善方向のみ** | 片側 1 週のノイズで「+18pp 改善」断言や、退行 (debug 増) を緑で祝う事故を防ぐ (§7.9) |
| 2026-06-21 (改) | **§5.3「70% 圧縮が原則」を撤回、マッピング表が唯一の正** | 実比率は 50-80% でバラバラ。単一比率での機械的導出は誤り (§5.3) |
| 2026-06-21 (改) | **挙動変更 (PR B/C) は testing.md 準拠でユニットテスト同梱** | 状態遷移/URL同期/ナラティブ生成は手動巡回でなくテストで守る (§10.3-10.5/§14) |
| 2026-06-21 (改) | **スタイルは3層 (Tailwind / globals.css 素 CSS / CSS Modules opt-in)。全面 SCSS 化は不採用** | Tailwind 表現力不足は誤診 (書けない物は元々 globals.css 行き)。per-component CSS はトークン規律喪失・二重体系・bundle 増を招く。Tier 3 は PR A で実証してから (§7.0) |

---

## 13. Open Questions

**全クローズ済み (2026-06-21)**。設計判断はすべて Decision Log §12 に記録。新たな疑問は §12 へ追記運用。
実装時に詰める運用パラメータは 1 点のみ: ThenVsNow 標本量ゲートの下限値 (`MIN_WEEKS_PER_SIDE` /
`MIN_MINUTES_PER_SIDE`) を PR C 実装時に ADR 005 と整合させて確定 (§7.9)。

---

## 14. Acceptance

### 14.1 PR A — 純ビジュアル刷新

- [ ] `globals.css` / `tailwind.config.ts` が新トークン体系に完全置換 (旧名残ゼロ)
- [ ] 旧トークン参照 **+ 生 Tailwind パレットクラス** (`bg-neutral-*`/`bg-blue-*`/`text-red-*`/`divide-neutral-*`) の残ヒット 0 件 (`rg`)
- [ ] Inter `@import` に weight 300 が含まれ、h1 が実際に 300 で描画される
- [ ] `pnpm exec tsc --noEmit` / `pnpm build` グリーン
- [ ] 3 ページ (Today / Then vs Now / Tasks) の主要動線が視覚崩れなく動作 (Tasks/ThenVsNow は現構造のまま配色のみ)
- [ ] **WCAG AA 主要組合せ実測値を PR に貼付** (着手前ゲートで確認済の値)。accent は文字に使われていない / 機能的境界は border-strong
- [ ] sample 由来アニメ (button hover lift + glow `scaleX1.4/scaleY1.6`、radio reveal、input label lift) の再現確認。**CTA に delay 演出が付いていない**
- [ ] Radio / Input が checked / placeholder-shown の双方で実際に反応する (兄弟マークアップ検証)
- [ ] `prefers-reduced-motion: reduce` でアニメが無効化されることを確認
- [ ] Stage 2 の規律 (装飾削減、状態機械単一表示、focus-visible) が新パレットで維持
- [ ] **主観ゲート**: 3 ページを並べて「Orbit と識別できるか / 銀行テンプレートの域を超えているか」を本人が確認

### 14.2 PR B — Tasks 再設計

- [ ] バッジ昇格の副作用 (`started_at`/`completed_at`) が ADR 005 状態機械と整合
- [ ] ⋯メニューが APG Menu Button (or `<dialog>`) 契約を満たす / バッジに `aria-label`
- [ ] デフォルトフィルタ + 昇格で「操作行が消える」事故が起きない (§7.12.5)
- [ ] 状態遷移グラフ / URL 同期 / 空文字バリデーションのユニットテスト (testing.md 80%)
- [ ] `tsc --noEmit` / `pnpm build` グリーン + Before/After スクショ

### 14.3 PR C — ThenVsNow 再設計

- [ ] 標本量ゲートが片側データ不足時に「判断に十分なデータがありません」を返す
- [ ] accent ▲ が退行 (負の/悪化方向の変化) に付かない
- [ ] ナラティブ生成 / 集計 / 標本量ゲートのユニットテスト (testing.md 80%)
- [ ] `tsc --noEmit` / `pnpm build` グリーン + Before/After スクショ

### 14.4 統合 (HEAD → main)

- [ ] PR A → B → C の順でマージ済、各層で中間状態の色混在がない
- [ ] `feat/rebrand-front-design` → `main` のマージ PR で全 Acceptance を最終確認
