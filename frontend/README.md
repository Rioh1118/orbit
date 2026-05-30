# Orbit Frontend

React app for Orbit. Deployed to Cloudflare Pages.

See:

- [../docs/API_DESIGN.md](../docs/API_DESIGN.md)
- [../docs/DIRECTORY_STRUCTURE.md](../docs/DIRECTORY_STRUCTURE.md)

## Stack

- React 18+
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Recharts

## Quick start (TBD — Phase 1 Week 1 で整備)

```sh
pnpm install
pnpm dev    # http://localhost:5173
```

## Layout

```
src/
  api/         # APIクライアント (fetch wrapper + envelope展開)
  components/  # 汎用UI
  features/    # 機能単位 (tasks / slices / frictions / reports / settings)
  hooks/       # 共通カスタムフック
  lib/         # 純粋ユーティリティ
  pages/       # ルートに対応するページ
  styles/      # globals.css (Tailwind)
```
