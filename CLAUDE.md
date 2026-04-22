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
```

One-off maintenance scripts (run via `tsx`):

```bash
npm run script:associate-courses   # Link purchased courses to users in Sanity
npm run script:fix-orders          # Repair order key consistency
npm run script:instagram-auth      # OAuth flow to mint an Instagram long-lived token
npm run script:generate-favicons   # Regenerate favicon set with sharp
```

No test runner is configured — do not claim tests pass; verify manually in the browser.

## Architecture

### Rendering + routing
- Next.js 16 **App Router** with React 19. Routes live directly under `app/` (not grouped) — e.g. `app/terrarios`, `app/cursos`, `app/talleres`, `app/proyectos`, `app/mi-cuenta`, `app/checkout`, `app/carrito`.
- `app/studio` embeds the Sanity Studio in-app (configured via `sanity/sanity.config.ts`).
- `middleware.ts` uses `next-auth/middleware` to gate `/mi-cuenta`, `/mis-cursos`, `/mis-pedidos`. Next.js 16 deprecates `middleware` in favor of `proxy`, but next-auth hasn't migrated yet — the warning is expected; do not rewrite until next-auth supports proxy.

### Data layer — Sanity as source of truth
- Schemas live in `sanity/schemas/` (terrarium, course, courseAccess, order, supply, workshop, blogPost, newsletter, user).
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

`env.example` is the canonical list. Minimum to boot: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Flow, Resend, Upstash, and Instagram vars are required in production but degrade gracefully in dev.

## Reference docs

- `ARCHITECTURE.md` — deeper rationale and folder map
- `docs/` — UI guidelines, SEO strategy, Instagram integration notes
- `production-checklist.md` — pre-launch gate
- `ASSETS_CHECKLIST.md` — content/media deliverables
