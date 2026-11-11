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

## Deploying to Vercel

The website (Next.js) deploys to Vercel as is. The optional realtime notification server
(`server/realtime.ts`, Socket.IO) can't run on Vercel because it needs a long-lived process; host it
separately (Render, Railway, Fly.io...) or skip it: everything still works, the notification badge
just updates on navigation instead of instantly.

**1. Vercel project settings.** Import the repo, framework "Next.js", defaults for build (`npm run build`)
and install. Don't set `NEXT_DIST_DIR`.

**2. Environment variables** (Project > Settings > Environment Variables, Production):

| Variable                                                                       | Value                                                                                                                                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`, `MONGODB_DB`                                                    | Your Atlas connection string and database name                                                                                                                   |
| `SESSION_SECRET`                                                               | 32+ random characters. Required in production: the app refuses to start without it                                                                               |
| `DATA_ENCRYPTION_KEY`                                                          | Optional. Key for encrypting authenticator secrets (falls back to `SESSION_SECRET`). Keep it stable: changing it makes existing authenticator secrets unreadable |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Outgoing e-mail. Required: sign-up and password-reset codes are e-mailed, and production never prints them                                                       |
| `SUPPORT_EMAIL`, `SUPPORT_API_KEY`                                             | Support address (and where new tickets go), and the key for the support team's reply endpoint                                                                    |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`                                   | The website and the API. Both `https://growwithkanaku-user.vercel.app` while it is one deployment                                                                |
| `COOKIE_DOMAIN`                                                                | Only if the API gets its own address on a sibling subdomain: the shared parent, e.g. `.example.com`                                                              |
| `APP_ORIGIN`                                                                   | `https://growwithkanaku-user.vercel.app`. Used for links in e-mails                                                                                              |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`            | Razorpay keys (use Live keys for real payments)                                                                                                                  |
| `NEXT_PUBLIC_REALTIME_URL`                                                     | Only if you host the realtime server: its public URL (`https://...`)                                                                                             |

If you reuse a database that already has users, use the **same** `SESSION_SECRET` / `DATA_ENCRYPTION_KEY` as
before, or those users' authenticator secrets can't be decrypted.

**3. MongoDB Atlas.** Network Access must allow Vercel: add `0.0.0.0/0` (Vercel's IPs change).

**4. Razorpay.** Add a webhook for `payment.captured` and `order.paid` pointing at
`https://growwithkanaku-user.vercel.app/api/billing/webhook`, with the secret you put in
`RAZORPAY_WEBHOOK_SECRET`.

**5. Realtime server (optional).** On its host run `npm ci && npm run realtime:start` with
`MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET` (same as Vercel), `REALTIME_PORT` (or the host's `PORT`) and
`APP_ORIGIN=https://growwithkanaku-user.vercel.app`. Then set `NEXT_PUBLIC_REALTIME_URL` on Vercel to its URL and
redeploy. Browsers connect with a short-lived token from `/api/realtime/token`, so the two can be on different domains.

**6. Domain.** The session cookie is `Secure` in production, so use the https URL.

## Status

Auth (with authenticator two-step), onboarding, transactions, budgets, categories, recurring payments, reports,
notifications (with realtime), settings, billing (Razorpay), help & support, and e-mail are built on MongoDB.
