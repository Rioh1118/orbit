# Orbit Backend

Go API for Orbit. Deployed to Google Cloud Run.

See:

- [../docs/API_DESIGN.md](../docs/API_DESIGN.md)
- [../docs/DATA_MODEL.md](../docs/DATA_MODEL.md)
- [../docs/DIRECTORY_STRUCTURE.md](../docs/DIRECTORY_STRUCTURE.md)

## Stack

- Go 1.22+
- chi (HTTP router)
- pgx (PostgreSQL driver)
- sqlc (SQL → Go codegen)
- goose (migrations)

## Quick start (TBD — Phase 1 Week 1 で整備)

```sh
make db-up         # docker-compose で Postgres 起動
make migrate-up    # goose でマイグレーション
make run-api       # API サーバー起動 (localhost:8080)
```

## Layout

```
cmd/api/             # エントリポイント
internal/
  config/            # 設定
  auth/              # APIキー検証
  domain/            # エンティティ + 不変条件
  service/           # ユースケース
  repo/              # DB I/O (sqlc ラッパ)
  httpapi/           # ハンドラ + ミドルウェア + レスポンス
  platform/          # DB接続, ロガー
db/
  migrations/        # goose
  queries/           # sqlc 入力
```
