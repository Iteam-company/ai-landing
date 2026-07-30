# template-agency-ai-landing

An EasyLand landing **template** — the **AI Agency / n8n Automation Studio**
vertical. A bilingual (ru/en) sales landing for an agency that builds AI agents and
n8n automations: an interactive node-flow hero, a pain grid, four agent modules,
an auto-playing architecture demo, three pricing tiers, and a conversion zone with
a Cal.com booking embed next to a webhook-backed lead form. It follows the shared
EasyLand contract (see `PROMPT.md`), so the `easy-landing-cli` can discover,
preview, clone and configure it per client.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export by default
npm run lint
```

Palette preview: append `?color=voltage|ember|plasma`. The build-time palette is
set by `NEXT_PUBLIC_SITE_PALETTE`, the default language by `NEXT_PUBLIC_SITE_LOCALE`.

## Highlights

- **3 dark palettes** — voltage (electric lime, default), ember, plasma.
  Fonts: Geologica + Martian Mono + Golos Text, all with Cyrillic and Latin.
- **Two languages, two prerendered pages** — Russian and English, with a `ru | en`
  switcher in the header. See "Content & i18n" below.
- **Interactive node flow** — `components/flow-diagram.tsx` is a miniature
  n8n-style canvas (lead ➔ AI analysis ➔ CRM) with orthogonal connectors carrying
  animated signal packets. Hover or focus a node to light it up.
- **Live architecture demo** — `components/sections/showcase.tsx` walks a lead
  through inbound lead ➔ AI analysis ➔ CRM deal ➔ Telegram alert on a
  loop; click any stage to take manual control. Static under
  `prefers-reduced-motion`.
- **Conversion zone** — an embedded Cal.com calendar (plain `<iframe>`, no
  third-party script, so it survives static export) beside a custom lead form.
  The hero's primary CTA opens the same calendar in a modal.
- **Feature layer** — optional, env-gated Business Calendar (`booking` + `/admin`)
  and Customer accounts. With no feature it's a static export; with one the CLI
  builds a Node server (`output: standalone`) backed by the client's MongoDB. See
  `PROMPT.md` → "Feature layer".

## Wiring the integrations

Both are `NEXT_PUBLIC_*`, so they are inlined at build time — set them in `.env`
(committed, non-secret) or on the deploy host.

| env | what it does |
| --- | --- |
| `NEXT_PUBLIC_CAL_LINK` | Cal.com link, e.g. `neuroflow/30min` → `https://cal.com/neuroflow/30min` |
| `NEXT_PUBLIC_CAL_EMBED_URL` | any other provider's embed URL (Calendly, Zcal…); wins over `CAL_LINK` |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | the lead form posts straight here — works with **no server** |
| `N8N_WEBHOOK_URL` | server-side forward from `POST /api/leads` (backend builds) |
| `N8N_WEBHOOK_SECRET` | sent as `Authorization: Bearer …` on that forward |

Lead form fallback order: `NEXT_PUBLIC_N8N_WEBHOOK_URL` → `POST /api/leads`
(only when a backend feature is on) → the form disables itself and points the
visitor at the email/Telegram contacts beside it. Nothing is ever posted into the
void.

## Build modes

| | Build | Needs |
| --- | --- | --- |
| No feature | static export (`output: export`) | static host; lead form → n8n webhook |
| Backend feature on | `EASYLAND_BACKEND=1` → `output: standalone` | Node host + `MONGODB_URI` |

## Content & i18n

One folder per locale, and the contract lives apart from the copy:

```
content/
  types.ts        Site + Ui interfaces — the contract, no copy
  index.ts        registry: getContent(locale) · getUi(locale)
  ru/ site.ts     marketing copy      ru/ ui.ts     interface strings
  en/ site.ts                         en/ ui.ts
```

`site` is the marketing copy each section reads (the Storyblok-seedable shape);
`ui` is the chrome that is not marketing copy — button states, aria labels, form
placeholders, error copy, the admin panel and the emails. The copy
shipped here is demo content (brand "Neuroflow", placeholder prices and contacts).
Storyblok wiring is TPL-2.

Routing, from [`lib/lang.ts`](lib/lang.ts) — static-export safe, no proxy and no
redirect on the canonical URL:

| | URL | |
| --- | --- | --- |
| default locale (`NEXT_PUBLIC_SITE_LOCALE`, defaults to `ru`) | `/` | prerendered |
| every other locale | `/en/` | prerendered |

`app/[[...lang]]` is an optional catch-all, so both pages come out of
`generateStaticParams` with the right `<html lang>`, canonical URL and `hreflang`
alternates. `NEXT_PUBLIC_SITE_LOCALE=en` flips it: English at `/`, Russian at
`/ru/`. The header's `ru | en` switcher (`components/lang-switcher.tsx`) links
between them.

Adding a language: add the id to `LOCALES` in `lib/lang.ts` (plus its `HTML_LANG` /
`OG_LOCALE` / `INTL_LOCALE` / label entries), copy a `content/<id>/` folder and
register it in the two maps in `content/index.ts`. Everything else — routing,
metadata, the switcher — follows from `LOCALES`.

The `app/api/*` routes are **not** localized: they answer in English, like any
developer-facing API, and each form picks its own localized message (by status code
where the distinction matters). What the visitor's locale *is* used for is data —
it rides along as `locale` in the lead and booking payloads, so it is stored, gets
forwarded to n8n, and decides the language of the booking confirmation email.
`/admin` and the agency's own notification emails always use the default locale.

## Structure

```
app/            fonts.ts, globals.css
  [[...lang]]/  localized root layout (lang + metadata) + page
  admin/        own root layout + dashboard (backend builds)
  api/          route handlers (backend builds)
components/     landing.tsx (composition root), lang-switcher.tsx
  sections/     header · hero · pains · solutions · showcase · pricing ·
                booking* · customer-access* · contact · footer   (* feature-gated)
  ui/           button, card (Panel/PanelBar/Brackets/Chip), container
  flow-diagram.tsx · call-modal.tsx · cal-embed.tsx · lead-form.tsx
lib/            lang, palettes, features, leads, utils, site-meta,
                mongo/auth/mailer/emails (server-only, backend builds)
content/        types.ts (contract), index.ts (registry), ru/, en/
```
