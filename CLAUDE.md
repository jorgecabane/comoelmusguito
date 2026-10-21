# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**comoelmusguito** — Next.js 16 storefront + LMS for Tomás Barrera: artisanal terrariums, online courses, in-person workshops, and blog content. Content is served from Sanity; payments go through Flow (Chile). Spanish is the primary language for UI copy and content.

## Commands

```bash
npm run dev           # Next.js dev server (default: localhost:3000)
npm run build         # Production build (Turbopack)
npm run build:webpack # Production build using Webpack (fallback)
npm run start         # Serve the production build
npm run lint          # ESLint (eslint-config-next)
npm run typecheck     # tsc --noEmit
npm test              # Vitest unit tests (colocated *.test.ts)
npm run test:coverage # Unit tests + coverage gate (90% lines/branches/functions/statements)
npm run e2e           # Playwright: seeds the Sanity `test` dataset, builds, starts on :3100, runs all roles
npm run e2e:ui        # Playwright UI mode
npm run e2e:seed      # Re-seed only the `test` dataset (refuses any other dataset)
```

Run a single test: `npx vitest run lib/flow/utils.test.ts` / `npx playwright test e2e/anon/cart.spec.ts --project=anon`.

One-off maintenance scripts (run via `tsx`):

```bash
npm run script:associate-courses   # Link purchased courses to users in Sanity
npm run script:fix-orders          # Repair order key consistency
npm run script:instagram-auth      # OAuth flow to mint an Instagram long-lived token
npm run script:generate-favicons   # Regenerate favicon set with sharp
```

## Workflow & quality gates

- **Branches:** `main` = production (comoelmusguito.cl). `develop` = live dev environment (dev.comoelmusguito.cl). Feature branches `feat/*`, `fix/*`, `chore/*` → PR to `develop` → PR `develop` → `main`. Never push to `main`/`develop` directly; both are protected and require approval from @jorgecabane (`.github/CODEOWNERS`) plus green CI.
- **dev.comoelmusguito.cl uses production data and payment credentials** (same Sanity dataset, real Flow). Only `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` are overridden for the `develop` branch in Vercel. Anything you buy or edit there is real. It is not indexed (`app/robots.ts`).
- **Husky:** pre-commit runs lint-staged (ESLint) + typecheck + unit tests; pre-push runs coverage + full E2E. CI (`.github/workflows/ci.yml`) runs the same and is the real gate — `--no-verify` doesn't get you past it.
- Commits: Conventional Commits in Spanish, e.g. `feat(checkout): ...`, `fix(studio): ...`.

## Testing

