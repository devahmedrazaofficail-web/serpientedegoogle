# Serpiente de Google 🐍

A fast, original, static Spanish-language Snake game website — pure HTML, CSS and vanilla JavaScript. No frameworks, no build step, no database. Ready to deploy on Vercel.

**Play:** open the homepage and press **Jugar**. Arrow keys / WASD on desktop, swipe or on-screen buttons on mobile. Space pauses. Your best score is saved in your browser.

## Project structure

```
/
├── index.html              # Homepage: playable game + SEO content + FAQ
├── como-jugar.html         # Manual: controls, rules, speed, common mistakes
├── consejos.html            # Tips & strategies guide
├── historia.html           # History of the Snake game
├── contacto.html           # Contact form (opens visitor's email app)
├── privacidad.html         # Privacy policy
├── 404.html                # Not-found page
├── robots.txt
├── sitemap.xml
├── vercel.json             # cleanUrls: true (clean URLs work on refresh/direct visit)
├── assets/
│   ├── css/style.css       # Entire design system (no frameworks)
│   ├── js/game.js          # The Snake game (canvas, keyboard/touch/d-pad, sound)
│   ├── js/main.js          # Nav toggle, FAQ accordion, contact form, footer year
│   └── img/                # Original SVG logo, favicon, illustration + OG cover PNG
├── test-game.js            # Headless logic tests for the game (dev only, `node test-game.js`)
├── README.md
└── SEO-REPORT.md
```

## Before you deploy — 2 things to change

1. **Domain.** The placeholder domain `serpientedegoogle.es` is used in canonicals, Open Graph tags, `sitemap.xml` and `robots.txt`. Replace it everywhere with your real domain:
   ```
   grep -rl "serpientedegoogle.es" --include="*.html" --include="*.xml" --include="*.txt" .
   ```
   Then open `sitemap.xml` and update `<lastmod>` dates if you like.
2. **Contact email.** In `assets/js/main.js`, change `hola@serpientedegoogle.es` to your real email address. (The form opens the visitor's own email app — no backend needed. If you prefer a real form backend later, connect the form to Formspree and replace the mailto logic.)

## Deploy to Vercel (no build command)

**Option A — from GitHub (recommended):**
1. Create a new GitHub repository and upload this folder's contents to its root.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → **Import** the repository.
3. Framework Preset: **Other**. Build Command: *(leave empty)*. Output Directory: *(leave empty)*.
4. Click **Deploy**. Done — Vercel serves it as a static site.

**Option B — drag & drop:** vercel.com → new project → upload this folder directly.

`vercel.json` enables `cleanUrls`, so `/como-jugar` works when visited directly or refreshed (no `.html` needed, no hash routing).

### Custom domain (later)
Vercel project → **Settings → Domains** → add your domain → point your DNS to Vercel (it shows you the exact records). After that, re-run the domain replacement in step 1 with the final domain.

## Local preview

```bash
cd serpiente-google
python3 -m http.server 8000
# open http://localhost:8000/
```
Note: plain `http.server` does not do clean-URL rewrites, so inner pages need their `.html` suffix locally (e.g. `http://localhost:8000/como-jugar.html`). On Vercel the clean URLs work without it.

## Game tests

```bash
node test-game.js   # 30 headless tests: movement, eating, collisions, best-score, win state
```

## Notes

- All code, design, text and images are original (inspired by the genre, not copied from any site).
- No cookies, no tracking, no analytics. Best score uses `localStorage` on the visitor's own device (see `privacidad.html`).
- The footer states the site is not affiliated with Google LLC or Nokia.
