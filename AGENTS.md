# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
The optional EasyLand **feature layer** adds server code (`app/api/*` route handlers, `app/admin/`, `lib/mongo.ts`, `lib/auth.ts`) that only runs in the backend build (`EASYLAND_BACKEND=1` → `output: standalone`). Before touching it, read `node_modules/next/dist/docs/` on **route handlers** and **static-exports** (the latter explains why `output: "export"` can't contain dynamic routes). See `PROMPT.md` → "Feature layer".

This template also ships two **integration points** that must keep working in a
static export (no server): the **Cal.com embed** (`components/cal-embed.tsx`, a
plain `<iframe>` — never add the embed `<script>`) and the **lead form**
(`lib/leads.ts` → `NEXT_PUBLIC_N8N_WEBHOOK_URL`, falling back to `POST /api/leads`
only when a backend feature is on). Both read `NEXT_PUBLIC_*` env, so they are
inlined at build time.
