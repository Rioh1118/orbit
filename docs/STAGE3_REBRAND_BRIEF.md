# Stage 3 — Frontend Rebrand 方針ブリーフ

**Status**: 計画中 (`feat/rebrand-front-design`)
**Branch**: `feat/rebrand-front-design`
**関連**: [DESIGN_CONCEPT.md](./DESIGN_CONCEPT.md) / [STAGE2_UI_BRIEF.md](./STAGE2_UI_BRIEF.md) / `sample/` (Natours 教材)

> このドキュメントは「なぜ Stage 3 をやるのか」「どのデザイン方向に振り直すか」を固定するためのもの。
> Stage 2 で構造を簡素化し WCAG AA を担保した上で、Stage 3 は **見た目とインタラクションの質感**を刷新する。
> 機能追加はゼロ。純粋にビジュアル / マイクロインタラクションの層を入れ替える。

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
| `--color-border` | `#e3e8ef` | カード / Divider / NavLink 下線 (静的罫、3:1 不問) | — |
| `--color-border-strong` | `#c9d2dc` | フォーム入力枠 / KeyCap / focus-visible outline (**3:1 floor 必須箇所**) | 3:1 floor |
| `--color-ink` | `#0b1d35` | 主要テキスト・見出し (深いネイビー) | canvas で 13:1+ |
| `--color-ink-muted` | `#5a6b80` | 副次テキスト・ラベル・hint | canvas で 4.5:1+ |
| `--color-primary` | `#0d3b66` | 主要 CTA / NavLink active | white text で 10:1+ |
| `--color-primary-hover` | `#0a2d4f` | hover/active | — |
| `--color-accent` | `#00a368` | growth / 成長 / 進捗 (Resona グリーン寄り) | white text で 4.5:1+ |
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
| **accent = 成長/振り返り示唆専用** | `accent` (グリーン) は **(a)** `ThenVsNowChart` の Now 線、 **(b)** 「前より速い」「改善した」バッジ、 **(c)** 完了チェックの fill — の 3 用途のみ | 「リスロン」のサインを画面に強く出すための保留色。CTA で消費しない |
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

Stage 2 の `400/500/600` から **`300〜600`** に幅を広げる。`sample/sass/base/_typography.scss` の優美さの
正体は装飾ではなく**字重コントラスト**だったため、ここを Orbit に翻訳する。

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

### 5.3 sample (rem 62.5%) → Tailwind (px) 換算メモ

`sample/sass/base/_base.scss:9-24` は `html { font-size: 62.5% }` で 1rem = 10px。値を直接持ち込むと
Orbit (業務 UI) には過大なので **70% 圧縮** が原則。

| sample | sample 実 px | Orbit 採用 px | Tailwind |
|---|---|---|---|
| `1.5rem 4rem` (btn padding) | 15 / 40 | 10 / 20 | `py-2.5 px-5` |
| `3rem` (gap) | 30 | 20 | `gap-5` |
| `6rem` (gutter-vertical) | 60 | 40 | `py-10` |
| `8rem` (gutter-vertical 大) | 80 | 48 | `py-12` |
| `2rem` (margin-bottom 小) | 20 | 16 | `mb-4` |

---

## 6. Motion — Sample 流儀の移植

`sample/` (Natours) の純 CSS アニメの「触り心地」を、装飾過剰にならない範囲で Orbit に移植する。

### 6.1 採用するアニメ語彙

| 名前 | 起点 | 用途 | 持続 |
|---|---|---|---|
| `moveInBottom` | `sample/sass/base/_animations.scss:33-43` | StatTile / Hero / 主要 CTA の初期描画 | 500ms / `ease-out` / delay 750ms / `fill-mode: backwards` |
| `moveInLeft` / `moveInRight` | 同 1-31 | ページ単位の見出し用 (控えめに) | 500ms |
| `fadeIn` | (新規追加) | モーダル背景のみ (リスト要素には**使わない**、§6.3) | 200ms |
| `scaleIn` | (新規追加) | バッジ初期描画のみ | 150ms |
| Button hover lift + ::after グロー | `_button.scss:19-27, 54-65` | 全ボタン共通 | transition 200ms / glow 400ms |
| Button active sink | `_button.scss:29-34` | クリック瞬間の `translateY(-1px)` | 200ms |
| Radio reveal | `_form.scss:86-104` | ModeSelector / FrictionModal | opacity 200ms |
| Input label lift | `_form.scss:39-52` | フォームのラベル浮上 | 300ms |
| NavLink underline slide | (新規) | ヘッダーナビの active 表現 | 250ms / `::after width 0→100%` |

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
   アニメで意図的な間を挟まない。
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