- **Unit (Vitest):** colocate `foo.ts` → `foo.test.ts`. Coverage scope is `lib/**`, `app/api/**`, `sanity/lib/**`, `middleware.ts`; pages/components are covered by E2E. Mock boundaries only (Sanity client, Resend, fetch, next-auth, Upstash) with `vi.mock`; env with `vi.stubEnv`. Every change to a file in scope ships with tests that keep it ≥90%; payment/order/stock/auth code needs its failure branches tested too.
- **E2E (Playwright):** run against Sanity dataset **`test`**, never `production` (`e2e/env.ts` forces it and blanks Resend/Flow/PayPal/reCAPTCHA/Upstash creds; `scripts/seed-e2e.ts` refuses other datasets). Many runs (CI + every dev's pre-push) share the dataset concurrently: catalog fixtures (products, courses, workshop, blog) have fixed `e2e-` ids, are seeded idempotently by `scripts/seed-e2e.ts` and are **read-only** for tests; mutable fixtures (users, orders, course access, gift) are per run (`E2E_RUN_ID`, ids `e2e-run-<runId>-…`), created by `e2e/global-setup.ts` and deleted by `e2e/global-teardown.ts`. **Tests may only mutate per-run fixtures or data they create themselves.** Import fixtures from `e2e/fixtures.ts`. Specs live per role: `e2e/anon`, `e2e/customer`, `e2e/buyer` (sessions created by `e2e/auth.setup.ts`). New user-facing flow ⇒ new spec. Accessible locators only (`getByRole`/`getByLabel`), no fixed waits; tests that create data use unique emails and clean up.
- Don't claim tests pass without running them; still check UI changes in the browser.

## Architecture

### Rendering + routing
- Next.js 16 **App Router** with React 19. Routes live directly under `app/` (not grouped) — e.g. `app/terrarios`, `app/cursos`, `app/talleres`, `app/proyectos`, `app/mi-cuenta`, `app/checkout`, `app/carrito`.
- `app/studio` embeds the Sanity Studio in-app (configured via `sanity/sanity.config.ts`).
- `middleware.ts` uses `next-auth/middleware` to gate `/mi-cuenta` (courses and orders live there via `?filter=`). Next.js 16 deprecates `middleware` in favor of `proxy`, but next-auth hasn't migrated yet — the warning is expected; do not rewrite until next-auth supports proxy.

### Data layer — Sanity as source of truth
- Schemas live in `sanity/schemas/` (terrarium, course, courseAccess, order, supply, workshop, blogPost, newsletter, user).
- **Datos personales = `_id` privado.** El dataset es público (plan free); solo los `_id` con punto quedan ocultos sin token. Todo `user`, `order` y `newsletterSubscriber` se crea con `newPrivateId()` (`sanity/lib/client.ts`). Nunca leas esos tipos con un cliente sin token. Migración histórica: `scripts/migrate-private-ids.ts`.
- **All data access goes through `lib/sanity/`** helpers — never call the Sanity client directly from components:
  - `fetch.ts` — base queries
  - `orders.ts`, `inventory.ts`, `course-access.ts`, `gifts.ts`, `newsletter.ts`
- The Sanity client is instantiated in `sanity/lib/` with the public project id/dataset and server-only `SANITY_API_TOKEN` for writes.

### Payments — Flow (Chile)
- Stripe is deprecated; Flow is the live processor. Integration lives in `lib/flow/` (client + utils).
- Checkout flow: `app/checkout` → `app/api/checkout` → Flow → webhook at `app/api/webhooks` → order updates in Sanity via `lib/sanity/orders.ts`.
- `FLOW_ENV=sandbox` vs `production` switches the base URL.

### Auth
- NextAuth v4 with a **custom Sanity adapter** at `lib/auth/sanity-adapter.ts`. Users are Sanity documents (`sanity/schemas/user.ts`).
- Server-side session helper: `lib/auth/get-session.ts`.
- Email verification is gated by `REQUIRE_EMAIL_VERIFICATION` (defaults to true).

### Rate limiting
- `lib/rate-limit/` wraps Upstash Redis + `@upstash/ratelimit` to protect login, registration, checkout, and contact endpoints.
- **If Upstash env vars are missing, requests are allowed through** (see commit `764ba4e`). Do not change this fallback without discussion — it keeps local dev and unconfigured previews functional.

### State — Zustand
- Client stores in `lib/store/` (cart is the main one). Always import via the store hooks; do not mutate state directly.

### Other integrations
- **Resend** (`lib/resend/`) — transactional emails (order confirmation, course access, newsletter).
- **Instagram Basic Display API** (`lib/instagram/`) — feed on home. Long-lived token auto-refreshes via a Vercel cron (`CRON_SECRET`-protected endpoint) that calls the Vercel API to update the env var.
- **Upstash Redis** — rate limiting (see above).
- **@vercel/og** — dynamic OG images at `app/api/og`.

### Components
- `components/ui/` — primitives; `components/shared/` — Header/Footer/Cart; `components/sections/` — narrative page sections; plus feature folders (`product`, `courses`, `cart`, `blog`, `orders`, `auth`, `studio`, `animations`, `social`).
- Animations use Framer Motion, GSAP, and `@react-spring/web`. Prefer CSS transitions for simple effects; reach for JS libs only when necessary.

## Conventions

- **Spanish** for user-facing copy, route slugs (`terrarios`, `cursos`, `talleres`, `mi-cuenta`), and Sanity field labels. Code identifiers stay in English.
- Tailwind CSS 4 via `@tailwindcss/postcss`. Design tokens (colors "musgo/tierra/vida/ambar", Playfair Display + Inter) are documented in `docs/UI_GUIDELINES.md` and `README.md`.
- Prefer Server Components by default; add `"use client"` only when interactivity requires it.
- When adding features that read/write user-owned data, go through the Sanity helpers in `lib/sanity/` — don't duplicate query logic in route handlers.

## Environment

Environments: local (`.env.local`, production values), `develop` → dev.comoelmusguito.cl (Vercel Preview, branch-scoped overrides), `main` → production. E2E/CI → dataset `test`. See `CONTRIBUTING.md`.

`env.example` is the canonical list. Minimum to boot: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Flow, Resend, Upstash, and Instagram vars are required in production but degrade gracefully in dev.

## Reference docs

- `CONTRIBUTING.md` — onboarding, branch/PR flow, testing rules
- `ARCHITECTURE.md` — deeper rationale and folder map
- `docs/` — UI guidelines, SEO strategy, Instagram integration notes
- `production-checklist.md` — pre-launch gate
- `ASSETS_CHECKLIST.md` — content/media deliverables
