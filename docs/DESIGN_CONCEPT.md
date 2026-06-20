# Orbit — Design Concept "Observatory"

> **整合注記**: [ADR 005](./ADR/005-craft-time-model.md) で UI 簡素化 (Observatory 装飾の削減・テーマ素朴化) を
> Stage 2 (`feat/ui-simplify`) として実施予定。`InsightItem` は Insight 削除に伴い廃止、`ModeBar` は
> mode×driver 表示に拡張、状態機械 (単一現在活動) の UX を主役に据える。本書の世界観は維持しつつ、
> 凝った装飾は検証済みの情報構造に対して最小限にする。

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
| 羊皮紙の温度 (warmth reserved) | Insight本文だけが温かい |
| 観測者の視座 (observer) | 操作対象ではなく対話対象 |

## Color Tokens

| Token | Hex | Role |
|---|---|---|
| `--color-canvas` | `#213448` | 夜空 — 主背景 |
| `--color-surface` | `#283e54` | canvas を一段上げた面 |
| `--color-elevated` | `#2f4760` | さらに上げる場合 |
| `--color-instrument` | `#547792` | 計器のフレーム — primary, border |
| `--color-mist` | `#94b4c1` | 霞 — 補助文字, 線 |
| `--color-parchment` | `#eae0cf` | 羊皮紙 — 本文, 数値, Insight |
| `--color-parchment-muted` | `#c9c0ad` | parchment 弱 |
| `--color-growth` | `#7fb28e` | 成長(Then vs Now 減少時) — 滅多に使わない |
| `--color-friction` | `#d4a574` | 詰まり(琥珀。羊皮紙と兄弟) |
| `--color-danger` | `#b66b6b` | 危険 — ほぼ使わない |

冷たい構造 3 + 温かい記録 1 の対比が、データ的厳密さ × 個人的な成長物語、を同時に表現する。

## Typography

| Family | Use |
|---|---|
| Inter | UI、ボタン、見出し |
| JetBrains Mono | 数値、1キー、計器ラベル、ナビ |
| Source Serif 4 | Insight本文のみ — 言葉に温度を持たせる |

Mono の uppercase + `tracking-instrument` (0.08em) で「計器ラベル」感、
Serif で「個人的な記録」感を担保。

## Component Vocabulary

### Primitives (`src/components/ui/`)

| Component | 比喩 |
|---|---|
| `Card` | 計器パネル — 1px の instrument border |
| `Button` | primary / ghost |
| `Badge` | カテゴリ片 — mode / pattern_tag 用 |
| `KeyCap` | 物理キー — 1キー入力UI |
| `Divider` | 計器の罫線 — label 付き |

### Orbit固有 (`src/components/orbit/`)

| Component | 比喩 |
|---|---|
| `ActiveSliceBanner` | 進行中の観測 — 左端に細い緑、glow |
| `ModeBar` | 1キー付き棒グラフ (mode×driver の配分) — 計器盤の主役 |
| `StatTile` | 単一指標 — 数値は mono の 3xl |
| `FrictionItem` | 詰まりログ — pattern_tag 必須 |
| ~~`InsightItem`~~ | 削除 (ADR 005 で Insight を defer)。`InsightItem.tsx` も撤去 |
| `ThenVsNowChart` | 4週分の mode 別 stacked area |
| `CategoryTabs` | category 軸切替 — 計器の選択ダイヤル |

## Anti-patterns

- 緊急感を煽る赤・オレンジを多用しない
- アニメーションで気を引かない
- Streak / 連続日数 / 達成バッジは入れない (プロダクト原則3)
- チャートのラベルを増やさない — 軸の数字は最小限
- 写真、ビビッドなグラデーション、装飾色 — 観測室の暗さを汚す

## Future

- Phase 2 (Captain's Log) で Source Serif 4 の出番が広がる
- Phase 4 (Loop自動検出) で「クラスタ識別子」用の低彩度シアン系を1色だけ追加予定
