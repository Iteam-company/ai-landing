# EasyLand Template Contract & Generation Prompt

This file is the shared blueprint for **every** `template-*` repo in the
[`EasyLandingPage`](https://github.com/EasyLandingPage) org. Each template is a
standalone Next.js landing page with **different UI**, but the **same contract**
below, so the `easy-landing-cli` can discover, preview, clone and seed any of
them interchangeably.

This repo (`template-agency-ai-landing`) is the AI Agency / n8n Automation
Studio template.

---

## What a template is

A full, deployable Next.js (App Router) landing page that:

- builds to a **static export** (`output: "export"`) by default, or a **Node
  server** (`output: "standalone"`) when a backend feature is enabled,
- is driven by a small set of **blocks** (sections),
- supports a few interchangeable **color palettes**,
- and (TPL-2) reads its content from the client's own **Storyblok** space.

The CLI never edits a template's code — it clones it as-is into a per-client
project, sets the palette + tokens, and seeds the client's Storyblok space.

## The contract (required in every template)

1. **`easyland.template.json` manifest** at the repo root. The CLI reads this.
   Required keys: `id`, `repo`, `label`, `description`, `version`,
   `preview { cmd, port, colorParam }`, `palettes[] { id, label, accent, bg }`,
   `defaultPalette`, `paletteEnvVar`, `blocks[] { name, component, label }`.
2. **Palette system** (see below) — at least 2 palettes, switchable by
   `?color=<id>` in dev preview and by `paletteEnvVar` at build time.
3. **Conditional build** — `next.config.ts` sets `output: backend ? "standalone" :
   "export"`, `images.unoptimized: true`, `trailingSlash: !backend`.
4. **Semantic design tokens** — components style via the shared token utilities
   (`bg-bg`, `bg-bg-card`, `text-fg`, `text-fg-muted`, `bg-accent`,
   `text-accent-fg`, `border-border`, and this template's `shadow-node` /
   `shadow-node-hover` / `shadow-btn`), never hardcoded brand colors, so palettes
   can re-skin the whole UI by redefining CSS variables.
5. **Blocks** — each section is a self-contained component listed in the
   manifest `blocks[]`. (TPL-2: each maps to a Storyblok component via
   `BlockProvider`, with a missing-component guardrail.)
6. **Feature layer** — `lib/features.ts`, the conditional `output` in
   `next.config.ts`, `app/api/*` route handlers + `app/admin/`, `lib/mongo.ts` +
   `lib/auth.ts`, and the feature UI blocks (`booking`, `customer-access`). All
   env-gated; see "Feature layer" below. Every template ships this, in parity.

## How the CLI describes this template (`easyland.template.json`)

`easy-landing-cli` has **no hardcoded template list** — it lists the org's
`template-*` repos from the GitHub API and parses each repo's
`easyland.template.json` to build the picker. So this file *is* the template's
description; keep it accurate.

| field | type | the CLI uses it for |
| --- | --- | --- |
| `id` | string | short id (e.g. `agency-ai`) |
| `repo` | string | the repo name (`template-…-landing`) |
| `label` | string | the option label shown in the picker |
| `description` | string | fallback blurb — the repo's GitHub "About" is shown first; this fills in only if "About" is empty |
| `version` | string | informational |
| `preview.cmd` | string | dev command for preview + scaffold (default `npm run dev`) |
| `preview.port` | number | informational — the CLI assigns a free port via `PORT` |
| `preview.colorParam` | string | palette query param for preview (default `color`) |
| `palettes[]` | `{ id, label, accent, bg }` | the palette choices (the CLI uses the `id`s) |
| `defaultPalette` | string | the build-time default palette |
| `paletteEnvVar` | string | env var the build reads (`NEXT_PUBLIC_SITE_PALETTE`) |
| `blocks[]` | `{ name, component, label }` | block inventory (docs + future Storyblok seeding) |
| `content` | `{ source, locales, defaultLocale, localeEnvVar, note }` | informational |
| `storyblok` | `{ status, note }` | informational (TPL-2) |

A `template-*` repo with no `easyland.template.json` still appears, but only with
its name + GitHub description and a placeholder palette — so always ship this file.

## Palette system (how it works)

- `app/globals.css` declares the **default palette** in Tailwind v4 `@theme`
  (this generates the `bg-*`/`text-*`/`shadow-*` utilities) and one
  `[data-palette="<id>"] { … }` block per alternative palette that re-defines
  the same `--color-*` / `--shadow-*` variables.
- `app/layout.tsx` sets `<html data-palette={resolvePalette(process.env.NEXT_PUBLIC_SITE_PALETTE)}>`
  (build-time palette, static-export safe).
- `components/palette-preview.tsx` (client) reads `?color=` from the URL and
  overrides `data-palette` for **local preview only** — it uses
  `window.location` (not `useSearchParams`) so no Suspense boundary is needed.
- `lib/palettes.ts` is the single source of truth for palette ids; keep it in
  sync with the CSS blocks, `lib/site-meta.ts` and the manifest.
- **All palettes must be dark.** The UI uses `white/x` overlay utilities that
  assume a dark background; a light palette would break them without a refactor.

## Feature layer (required contract)

Optional, env-gated features. With none enabled the template is the same static
landing page as before; the CLI decides which a client gets at onboarding.

- **`lib/features.ts`** (client-safe) reads `NEXT_PUBLIC_EASYLAND_FEATURES` (comma
  list); `hasFeature(id)` gates each block at the composition root. Never render a
  feature block unconditionally.
- **`next.config.ts`** reads `EASYLAND_BACKEND`: `output: backend ? "standalone" :
  "export"`, `trailingSlash: !backend`. **`output:"export"` forbids dynamic route
  handlers**, so a *static* client must not contain `app/api`/`app/admin` — the CLI
  prunes them at scaffold time. The template itself contains the routes and so
  builds in backend mode (`EASYLAND_BACKEND=1 npm run build`).
- **`lib/mongo.ts`** — cached `MongoClient` from `MONGODB_URI`/`EASYLAND_DB_NAME`;
  `bookings` + `customers` collections (JSON-shaped docs), plus this template's
  `leads`. **`lib/auth.ts`** — bcrypt + a `jose` JWT httpOnly cookie for
  customers; `ADMIN_USER`/`ADMIN_PASS` for `/admin`. Both import `server-only` and
  must only be used by `app/api/*`.
- **Routes:** `app/api/bookings` (POST public, GET admin), `app/api/bookings/[id]`
  (PATCH/DELETE admin), `app/api/auth/{signup,login,logout,me}`, `app/api/admin/*`,
  and `app/api/leads` (POST public, GET admin). `params` is a Promise
  (`await params`); `cookies()` is async (`await cookies()`).
- **Blocks:** `components/sections/booking.tsx` (calendar) and
  `components/sections/customer-access.tsx` (customers) — client components styled
  with the shared semantic tokens, gated by `hasFeature`. `app/admin/page.tsx` is
  the leads + bookings + customers dashboard.
- **Email (optional):** `lib/mailer.ts` (nodemailer) + `lib/emails.ts` (theme-matched
  HTML) + `lib/site-meta.ts` (per-template `{ brand, accent }`). When `SMTP_*` env is
  set, the booking routes email the customer + admin on a new booking and the customer
  again on confirm, and `/api/leads` emails the admin on a new lead; no-op otherwise.
- **Manifest:** declare `features[] { id, label, requiresBackend }`, add feature
  blocks to `blocks[]`. New features go in the CLI catalogue
  (`easy-landing-cli/lib/config.mjs`) AND every template, together.

## This template (agency-ai)

- **Occupation:** AI-automation agency / n8n studio — sells AI agents (lead
  qualification, CRM assistant, RAG knowledge base) and n8n integrations.
- **Blocks:** header · hero (interactive node-flow canvas) · pains (2×2 hover
  grid) · solutions (four agent modules) · showcase (auto-playing lead pipeline) ·
  pricing (three tiers, middle recommended) · booking *(feature)* ·
  customer-access *(feature)* · contact (Cal.com embed + lead form) · footer.
- **Palettes:** `voltage` (electric lime, default) · `ember` (orange) · `plasma`
  (magenta) — all dark.
- **Visual language:** automation control room — vertical hairline rails, an
  accent bloom, orthogonal wire connectors carrying animated signal packets,
  corner registration brackets on panels, wide blocky monospace labels in
  uppercase, softly-rounded console panels. Fonts: Geologica (display),
  Martian Mono (mono), Golos Text (body) — all with Cyrillic.
- **Content:** the contract is types-only in `content/types.ts` (`Site` for
  marketing copy, `Ui` for interface chrome), the copy is one folder per locale
  (`content/ru/{site,ui}.ts`, `content/en/{site,ui}.ts`), and `content/index.ts` is
  the registry (`getContent(locale)` / `getUi(locale)`). The Storyblok wiring is
  TPL-2.
- **i18n (ru + en):** `lib/lang.ts` owns `LOCALES` and the routing shape — the
  default locale (`NEXT_PUBLIC_SITE_LOCALE`, default `ru`) is served at `/` and
  every other locale under `/<locale>/`. `app/[[...lang]]` is an optional
  catch-all whose layout is the site's root layout, so each locale is prerendered
  with its own `<html lang>`, canonical URL and `hreflang` alternates — no proxy,
  no redirect, static-export safe. `/admin` carries its own root layout and always
  renders in the default locale. `components/lang-switcher.tsx` is the header's
  `ru | en` switch. `app/api/*` is not localized — it answers in English and each
  form shows its own copy; the `locale` a form posts is data (stored on the lead /
  booking, forwarded to n8n, and picks the language of the visitor's booking
  emails).
- **Integrations (template-specific, static-export safe):**
  - **Scheduling** — `components/cal-embed.tsx` renders a plain `<iframe>` (no
    third-party script) from `NEXT_PUBLIC_CAL_LINK` (`"acme/30min"` →
    `https://cal.com/…`) or `NEXT_PUBLIC_CAL_EMBED_URL` (any other provider). It
    is used inline in the conversion zone and in the hero's booking modal
    (`components/call-modal.tsx`). Unset → a placeholder, never a dead frame.
  - **Lead intake** — `lib/leads.ts` picks the endpoint:
    `NEXT_PUBLIC_N8N_WEBHOOK_URL` (posts straight to an n8n Webhook node, works
    with no server) → else `POST /api/leads` when a backend feature is on → else
    the form disables itself and points at the contacts. The server route stores
    the lead, emails the admin and forwards to `N8N_WEBHOOK_URL`
    (`N8N_WEBHOOK_SECRET` becomes a bearer token) so both wirings trigger the
    same automation.

---

## Generation prompt — create a NEW `template-<occupation>-landing`

Use this to spin up another template with a **distinct UI** but the same contract:

> Build a standalone Next.js (App Router, static export) landing page for
> **<occupation>**. Follow the EasyLand template contract in this PROMPT.md
> exactly: ship an `easyland.template.json` manifest, the palette system
> (`globals.css` `@theme` default + `[data-palette]` blocks, `lib/palettes.ts`,
> `app/layout.tsx` wiring, `components/palette-preview.tsx`), the conditional build
> (`output: backend ? "standalone" : "export"`), the **feature layer** (see above:
> `lib/features.ts`, `lib/mongo.ts`, `lib/auth.ts`, `app/api/*`, `app/admin/`, the
> `booking` + `customer-access` blocks, manifest `features[]`), and semantic design
> tokens only. Give it **at least 3 dark palettes** suited
> to <occupation> and a block set appropriate to the vertical (each block a
> component listed in the manifest). The visual design should be clearly
> different from other templates — its own typography, layout rhythm, and motion
> — while reusing the same token names so palettes re-skin the whole page. If the
> content is not English, pick fonts that actually carry the script.
