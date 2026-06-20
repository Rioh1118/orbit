# ADR 005: craft 時間モデルと状態機械への再設計

## Status

Accepted — 2026-06-20

## Context

ADR 004 で「成長実感装置」へピボットし、Task `category` / Work Slice `mode`+`density` /
Friction `pattern_tag` / Insight を定義した。記録側 (Task/Slice/Friction の CRUD) は実装されたが、
ドッグフードに入る前にコンセプトと実装のズレが再び顕在化した:

1. **価値側 (成長実感の出力) が実データで一度も動いていない。**
   - `ThenVsNowPage.tsx` は `WEEKS` / `INSIGHTS` / StatTile の数値まで**完全ハードコード**。
   - 集計は `SumWorkSlicesByModeInRange` 1本のみで、**全Task横断の mode 合計**。
     比較軸であるはずの `category` で facet していない (JOIN も絞り込みも無い)。
   - `insights` テーブル・domain・query は**未実装**。UI殻 (`InsightItem.tsx`) だけが存在。
   - つまり「同じ作業、前より速くなった?」をユーザー (= 開発者本人) は**偽データ越しにしか見ていない**。

2. **ドメイン語彙が実際の作業と合っていない (「コレジャナイ」)。** 特に:
   - `category` の `learning` は産出物の種類ではなく「不慣れか否か」という**別の軸**で、単一選択に混ざっていた。
   - 外部ドキュメント/RFC/新技術の**学習インプット時間**を表す mode が無く、`other` 送りになっていた。
   - AI に実装を任せている間の「舵取り」「AI出力レビュー」「セルフレビュー」を mode が表現できない。
   - `mode` が「1 Slice = 1 mode」の time-bucket 前提で、**休憩・会議など非craft時間の扱いが未定義**。
     状態機械にすると、止め忘れた区間が一晩回り続けてデータを汚染する (古典的タイマー問題)。

3. **入力サーフェスが原則2 (1キー・3秒) に対して重い。** `density` `severity` `Insight` は
   本人の検証ニーズ (どの作業が遅いか / 完了時間が下がるか) に対して未使用かつ入力コスト源。

本 ADR は、この grill (2026-06-20) で本人と合意した内容を正本として記録する。

## Decision

### 1. 比較単位を `{category × 時間窓}` のグロスに確定する

成長シグナルは「個別タスク間の生の完了時間比較」ではない (タスクサイズ差・AI confound で破綻する)。
**多数タスクを時間窓 (週/月) でグロス集計し、`category` で facet する**ことで、サイズ差は大数で平均化し、
種類差は facet で揃える。size 階級は導入しない (N を割らない・YAGNI)。N 不足時は非表示 (原則4)。

出力は 2 つ、いずれも category facet のグロス:
- mode 配分の推移 (例: `study`+`code_explore` の割合が痩せた = 習熟)
- 完了タスクあたりの自分時間の推移 (本人の言う「完了時間が下がってていいね」)

### 2. Work Slice を「作業区間 (Segment)」とし、相互作用を単一現在活動の状態機械にする

- **不変条件: ユーザーあたり「開いた区間」は常に高々1つ。** 新しい活動を宣言すると前の区間が自動 close
  (次の開始イベントが前の終了を兼ねる)。明示的な stop は別操作ではなく次の開始に内包される。
- 旧設計の「同時に複数オープン可」(DATA_MODEL 旧記述) は**廃止**。
- 汚染防止ガード:
  - **復帰時確認は常時ON** — アプリを開いた時に不自然に長く開いた区間があれば「閉じますか?」と確認。
    異常時のみ発火しナグらない。これが既定の汚染防止線。
  - **放置検知 (N分無操作で確認)** と **最大区間長 auto-close** は**ユーザー設定で opt-in + 閾値設定**。

### 3. 時間軸を WORK / 計測対象外 の直交2層にする

- **WORK (作業区間)**: `mode` × `driver` × task。これだけが成長集計に入る (= 自分時間)。
- **計測対象外**: reason ∈ {`break`(休憩), `meeting`(会議), `other`}。**分析しない**。
  記録目的は作業区間の境界を汚染なく締めることのみ (原則6「時間管理ではない」を守る)。
- `mode` は craft 専用。休憩・会議を `mode=other` に入れて自分時間を濁すことを禁止する。

### 4. `mode` を 11 値に再定義する (`study` 追加・review 統合)

`spec_read / task_breakdown / study / code_explore / design / implement / review / verify / debug / consult / other`

- **`study` を追加** — 外部ドキュメント/RFC/新技術そのものの習得。`spec_read` (タスク要件) とも
  `code_explore` (自repoコード) とも別。「learning は category ではなく mode」という結論の具体化。
- **`ai_review` + `human_review` を `review` に統合** — driver で区別でき、`review × solo` で
  セルフレビューも表現できる。レビューの give/receive 方向は Phase 1 では切り捨て。

### 5. `driver` 軸 (3値) を直交に追加する

`solo` / `ai` / `human`。各区間が `mode` と `driver` をちょうど1つずつ持つ。既定 `solo`、AI/human 時のみ1キートグル。

- 「手実装 → AI舵取り+レビューへのシフト」を観測可能にする (`implement × ai`, `review × ai` 等)。
- 全 mode に適用 (`study × ai` = AIにRFC要約させた、等)。

### 6. `category` を 6 値にする (`learning` 削除)

`new_feature / bug_fix / refactor / investigation / support / other`

`learning` は産出物の種類ではないため category から外す。学習は mode signature
(`study`+`code_explore` の割合が厚い) として第2層グロスで**自己申告なしに**観測する。

