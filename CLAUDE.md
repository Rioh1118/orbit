# Orbit Development Guide

## Product

Orbit is a developer work log and growth observation app.

It records development work as:

- Task
- Work Slice
- Friction
- Activity Event

Orbit is not a generic time tracker.
It is a tool for understanding developer workflow bottlenecks and growth.

## Architecture

This is a cloud web application.

Frontend is deployed to Cloudflare Pages.
Backend is a Go API deployed to Google Cloud Run.
Database is Neon PostgreSQL.

Do not use Tauri.
Do not use Cloudflare D1 for the main database.
Do not implement local activity monitoring in Phase 1.

## Tech stack

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Recharts

Backend:

- Go
- chi
- pgx
- sqlc
- goose

Database:

- PostgreSQL
- Neon for cloud
- Docker PostgreSQL for local development

## MVP policy

Phase 1 focuses on manual logging:

- Task CRUD
- Work Slice start/end
- Work mode selection
- Friction logging
- Daily summary
- Basic analytics

## Future local integration

Local activity collection should be implemented later as a separate Go CLI.

The local agent may collect:

- git branch
- repository name
- project path
- active app name
- window title

It should send data to the Cloud Run API.

## Engineering principles

- Keep domain logic independent from HTTP handlers.
- Keep SQL explicit and reviewable.
- Use migrations for schema changes.
- API handlers should be thin.
- Services should contain usecase logic.
- Repositories should contain DB access.
- AI reports should receive aggregated summaries, not raw activity logs.
- Treat privacy as a core product value.
