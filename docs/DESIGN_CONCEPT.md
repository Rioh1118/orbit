# Orbit — Design Concept "Observatory"

> **整合注記**: Stage 2 (`feat/ui-simplify`) で UI 簡素化を実施済み。維持: カラートークン。削減: radial gradient
> 背景・glow・3書体目 (Source Serif 4)・mono uppercase の計器ラベル装飾。主役化: 状態機械の現在状態
> (`StatusHero`, 単一・等価重み・`aria-live`)。加えて WCAG 2.2 AA / WAI-ARIA APG (focus-visible・ネイティブ
> `<dialog>`・コントラスト) を担保。世界観は維持しつつ、毎日触る道具としての摩擦と誤解を減らす方針。

## Vision

Orbit は **観測装置 (observatory)**。
ユーザーは観測する側に立つ。自分の開発という軌道を、薄暗い観測室で計器越しに眺める。

これは時間管理ツールでも、SNSでもない。
ストリーク、ランキング、通知ベル — 派手な達成感色は持ち込まない。
代わりに「同じ作業、前より速く解けるようになった?」という一つの問いに、
**静かに、しかし精度高く** 答える。

## Mood

| 軸 | 意味 |
|---|---|
| 静謐 (quiet by default) | モーション最小、彩度抑制 |
| 計器の精度 (measured) | 数値は等幅、軸ラベル小さく |
| 羊皮紙の温度 (warmth reserved) | 温かい記録色 (parchment) を1色だけ対比に使う |
| 観測者の視座 (observer) | 操作対象ではなく対話対象 |

## Color Tokens

| Token | Hex | Role |
|---|---|---|
| `--color-canvas` | `#213448` | 夜空 — 主背景 |
| `--color-surface` | `#283e54` | canvas を一段上げた面 |
| `--color-elevated` | `#2f4760` | さらに上げる場合 |
| `--color-instrument` | `#547792` | 計器のフレーム — primary, border |
| `--color-mist` | `#94b4c1` | 霞 — 補助文字, 線, フォーカスリング |
| `--color-parchment` | `#eae0cf` | 羊皮紙 — 本文, 数値 |
| `--color-parchment-muted` | `#c9c0ad` | parchment 弱 |
| `--color-growth` | `#7fb28e` | 成長(Then vs Now 減少時) — 滅多に使わない |
| `--color-friction` | `#d4a574` | 詰まり(琥珀。羊皮紙と兄弟) |
| `--color-danger` | `#b66b6b` | 危険 — ほぼ使わない |

冷たい構造 3 + 温かい記録 1 の対比が、データ的厳密さ × 個人的な成長物語、を同時に表現する。

> **コントラスト (WCAG 1.4.3 AA)**: parchment/mist/parchment-muted はいずれも canvas・surface 上で 4.5:1 以上。
> `danger` をテキストに使うと surface 上 2.78:1 で不足するため、エラーは parchment テキスト + danger アクセント
> (`ErrorText`, `role="alert"`) で表現する。フォーカスリングは mist (canvas 上 5.79:1 ≥ 3:1) を使用 — instrument は
> 2.69:1 で不足。

## Typography

| Family | Use |
|---|---|
| Inter | UI・ボタン・見出し・ラベル・ナビ・セクション見出し (sentence case) |
| JetBrains Mono | 数値・計測時間・キーキャップ・pattern_tag など **データのみ** |

> Stage 2 で簡素化: Source Serif 4 は Insight 廃止により撤去 (2書体構成)。
> Mono は「計器ラベル」装飾としての uppercase + tracking 用途をやめ、データ表現に限定。
> ラベル類は Inter の sentence case に統一し、毎日触る道具としての軽さを優先する。

## Component Vocabulary

### Primitives (`src/components/ui/`)

| Component | 比喩 |
|---|---|
| `Card` | 計器パネル — 1px の instrument border |
| `Button` | primary / ghost |
| `Badge` | カテゴリ片 — mode / pattern_tag 用 |
| `KeyCap` | キーヒント — 1キー入力UI (Stage 2 で軽量化: 影・濃い面を除去) |
| `Divider` | 計器の罫線 — label 付き |
| `ErrorText` | エラー — parchment テキスト + danger アクセント, `role="alert"` |

### Orbit固有 (`src/components/orbit/`)

| Component | 比喩 |
|---|---|
| `StatusHero` | 現在ただ1つの状態 (作業中 / 計測対象外 / 作業していません / 確認が必要) を等価な重みで大きく提示。左端アクセントバー + `aria-live` で誤解ゼロ。`ActiveSliceBanner` を置換 |
| `ModeBar` | 1キー付き棒グラフ (mode×driver の配分) — 計器盤の主役 |
| `StatTile` | 単一指標 — 数値は mono の 3xl |
| `FrictionItem` | 詰まりログ — pattern_tag 必須 |
| ~~`InsightItem`~~ | 削除 (ADR 005 で Insight を defer)。`InsightItem.tsx` も撤去 |
| `ThenVsNowChart` | 4週分の mode 別 stacked area (proportion) |
| `CategoryTabs` | category 軸切替 — 計器の選択ダイヤル |

## Anti-patterns

- 緊急感を煽る赤・オレンジを多用しない
- アニメーションで気を引かない
- Streak / 連続日数 / 達成バッジは入れない (プロダクト原則3)
- チャートのラベルを増やさない — 軸の数字は最小限
- 写真、ビビッドなグラデーション、装飾色 — 観測室の暗さを汚す
- フォーカスリングを消さない (`focus-visible` は必須・mist 2px)。色だけで状態を伝えない (アイコン/ラベル併用)

## Future

- Phase 2 (Captain's Log) で言葉に温度を持たせたくなったら、その時点で書体を再検討する
- Phase 4 (Loop自動検出) で「クラスタ識別子」用の低彩度シアン系を1色だけ追加予定
