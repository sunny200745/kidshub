# KidsHub Landing Page

Marketing landing page for **getkidshub.com** — the custom daycare management platform by [Nuvaro](https://nuvaro.ca).

Built with: Vanilla HTML/CSS/JS + Vercel serverless for Aria AI widget.

---

## Folder Structure

```
kidshub-landing/
├── index.html              ← Main landing page
│
├── css/
│   ├── styles.css          ← Main styles (dark theme, pink/purple gradient)
│   └── aria-widget.css     ← Aria AI chatbot widget styles
│
├── js/
│   ├── main.js             ← Nav, scroll reveal, form handling, animations
│   └── aria-widget.js      ← Aria AI widget (chat UI + Claude API integration)
│
├── api/
│   └── chat.js             ← Vercel serverless function (Anthropic Claude proxy + Resend leads)
│
├── assets/
│   └── favicon.svg         ← KidsHub favicon (pink/purple gradient K)
│
├── vercel.json             ← Vercel deployment config
└── README.md               ← This file
```

---

## Deployment to getkidshub.com

### 1. Push to GitHub
```bash
cd kidshub-landing
git init
git add .
git commit -m "Initial KidsHub landing page"
git remote add origin https://github.com/YOUR_USERNAME/kidshub-landing.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repo
3. Vercel auto-detects the `vercel.json` config
4. Click **Deploy**

### 3. Set Environment Variables in Vercel
Go to Project → Settings → Environment Variables and add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |
| `RESEND_API_KEY` | `re_...` (your Resend key) |
| `LEAD_EMAIL` | `hello@getkidshub.com` |

> **Tip:** If you're temporarily on OpenRouter, see the comment in `api/chat.js` for how to swap the endpoint.

### 4. Connect getkidshub.com domain
1. In Vercel → Project → Settings → Domains
2. Add `getkidshub.com` and `www.getkidshub.com`
3. Vercel shows you DNS records to add
4. In your domain registrar (GoDaddy / Namecheap / etc.):
   - Add `A` record pointing to Vercel IP, OR
   - Change nameservers to Vercel's nameservers (easiest)
5. Vercel auto-provisions SSL within minutes

---

## Aria Widget

Aria is a floating AI assistant powered by Claude. It:
- Answers questions about KidsHub features
- Qualifies daycare leads
- Captures contact details (name, email, centre) and emails them to `LEAD_EMAIL` via Resend
- Encourages prospects to book a discovery call

### To update Aria's personality / knowledge:
Edit the `systemPrompt` in `js/aria-widget.js` → `ARIA_CONFIG.systemPrompt`

### To update quick-prompt buttons:
Edit `QUICK_PROMPTS` array in `js/aria-widget.js`

---

## Customisation

### Colors
All brand colors are in CSS variables at the top of `css/styles.css`:
```css
--pink:   #FF2D9B;
--purple: #8B5CF6;
--gradient: linear-gradient(135deg, #FF2D9B 0%, #8B5CF6 100%);
```

### Form submission
The demo request form in `index.html` currently does a simulated send.
To wire it to a real email:
- **Option A (Resend):** Uncomment and adapt the fetch call in `js/main.js`
- **Option B (EmailJS):** Add EmailJS SDK + configure in `js/main.js`
- **Option C (Formspree):** Change form `action` to your Formspree endpoint

### Calendly integration
Replace `https://calendly.com/kidshub` in `index.html` with your real Calendly link.
Or embed the Calendly widget inline by adding their embed script.

---

## Pages to build next
- `/privacy` — Privacy Policy (PIPEDA)
- `/terms` — Terms of Service
- `/features` — Detailed feature pages
- `/blog` — Content marketing

---

Built by [Nuvaro](https://nuvaro.ca) · Langley, BC 🍁
