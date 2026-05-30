# ADR 003: ローカルActivity収集はPhase 2以降に分離する

## Status

Accepted — 2026-05-30

## Context

Orbitの将来像には、ローカルマシンから以下を自動収集する機能がある:

- git branch
- repository name
- project path
- active app name
- window title

これらを Phase 1 から組み込む選択肢もあった。

## Decision

**Phase 1ではローカル収集を実装しない**。
将来 Phase 2以降で **独立した Go CLI Agent** として実装する。

ただし、Phase 1で以下は準備する:

- `activity_events` テーブル定義
- `POST /v1/activity-events` ingest API の雛形（認証 + バリデーション + 保存のみ）
- レート制限の枠

## Rationale

### Phase 1 で入れない理由

1. **MVPの焦点がブレる**
   Phase 1の目的は「手動ログ + ボトルネック可視化」。
   自動収集を入れると、設計の関心が「収集精度・OS差分・パッケージング」に流れる。

2. **OS依存が大きい**
   macOS（Accessibility API）、Windows（UI Automation）、Linux（X11/Wayland）で実装が完全に異なる。
   Phase 1で複数OS対応を始めると、すべてが半端になる。

3. **プライバシー設計を急ぐべきでない**
   window title / app name は機密情報を含みうる。
   Phase 1のユーザー（自分）でも、後から「これは送りたくなかった」と気付くケースがある。
   フィルタリング設計を慎重に行うべき。

4. **手動ログが十分価値を出せるか先に検証する**
   Work Slice / Friction の手動入力UIが「3秒で記録できる」設計なら、
   自動収集の優先度は下がる可能性がある。先にそれを確かめる。

### 別バイナリにする理由

- WebサーバとCLIで配布・更新サイクルが異なる
- ローカル権限（Accessibility / Disk Access）はCLI単独で要求した方が透明
- CLI は将来 Rust や Swift に置き換える余地を残せる
- Cloud Run のコードベースを軽く保つ

## Phase 1 で準備するもの

### `activity_events` テーブル

- 雛形だけ作る（[DATA_MODEL.md](../DATA_MODEL.md) 参照）
- インデックス・パーティショニングは Phase 2 で再設計

### ingest API

- `POST /v1/activity-events` (bulk OK)
- APIキー認証
- バリデーション（必須フィールド・サイズ上限）
- レート制限（簡易）
- **集計・参照APIは Phase 2 で作る**

## Consequences

### Positive

- MVPが小さく保てる
- ローカル収集の設計を後で落ち着いて決められる
- プライバシーフィルタを慎重に設計できる
- WebとCLIが独立してリリース可能

### Negative

- Phase 1のユーザー（自分）は手動入力しか使えない
- Activity Eventのスキーマが Phase 2 で大きく変わる可能性がある
  → 雛形テーブルは migration で気軽に変更できる前提とする

## Notes

- 将来のCLI Agentが送る内容は **集約せず生のイベントを送る** が、
  AI日報に渡すのは **集約後のサマリのみ** とする（プライバシー原則）
- CLI Agentの送信先URLとAPIキーは設定ファイルで管理
- 本ADRの方針は [ADR 004](./004-pivot-to-growth-sensation.md) (成長実感装置への方向転換) で **強化される**: 手動入力の UX を完成させてから自動化に進む順序を再確認
