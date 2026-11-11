# Kanaku — user app

Next.js (App Router) + TypeScript + Tailwind v4. Designs: `Kanaku-Design/` (SVG is the source of truth).

## Setup

```bash
cp .env.example .env.local
npm install        # also installs Husky hooks
npm run dev
```

## Checks

`npm run lint` · `npm run typecheck` · `npm run format:check` · `npm run check:lines` (500-line limit) · `npm run build`

- pre-commit: lint-staged (Prettier + ESLint) and `tsc --noEmit`
- pre-push: lint, typecheck, line-limit, build

## Structure

`src/app` routes/layouts/route handlers only · `src/components/ui` primitives · `src/components/layout` app shell ·
`src/features/<domain>` domain code · `src/config` static config (nav) · `src/services` backend clients · `src/utils` pure helpers.
Design tokens live in `src/app/globals.css` (`@theme`).

## Status

Phase 1 (foundation) done. Auth, onboarding, finance modules, BFF and landing page are pending; the sidebar user in
`src/app/(app)/layout.tsx` is a placeholder until real auth lands.
