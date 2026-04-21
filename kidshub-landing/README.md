# kidshub-landing

Public marketing site for **[getkidshub.com](https://getkidshub.com)** — the KidsHub daycare management platform by [Nuvaro](https://nuvaro.ca).

Web-only, lead-capture focused. Intentionally has **no** login or app links — this site exists to attract daycare operators and route them to a demo call, not to serve authenticated users.

This is one of three workspaces in the [`daycares/`](../README.md) monorepo:

- `kidshub-landing/` ← **you are here** (marketing)
- `kidshub-dashboard/` (owner portal, being renamed from `kidshub-owner`)
- `kidshub/` (parent + teacher app, Expo + React Native Web)

## Tech

- Vanilla HTML / CSS / JS (no framework, no build step)
- GSAP for scroll animations (CDN)
- Google Fonts — Nunito + DM Sans
- Calendly widget for demo scheduling
- Vercel serverless `/api/*` for the Aria AI chat widget
  - OpenRouter as the LLM provider (Claude Haiku)
  - Resend for lead-capture email notifications

## Folder layout

```
kidshub-landing/
├── index.html            # Main landing page
├── css/
│   ├── styles.css        # Site styles (dark theme, pink/purple gradient)
│   └── aria-widget.css   # Aria chat widget styles
├── js/
│   ├── main.js           # Nav, scroll reveal, form handling, animations
│   └── aria-widget.js    # Aria chat UI → POSTs to /api/chat
├── api/
│   ├── chat.js           # Vercel serverless: OpenRouter proxy + Resend lead emails
│   └── test.js           # Tiny health check endpoint
├── assets/
│   └── favicon.svg       # Brand favicon (pink gradient "K")
├── vercel.json           # Vercel deploy config (static site + security headers)
├── package.json          # Workspace scripts (dev / build / deploy)
└── README.md
```

## Local development

All commands can be run from the monorepo root or from this folder.

```bash
# From the monorepo root (daycares/)
npm run dev:landing                             # static preview on :3000

# Or from this folder
cd kidshub-landing
npm run dev                                     # static preview on :3000 (no /api/*)
npm run dev:vercel                              # full Vercel sim with /api/* routes
```

- `npm run dev` serves the static files via `npx serve`. Fastest feedback for HTML/CSS/JS edits. The Aria widget will load but chat requests to `/api/chat` will 404.
- `npm run dev:vercel` runs `vercel dev`, which mimics production including `/api/*` serverless routes. Required for testing the Aria widget end-to-end. Install the Vercel CLI once with `npm i -g vercel`.

There is no build step — this is a pure static site. `npm run build` is a no-op.

> **Note for Backbase-proxied laptops:** `curl http://localhost:3000` returns 503 because the corporate proxy intercepts it. Browsers work fine. For curl, use `NO_PROXY=localhost,127.0.0.1 curl ...`.

## Deployment (Vercel)

The landing site is one of three Vercel projects in the monorepo. Its **Root Directory** is `kidshub-landing` (set in the Vercel project settings, not in `vercel.json`).

### Environment variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter key for the Aria chat proxy. Chat 500s without it. |
| `RESEND_API_KEY` | No | Resend key for emailing captured leads. Without it, leads are `console.warn`'d and dropped. |
| `LEAD_EMAIL` | No | Destination for lead notifications. Defaults to `contact@nuvaro.ca`. |

### Deploy

```bash
cd kidshub-landing
npm run deploy    # == vercel --prod
```

Or just push to `main` on GitHub — Vercel deploys automatically on every push. Preview deploys are created for every branch/PR.

### Domains

- Production: `getkidshub.com`, `www.getkidshub.com`
- Previews: `*.vercel.app` (Vercel-assigned)

The CORS allowlist in `api/chat.js` covers all three automatically.

## Aria AI chat widget

The floating 🌸 bubble in the bottom-right is Aria — an AI assistant that explains KidsHub and captures leads. It's made of two moving parts:

- **Client** (`js/aria-widget.js`) — renders the chat UI, manages conversation history, POSTs to `/api/chat`.
- **Server** (`api/chat.js`) — proxies to OpenRouter, detects `LEAD_CAPTURE::{...}` patterns in Aria's replies, and emails captured leads via Resend.

### Tune Aria's personality or knowledge

Edit `ARIA_CONFIG.systemPrompt` in [`js/aria-widget.js`](./js/aria-widget.js). This is what Claude reads before every message — it's the entire source of truth for how Aria talks, what it knows, and when it tries to capture a lead.

### Change the quick-prompt buttons

Edit the `QUICK_PROMPTS` array in [`js/aria-widget.js`](./js/aria-widget.js).

### Change the LLM model

Edit `ARIA_CONFIG.model` in [`js/aria-widget.js`](./js/aria-widget.js) and/or `DEFAULT_MODEL` in [`api/chat.js`](./api/chat.js). OpenRouter supports many models — see their [model catalog](https://openrouter.ai/models).

## Content customization

### Brand colors

All brand colors are CSS variables at the top of [`css/styles.css`](./css/styles.css):

```css
--pink:   #FF2D9B;
--purple: #8B5CF6;
--gradient: linear-gradient(135deg, #FF2D9B 0%, #8B5CF6 100%);
```

### Demo request form

The form posts to [formsubmit.co](https://formsubmit.co). The `action` URL is on `index.html` around line 1392. To change recipient, update the email in the `action` URL there.

### Calendly link

Currently points at `https://calendly.com/nuvarocorp/kidshub-discovery-call`. Two places reference it in `index.html` — search for `calendly.com` and update both.

## Security

- Global security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are applied via `vercel.json`.
- `/api/chat` has a CORS allowlist: production domains, `*.vercel.app` previews, and `localhost`. Anything else is rejected (the default `Access-Control-Allow-Origin` header points back at the production domain).
- No analytics, tracking pixels, cookies, or localStorage. Privacy-respecting by default.
- No CSP yet — intentional, because the site loads from several external origins (Google Fonts, Calendly, jsDelivr). Adding a correct CSP is tracked as future hardening.

## Roadmap (out of scope for the restructure)

- `/privacy` — Privacy Policy (PIPEDA)
- `/terms` — Terms of Service
- `/features` — Deep-dive feature pages
- `/blog` — Content marketing
- CSP header + SRI on CDN scripts

---

Built by [Nuvaro](https://nuvaro.ca) · Langley, BC
