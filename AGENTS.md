# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
The optional EasyLand **feature layer** adds server code (`app/api/*` route handlers, `app/admin/`, `lib/mongo.ts`, `lib/auth.ts`) that only runs in the backend build (`EASYLAND_BACKEND=1` → `output: standalone`). Before touching it, read `node_modules/next/dist/docs/` on **route handlers** and **static-exports** (the latter explains why `output: "export"` can't contain dynamic routes). See `PROMPT.md` → "Feature layer".

**i18n:** the site is bilingual (ru + en) and has **no root `app/layout.tsx`**.
`app/[[...lang]]/layout.tsx` is the site's root layout — an optional catch-all, so
it can read the locale and set `<html lang>`; `app/admin/layout.tsx` is a second
root layout for the dashboard. `lib/lang.ts` owns `LOCALES`, the default locale
(`NEXT_PUBLIC_SITE_LOCALE`) served at `/`, and the `/<locale>/` prefix for the
rest — both prerendered via `generateStaticParams`, because a static export has no
proxy and cannot redirect. Content is split contract-from-copy: `content/types.ts`
(the `Site` + `Ui` interfaces), `content/<locale>/site.ts` (marketing copy),
`content/<locale>/ui.ts` (labels, errors, admin, emails) and `content/index.ts` (the
registry). Never hardcode a user-visible string in a component.

This template also ships two **integration points** that must keep working in a
static export (no server): the **Cal.com embed** (`components/cal-embed.tsx`, a
plain `<iframe>` — never add the embed `<script>`) and the **lead form**
(`lib/leads.ts` → `NEXT_PUBLIC_N8N_WEBHOOK_URL`, falling back to `POST /api/leads`
only when a backend feature is on). Both read `NEXT_PUBLIC_*` env, so they are
inlined at build time.
