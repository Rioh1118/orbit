.PHONY: help db-up db-down db-reset migrate-up migrate-down sqlc run-api run-web fmt test lint

help:
	@echo "Orbit Makefile"
	@echo ""
	@echo "DB:"
	@echo "  db-up         Start local PostgreSQL via docker-compose"
	@echo "  db-down       Stop local PostgreSQL"
	@echo "  db-reset      Drop and recreate local DB"
	@echo "  migrate-up    Apply all pending migrations"
	@echo "  migrate-down  Revert last migration"
	@echo "  sqlc          Regenerate sqlc code"
	@echo ""
	@echo "Run:"
	@echo "  run-api       Start backend API (localhost:8080)"
	@echo "  run-web       Start frontend dev server (localhost:5173)"
	@echo ""
	@echo "Quality:"
	@echo "  fmt           Format Go and TS code"
	@echo "  test          Run all tests"
	@echo "  lint          Run linters"

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-reset:
	docker compose down -v
	docker compose up -d postgres

migrate-up:
	cd backend && goose -dir db/migrations postgres "$$DATABASE_URL" up

migrate-down:
	cd backend && goose -dir db/migrations postgres "$$DATABASE_URL" down

sqlc:
	cd backend && sqlc generate

run-api:
	cd backend && go run ./cmd/api

run-web:
	cd frontend && pnpm dev

fmt:
	cd backend && gofmt -w .
	cd frontend && pnpm format

test:
	cd backend && go test ./...
	cd frontend && pnpm test

lint:
	cd backend && go vet ./...
	cd frontend && pnpm lint