### 7.1 `Button` (`components/ui/Button.tsx`)

**現状**: フラットな border + bg。hover で border 色だけ変わる。
**新仕様**:
- variants: `primary` (ネイビー fill / white text) / `accent` (グリーン fill / white text) / `subtle`
  (white bg / border / ink text) / `ghost` (text のみ)
- ベース: `rounded-md`、`px-4 py-2`、`transition-all duration-200`、`relative isolate`
- hover: `translate-y-[-2px]`、`shadow-md`、`::after` (同色拡大グロー、opacity 0)
- active: `translate-y-[-1px]`、`shadow-sm`
- focus-visible: outline `primary` 2px / offset 2px
- disabled: `opacity-40 cursor-not-allowed transform-none shadow-none`
- `--animated` 相当: `animation: moveInBottom 500ms ease-out 750ms backwards` を初期 CTA でのみ付与

**意図**: sample の「押すと持ち上がってグロウが弾ける」手触りを移植。ただし grow は柔らかく
(opacity 0 まで 400ms)、計器世界観から逸脱しない範囲。

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

**仕様**:
- `<input type="radio" class="peer sr-only">` + `<label>` パターン
- ラベル内に `<span>` を置いて視覚 radio (`h-5 w-5 rounded-full border-2 border-primary`) を描画
- 内側ドット (`::after` または子 span): `bg-primary` 円、`opacity-0 transition-opacity duration-200`、
  `peer-checked:opacity-100`
- ラベル全体に `cursor-pointer`、`padding-left` で視覚 radio 分の余白

**意図**: `sample/sass/components/_form.scss:65-104` の流儀をそのまま移植。Tailwind の `peer-checked`
変種で SCSS の `~` 兄弟セレクタを代替。

### 7.8 `Input` (新規 `components/ui/Input.tsx`)

**仕様**:
- `<label>` をラップし、Floating Label 的に: input が `placeholder-shown` のときラベルが浮上前の位置
  (`opacity-0 translate-y-[-1rem]`)、入力開始でラベルが上部に表示
- input の border は `border-b-2 border-border-strong`、focus で `border-b-2 border-primary`
- focus 時に弱い `shadow-md` を input に
- invalid (`:focus:invalid`) で border を `danger` に

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
| デルタ表 | 各行に `mode label` + `Then% → Now%` + `▲/▼ Npp`。最大変化のモード行だけ ▲ を `accent` 色、それ以外は `ink-muted` |
| ナラティブ文 | **ルールベース生成**: Now 期間の上位 N モードのうち、絶対値で **変化が最大の 1〜2 モード**を文章化。閾値 5pp 未満なら「まだ変化が見えていない」文を出す |
| 連続時系列 (旧) | `<details>` で「週次推移を見る」折りたたみ。中身は現 `AreaChart` (`stackOffset="expand"`) を維持、トークンだけ Stage 3 化 |
| Tooltip / Axis | `ink-muted`、数値 `font-mono` (§4.3) |

**ナラティブ生成ルール** (擬似コード):

