# Orbit

開発作業ログ + 成長観察アプリ。

時間管理ツールではなく、開発者ワークフローの **ボトルネック** と **成長** を可視化することを目的とする。

> 詳細: [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md)

## アーキ概要

- **Frontend**: React + Vite (Cloudflare Pages)
- **Backend**: Go + chi + sqlc (Google Cloud Run)
- **DB**: Neon PostgreSQL（開発時は Docker Postgres）

詳細: [docs/ADR/](./docs/ADR/)

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) | プロダクト概要・原則 |
| [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) | テーブル定義・ER |
| [docs/API_DESIGN.md](./docs/API_DESIGN.md) | エンドポイント設計 |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phase 1〜5 |
| [docs/MVP_TODO.md](./docs/MVP_TODO.md) | Phase 1 TODOチェックリスト |
| [docs/IMPLEMENTATION_ORDER.md](./docs/IMPLEMENTATION_ORDER.md) | 推奨実装順序 |
| [docs/DIRECTORY_STRUCTURE.md](./docs/DIRECTORY_STRUCTURE.md) | ディレクトリ構成 |
| [docs/ADR/](./docs/ADR/) | アーキ判断記録 |

## クイックスタート（TBD）

Phase 1 Week 1 で `make` ターゲットを整備する。

```sh
make db-up         # ローカル Postgres 起動
make migrate-up    # マイグレーション
make run-api       # backend (localhost:8080)
make run-web       # frontend (localhost:5173)
```

## ステータス

🚧 **Phase 1 開発中**（ドキュメント完成・実装未着手）