### 7. Friction を「停滞」とし、件数を主シグナルにする

- ユビキタス言語: 日本語「**停滞**」、コード `Friction`。
- **イベント (件数) が主シグナル**、解決ラグ (`resolved_at` がある時のみ) は任意の副シグナル。
- **時間として mode と合算しない** (区間タイムラインに重なる別レンズ。二重計上を禁止)。
- `pattern_tag` に **`waiting_ai` を追加して 11 値**。`severity` は削除。

### 8. 入力サーフェスの削減

- **Insight を削除** (defer)。検証すべきは定量ループ。効くと分かってから定性振り返り装置として後付けする。
- **density を削除**。
- **friction.severity を削除**。
- 旧 `friction.kind` 列は移行完了として削除。

### 9. ユビキタス言語 (確定版)

| 日本語 / コード | 定義 | 成長集計 |
|---|---|---|
| タスク / `Task` | 達成対象。`category` を1つ持つ | 器 |
| 作業区間 / `Segment` | 連続した能動 craft 時間帯。`mode`×`driver`×task を各1。現在は高々1つ | 入る (= 自分時間) |
| 停滞 / `Friction` | 進行が止まったイベント。`pattern_tag` で分類。時間として合算しない | 件数 (主) + 解決ラグ (任意) |
| 計測対象外 | 区間外時間。reason {break, meeting, other}。分析しない | 除外 |

### 10. 実装順序 (2段・別PR)

- **Stage 1 (`feat/craft-time-model`)**: migration (本 ADR の全スキーマ変更) + backend
  (状態機械の単一区間不変条件・自動close・設定サーフェス) + **category×時間窓グロス集計クエリ**
  (現状モックの心臓部) + 最小限の本物UIで配線 → 本人が 1〜2週ドッグフード。
- **Stage 2 (`feat/ui-simplify`)**: Observatory 装飾の削減・テーマ簡素化・状態機械UXの磨き込み。

「検証より設計に逃げる」罠を避けるため、Stage 1 で即ドッグフードに入る。
凝った/簡素を問わず UI の作り込みは検証済みの情報構造に対して行う。

### 11. 既存データ移行はしない

dev データのみのため、ADR 004 のような旧値マッピング UPDATE は行わない。
新 migration は CHECK 制約をクリーンに張り直し、`driver` は新規列として追加する。

## Consequences

### Positive

- 「同じ作業、前より速くなったか」を**実データで**初めて観測できる (心臓部の配線)。
- 直交軸 (mode ⊥ driver、WORK ⊥ 計測対象外) によりモデルが破綻しにくく、AI協働も表現できる。
- 状態機械 + 復帰時確認で「止め忘れ汚染」を構造的に防ぎ、ストレスのない UX の土台になる。
- 入力サーフェスが減り原則2 (1キー・3秒) に近づく。
- `learning` を mode signature 化したことで、成長がラベルではなく実時間として正直に出る。

### Negative

- スキーマ変更が大きい (mode 再定義 / driver 追加 / category 6値 / 計測対象外 / Insight・density・severity・kind 削除)。
- 状態機械の不変条件 (単一オープン区間・自動close) を backend で厳密に実装する必要がある。
- ユーザー設定サーフェス (idle/最大長の有無+閾値) という小さな新概念が増える。
- ADR 004 で定義した Insight が Phase 1 から外れ、PRODUCT_BRIEF の機能数が変わる。

## Alternatives Considered

- **A. 実データで回す優先 (棄却)**: 今ある enum のまま配線してドッグフードし、証拠が出てから直す案。
  本人が「コレジャナイ」を実装前から具体に言語化できたため、設計を先に確定する道 (本 ADR) を選んだ。
  ただし Stage 1 で即ドッグフードに入ることで A の利点 (早期検証) は取り込む。
- **B. size 階級で個別タスク比較 (棄却)**: 入力コスト増、個人開発では N が割れる。
  「グロスで見る」で size 差は大数平均に吸収できるため不要。
- **C. AI協働を mode に焼き込む (棄却)**: `implement_ai` `steer_ai` 等。mode が膨張し
  `debug × ai` のような組合せが表せない。直交 `driver` 軸で解決。
- **D. 会議を実質/儀礼で分類 (棄却)**: over-engineering。会議は craft の外として一律「計測対象外」。
  実際に craft の頭を使う協働は `mode × driver=human` として作業区間に記録される。
- **E. Insight を Phase 1 に残す (棄却)**: 本人の検証ニーズは定量。YAGNI に従い defer。

## 既存 ADR との関係

| ADR | 関係 |
|---|---|
| ADR 001 (クラウドWeb) | 変更なし |
| ADR 002 (Go + Cloud Run + Neon) | 変更なし |
| ADR 003 (ローカルAgent後回し) | 変更なし。`driver=ai` は手動記録であり自動収集ではない |
| ADR 004 (成長実感へのピボット) | **本 ADR が上書き・精緻化**。Insight 削除、mode/category/friction 再定義、状態機械化、比較単位の明確化 |

## Notes

- スキーマ詳細: [DATA_MODEL.md](../DATA_MODEL.md) を本 ADR に整合済み
- プロダクト定義: [PRODUCT_BRIEF.md](../PRODUCT_BRIEF.md) を本 ADR に整合済み
- 新 migration は `00010` 以降。`driver` 列追加 / `mode`・`category`・`pattern_tag` の CHECK 張り直し /
  `density`・`severity`・`kind` 列 DROP / 計測対象外テーブル (または区間 type フラグ) の追加。
- Stage 1 の実装プランは本 ADR 承認後に planner / tdd-guide で別途切る。
