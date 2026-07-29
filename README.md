# template-agency-ai-landing

An EasyLand landing **template** — the **AI Agency / n8n Automation Studio**
vertical. A Russian-language sales landing for an agency that builds AI agents and
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
set by `NEXT_PUBLIC_SITE_PALETTE`.

## Highlights

- **3 dark palettes** — voltage (electric lime, default), ember, plasma.
  Fonts: Geologica + Martian Mono + Golos Text, all with Cyrillic.
- **Interactive node flow** — `components/flow-diagram.tsx` is a miniature
  n8n-style canvas (Заявка ➔ AI-анализ ➔ CRM) with orthogonal connectors carrying
  animated signal packets. Hover or focus a node to light it up.
- **Live architecture demo** — `components/sections/showcase.tsx` walks a lead
  through Входящий лид ➔ AI-анализ ➔ Карточка в CRM ➔ Уведомление в Telegram on a
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

## Content

Single typed source: [`content/site.ts`](content/site.ts) — Russian only. Every
section reads from the `site` object; the copy shipped here is demo content
(brand "Neuroflow", placeholder prices and contacts). Storyblok wiring is TPL-2.

## Structure

```
app/            layout (fonts + palette), page, globals.css, admin/, api/
components/     landing.tsx (composition root)
  sections/     header · hero · pains · solutions · showcase · pricing ·
                booking* · customer-access* · contact · footer   (* feature-gated)
  ui/           button, card (Panel/PanelBar/Brackets/Chip), container
  flow-diagram.tsx · call-modal.tsx · cal-embed.tsx · lead-form.tsx
lib/            palettes, features, leads, utils, site-meta,
                mongo/auth/mailer/emails (server-only, backend builds)
content/site.ts single typed content source (ru)
```
