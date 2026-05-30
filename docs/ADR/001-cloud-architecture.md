# ADR 001: クラウドWebアーキテクチャを採用する（Tauri不採用）

## Status

Accepted — 2026-05-30

## Context

Orbitは開発者の作業ログを記録するアプリである。
アーキ選択肢として以下が検討された:

- **A. ローカルデスクトップアプリ** (Tauri / Electron)
  - SQLiteにローカル保存、UIはWebView
- **B. クラウドWebアプリ**
  - ブラウザUI + クラウドAPI + クラウドDB
- **C. ハイブリッド** (ローカル + クラウド同期)

主要な要求:

1. 複数端末（自宅Mac、会社PC、外出先のiPhone）から記録/閲覧したい
2. 将来 AI日報・Growth Graph を作るときにクラウド計算リソースが欲しい
3. 個人開発者の限られた工数で MVP を素早く出したい
4. 将来のローカルActivity収集（Phase 2）は **別バイナリのCLI Agent** として作れる

## Decision

**B. クラウドWebアプリ** を採用する。

- Frontend: React (Cloudflare Pages)
- Backend: Go API (Google Cloud Run)
- DB: Neon PostgreSQL

ローカル収集は Phase 2 以降に独立した **Go CLIエージェント** として実装し、
クラウドAPIに送信する形にする（[ADR 003](./003-local-agent-later.md) 参照）。

## Consequences

### Positive

- どの端末からでも記録/閲覧できる
- バックアップ・同期の自前実装が不要（DBに集約）
- クラウド側で集計・AI処理を実行できる
- フロントとバックの責務が明確に分離される
- デプロイがシンプル（CF Pages / Cloud Run の両方ともpush-to-deploy）

### Negative

- オフライン編集ができない（Phase 1では許容）
- ネットワーク遅延が UX に影響する（Tokyoリージョンで緩和）
- 無料tierでもコスト管理が必要（Cloud Run min-instances=0で対応）
- DBの可用性に全体が依存する（Neonの SLA に依存）

## Alternatives Considered

### A. Tauri（デスクトップアプリ）

却下理由:

- 複数端末からの利用が困難
- iPhone / iPadから記録できない
- 将来のAI処理をローカル端末でやるとマシンスペックに依存
- 同期機能を結局自前で書く必要があり、結果的にクラウド構成より複雑になる

### C. ハイブリッド（ローカル優先 + クラウド同期）

却下理由:

- 同期ロジック（コンフリクト解決、冪等性、順序保証）が個人開発のMVPには過剰
- Phase 1の目的（自分のワークフロー可視化）にはクラウドWebで十分

## Notes

- "Tauriを使わない" "Cloudflare D1を使わない" はプロダクト方針として確定
- ローカル収集はあくまで **別の独立プロセス** として後付け可能な設計を守る