```
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
入りは `⋯` メニュー。色は §3.3 用途規約と連続 (done = accent は「成長 / 完了」の用途内)。

#### 7.12.3 編集 — 行頭バッジ + 「⋯」メニュー

- **inline**: ステータスバッジクリックのみ
- **「⋯」メニュー** (`<details>` ベース、Stage 2 のキーボード対応継承):
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
| `white` / `accent` | 4.5:1 | バッジ・CTA |
| `border` / `canvas` | 3:1 | UI 区切り (1.4.11) |
| focus-visible outline / 背景 | 3:1 | 全インタラクティブ要素で確認 |

未達なら token 値を調整 (border-strong の用意はそのための予備車線)。

### 9.2 モーション

- `prefers-reduced-motion: reduce` で keyframes 無効化
- アニメ要素の `aria-live` は変えない (`StatusHero` は `polite`)
- フォーカス可能な要素のフォーカス時に位置がズレない (transform は hover/active のみ、focus では使わない)

### 9.3 その他

- `<dialog>` のネイティブ `Esc` / `backdrop click` を維持
- Skip-link のフォーカス時可視を新パレットで再確認 (`focus:bg-primary focus:text-white`)
- フォーム invalid 状態は border 色 + `aria-invalid` + ErrorText の三重表現

---

## 10. 実装計画 (1 PR / 全置換)

範囲 (Stage 3 全タスクは `feat/rebrand-front-design` の 1 PR にまとめる):

| Task | 内容 | 見積 |
|---|---|---|
| 0 | 旧トークン参照棚卸 (`rg`) | 0.5h |
| 1 | `globals.css` + `tailwind.config.ts` 刷新 | 1h |
| 2 | UI プリミティブ書き換え (Button/Card/Badge/Divider/ErrorText/KeyCap) + 新規 (Radio/Input) | 3h |
| 3 | Orbit components (CategoryTabs/FrictionItem/ModeBar/StatTile/StatusHero) 更新 | 1.5h |
| 4 | `App.tsx` + 3 ページ更新 | 2h |
| 5 | `features/*` の旧トークン参照置換 + フォーム系を新 Input/Radio へ移行 | 2h |
| 6 | Recharts 配色 (ThenVsNowChart) | 1h |
| 7 | WCAG 実測 + token 微調整 | 1h |
| 8 | ビルド (`tsc --noEmit`、`pnpm build`) + 3 ページ手動巡回 | 0.5h |

コミット分割 (Conventional Commits):

```
refactor(theme): replace dark tokens with light "Ledger" palette
refactor(ui): rebuild Button/Card/Badge primitives with sample-style motion
feat(ui): add Radio and Input primitives (sample-style)
refactor(orbit): apply new tokens to orbit components
refactor(pages): apply new tokens to App and pages
refactor(features): migrate feature components to new primitives
refactor(chart): apply Ledger palette to ThenVsNowChart
chore(a11y): verify WCAG AA on new palette and tune tokens
```

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
| sample 由来の `rem` (62.5% 前提) と Tailwind の `px` ベースのズレ | Med | sample の `rem` 値は Tailwind スケールに翻訳 (`1.5rem` → `py-3` 等) |
| 業務時間中のライト基調が夜間使用で眩しい | Low | 本リブランドではテーマ切替を提供しない (将来 Observatory を dark mode として復活する余地は token 設計で残す) |

---

## 12. Decisions Log

| 日付 | 決定 | 根拠 |
|---|---|---|
| 2026-06-21 | ライト基調へ全面刷新 (ダーク維持しない) | 業務道具としての信頼感を優先、テーマ切替のメンテ負債を回避 |
| 2026-06-21 | アニメは純 CSS (Framer Motion 不採用) | sample 流儀の手触りを直接再現、bundle 増加ゼロ |
| 2026-06-21 | 1 PR で全置換 (Phase 分割しない) | 中間状態 (旧色と新色の混在) を作らない |
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

---

## 13. Open Questions

**全クローズ済み (2026-06-21)**。実装着手前に固めるべき設計判断は Decision Log §12 にすべて記録した。
新たな疑問が発生した場合は §12 に追記する形で運用する。

- [x] ~~パレット値の最終確定~~ → A 案 (`#0d3b66 / #00a368 / #f5f7fa`)
- [x] ~~StatusHero 状態色~~ → working=primary / off=ink-muted / pause=friction
- [x] ~~`dialog::backdrop`~~ → ink 32% + blur 8px (フォールバック 48% blur なし)
- [x] ~~Spacing scale~~ → 中庸 (py-12 / space-y-12 / p-7 / gap-4)
- [x] ~~Typography weight~~ → 300〜600 拡張
- [x] ~~モーション射程~~ → 初期描画 1 回のみ
- [x] ~~Recharts アニメ~~ → `isAnimationActive={false}`
- [x] ~~数値等幅規約~~ → JetBrains Mono 全底
- [x] ~~長文可読性~~ → line-height 1.65 / max-w-prose / 60-75ch

---

## 14. Acceptance

- [ ] `globals.css` / `tailwind.config.ts` が新トークン体系に完全置換 (旧名残ゼロ)
- [ ] 旧トークン参照のリポジトリ内残ヒット 0 件 (`rg` で確認)
- [ ] `pnpm exec tsc --noEmit` / `pnpm build` グリーン
- [ ] 3 ページ (Today / Then vs Now / Tasks) の主要動線が視覚崩れなく動作
- [ ] WCAG AA 主要組合せ実測値を PR に貼付
- [ ] sample 由来アニメ (button hover lift + glow、radio reveal、input label lift、moveInBottom)
      の再現確認
- [ ] `prefers-reduced-motion: reduce` でアニメが無効化されることを確認
- [ ] Stage 2 の規律 (装飾削減、状態機械単一表示、focus-visible) が新パレットで維持
